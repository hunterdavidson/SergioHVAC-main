import { Injectable } from '@angular/core';
import { PRICING_CONFIG, PricingConfig } from './pricing-config';

export type ServiceType = 'repair' | 'replacement' | 'new_install' | 'maintenance';
export type SystemType = 'ac_split' | 'heat_pump' | 'gas_furnace' | 'package' | 'mini_split';
export type AccessLevel = 'easy' | 'standard' | 'difficult';
export type DuctScope = 'none' | 'minor' | 'moderate' | 'major';

export interface EstimateInputs {
  // Customer/Site
  zip?: string;
  city?: string;
  address?: string;
  homeSqft: number; // 500–8000
  systems: number; // >=1
  systemAge?: number;
  access: AccessLevel;
  atticOrCrawl: boolean;
  isCommercial: boolean;

  // Service type & system
  serviceType: ServiceType;
  systemType: SystemType;
  tonnage?: string; // e.g., '2.0','3.0','5.0'
  furnaceBtu?: string; // '60000' | '100000'
  efficiencyTier?: string; // e.g., SEER2_14, SEER2_16, etc.

  // Scope / add-ons
  ductScope: DuctScope;
  electricalUpgrade: boolean;
  lineSet: boolean;
  condenserPad: boolean;
  whipDisconnect: boolean;
  thermostat: 'none' | 'basic' | 'smart';
  permit: boolean;
  crane: boolean;
  disposal: boolean;
  afterHours: boolean;
  refrigerantType?: 'none' | 'R410A' | 'R22';
  refrigerantLbs?: number;

  // Labor mode
  laborMode: 'perJob' | 'perHour';
  crewSize: number; // used in both modes
  perWorkerPerJob?: number; // per-job mid value by default
  techHours?: number; // per system for hourly mode
  seasonal: 'normal' | 'summer';
}

export interface EstimateBreakdownItem { label: string; amount: number; note?: string; }
export interface EstimateResult {
  materials: number;
  labor: number;
  overhead: number;
  fees: number;
  regionMultiplier: number;
  cost: number;
  price: number; // 40% margin target
  tax: number;
  total: number;
  marginPct: number; // implied gross margin based on price, cost, tax
  breakdown: EstimateBreakdownItem[];
}

function dollars(n: number) { return Math.max(0, Math.round(n * 100) / 100); }
function roundTo25(n: number) { return Math.round(n / 25) * 25; }

@Injectable({ providedIn: 'root' })
export class EstimateService {
  constructor() {}

  estimateCost(input: EstimateInputs, cfg: PricingConfig = PRICING_CONFIG): EstimateResult {
    const breakdown: EstimateBreakdownItem[] = [];

    // 1) Materials: equipment base + add-ons + consumables
    const equipment = this.computeEquipmentCost(input, cfg);
    if (equipment > 0) breakdown.push({ label: 'Equipment', amount: equipment });

    const addOns = this.computeAddOns(input, cfg);
    Object.entries(addOns.items).forEach(([label, amount]) => {
      if (amount > 0) breakdown.push({ label, amount });
    });
    const materials = dollars(equipment + addOns.total);

    // 2) Labor
    let laborBase = 0;
    if (!input.laborMode || input.laborMode === 'perJob') {
      const perWorkerPerJob = input.perWorkerPerJob ?? Math.round((cfg.perJob.perWorkerPerJobLow + cfg.perJob.perWorkerPerJobHigh) / 2);
      laborBase = perWorkerPerJob * input.crewSize;
    } else {
      const hours = Math.max(0, input.techHours || 0);
      laborBase = (cfg.perHour.hourlyRatePerTech * input.crewSize) * hours;
      // Optional: apply ductwork time adders in hourly mode
      const ductHours = cfg.ductworkAddersHours[input.ductScope] || 0;
      if (ductHours > 0) {
        const ductAdder = ductHours * cfg.perHour.hourlyRatePerTech * input.crewSize;
        breakdown.push({ label: 'Ductwork labor adder', amount: dollars(ductAdder), note: `${ductHours}h @ ${cfg.perHour.hourlyRatePerTech}/tech` });
        laborBase += ductAdder;
      }
    }
    // Apply labor multipliers
    const accessMult = cfg.accessMultipliers[input.access] ?? 1.0;
    const seasonalMult = cfg.seasonalMultipliers[input.seasonal] ?? 1.0;
    const afterHoursMult = input.afterHours ? cfg.afterHoursMultiplier : 1.0;
    const labor = dollars(laborBase * accessMult * seasonalMult * afterHoursMult);
    if (labor > 0) breakdown.push({ label: 'Labor', amount: labor, note: this.describeLaborMults(accessMult, seasonalMult, afterHoursMult) });

    // 3) Overhead: on materials + labor
    const overhead = dollars(cfg.overheadPct * (materials + labor));
    if (overhead > 0) breakdown.push({ label: 'Overhead', amount: overhead, note: `${Math.round(cfg.overheadPct*100)}%` });

    // 4) Fees
    const fees = this.computeFees(input, cfg, breakdown);

    // 5) Regional multiplier by ZIP prefix
    const prefix = (input.zip || '').slice(0, 3);
    const regionMultiplier = cfg.zipPrefixes[prefix as keyof typeof cfg.zipPrefixes] || 1.0;
    if (regionMultiplier !== 1.0) breakdown.push({ label: 'Regional factor', amount: 0, note: `×${regionMultiplier.toFixed(2)}` });

    // 6) Cost
    const preRegion = materials + labor + overhead + fees;
    const cost = dollars(preRegion * regionMultiplier);

    // 7) Price for configured margin (default 40%)
    const margin = (cfg as any).targetMargin ?? 0.40;
    const clampMargin = Math.max(0, Math.min(0.95, margin));
    const targetPrice = roundTo25(cost / (1 - clampMargin));

    // 8) Tax (configurable labor tax flags)
    const laborTaxable = input.isCommercial
      ? (cfg.tax as any).laborTaxCommercial ?? true
      : (cfg.tax as any).laborTaxResidential ?? false;
    const taxableBase = materials + (laborTaxable ? labor : 0);
    const tax = dollars(cfg.tax.rate * taxableBase);

    const total = dollars(targetPrice + tax);
    const marginPct = dollars(((targetPrice - cost) / targetPrice) * 100);

    return { materials, labor, overhead, fees, regionMultiplier, cost, price: targetPrice, tax, total, marginPct, breakdown };
  }

  private computeEquipmentCost(input: EstimateInputs, cfg: PricingConfig): number {
    const count = Math.max(1, input.systems || 1);
    if (input.serviceType === 'replacement' || input.serviceType === 'new_install') {
      if (input.systemType === 'ac_split' || input.systemType === 'heat_pump') {
        const size = input.tonnage || '3.0';
        const map = cfg.equipmentBasePrices[input.systemType as 'ac_split'|'heat_pump'];
        const tiers = map?.[size as keyof typeof map];
        const tierKey = input.efficiencyTier && (tiers as any)?.[input.efficiencyTier] ? input.efficiencyTier : Object.keys(tiers || {})[1];
        const price = (tiers as any)?.[tierKey] || 0;
        return price * count;
      }
      if (input.systemType === 'gas_furnace') {
        const btu = input.furnaceBtu || '60000';
        const tiers = cfg.equipmentBasePrices.gas_furnace[btu as '60000'|'100000'];
        const tierKey = input.efficiencyTier && (tiers as any)?.[input.efficiencyTier] ? input.efficiencyTier : Object.keys(tiers || {})[1];
        const price = (tiers as any)?.[tierKey] || 0;
        return price * count;
      }
      if (input.systemType === 'mini_split') {
        const map = cfg.equipmentBasePrices.mini_split;
        const key = (input.tonnage as any) || '12k';
        const price = (map as any)?.[key]?.base || 0;
        return price * count;
      }
      // package: treat similar to ac_split 3.0 SEER2_16 baseline
      const pkg = cfg.equipmentBasePrices.ac_split['3.0']?.SEER2_16 || 0;
      return pkg * count;
    }

    // Repairs/Maintenance: equipment base typically $0
    return 0;
  }

  private computeAddOns(input: EstimateInputs, cfg: PricingConfig): { total: number; items: Record<string, number> } {
    const items: Record<string, number> = {};
    const add = (label: string, amount: number) => { if (amount > 0) items[label] = amount; };

    if (input.electricalUpgrade) add('Electrical upgrade', cfg.addOnPrices.electricalUpgrade);
    if (input.lineSet) add('Line set', cfg.addOnPrices.lineSet);
    if (input.condenserPad) add('Condenser pad', cfg.addOnPrices.condenserPad);
    if (input.whipDisconnect) add('Whip/Disconnect', cfg.addOnPrices.whipDisconnect);
    if (input.thermostat === 'basic') add(cfg.addOnPrices.basicThermostat.label, cfg.addOnPrices.basicThermostat.price);
    if (input.thermostat === 'smart') add(cfg.addOnPrices.smartThermostat.label, cfg.addOnPrices.smartThermostat.price);

    if (input.serviceType === 'repair' && input.refrigerantType && input.refrigerantType !== 'none' && input.refrigerantLbs) {
      const perLb = cfg.addOnPrices.refrigerant[input.refrigerantType];
      if (perLb) add(`Refrigerant ${input.refrigerantType} (${input.refrigerantLbs} lb)`, perLb * input.refrigerantLbs);
    }

    const total = Object.values(items).reduce((a, b) => a + b, 0);
    return { total, items };
  }

  private computeFees(input: EstimateInputs, cfg: PricingConfig, breakdown: EstimateBreakdownItem[]): number {
    let fees = 0;
    if (input.permit) { fees += cfg.addOnPrices.permitFlat; breakdown.push({ label: 'Permit fee', amount: cfg.addOnPrices.permitFlat }); }
    if (input.crane) { fees += cfg.addOnPrices.craneFee; breakdown.push({ label: 'Crane/Hoist', amount: cfg.addOnPrices.craneFee }); }
    if (input.disposal) { fees += cfg.addOnPrices.disposalFee; breakdown.push({ label: 'Haul-away/Disposal', amount: cfg.addOnPrices.disposalFee }); }
    return fees;
  }

  private describeLaborMults(a: number, s: number, h: number): string | undefined {
    const parts: string[] = [];
    if (a !== 1) parts.push(`access ×${a.toFixed(2)}`);
    if (s !== 1) parts.push(`season ×${s.toFixed(2)}`);
    if (h !== 1) parts.push(`after-hours ×${h.toFixed(2)}`);
    return parts.length ? parts.join(', ') : undefined;
  }
}
