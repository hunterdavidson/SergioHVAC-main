import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { EstimateService, EstimateInputs, EstimateResult } from './estimate.service';
import { PRICING_CONFIG } from './pricing-config';
import { SettingsService } from '../core/settings.service';

@Component({
  selector: 'app-estimate-calculator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './estimate-calculator.component.html',
  styleUrls: ['./estimate-calculator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstimateCalculatorComponent {
  private fb = inject(FormBuilder);
  private svc = inject(EstimateService);
  private settingsSvc = inject(SettingsService);

  config = this.mergeConfigWithSettings();

  form = this.fb.group({
    // Customer/Site
    zip: ['', [Validators.required, Validators.pattern(/^[0-9]{5}$/)]],
    city: ['', [Validators.required]],
    address: [''],
    homeSqft: [2000, [Validators.required, Validators.min(500), Validators.max(8000)]],
    systems: [1, [Validators.required, Validators.min(1)]],
    systemAge: [10, [Validators.min(0), Validators.max(40)]],
    access: ['standard', Validators.required],
    atticOrCrawl: [false],
    isCommercial: [false],

    // Service/System
    serviceType: ['replacement', Validators.required],
    systemType: ['ac_split', Validators.required],
    tonnage: ['3.0'],
    furnaceBtu: ['60000'],
    efficiencyTier: ['SEER2_16'],

    // Scope/Add-ons
    ductScope: ['none'],
    // simplified: hide advanced add-ons in UI; keep defaults off
    electricalUpgrade: [false],
    lineSet: [false],
    condenserPad: [false],
    whipDisconnect: [false],
    thermostat: ['none'],
    refrigerantType: ['none'],
    refrigerantLbs: [0, [Validators.min(0), Validators.max(50)]],
    permit: [true],
    crane: [false],
    disposal: [true],
    afterHours: [false],

    // Labor
    // simplified labor UI: per-job only
    crewSize: [Number(this.config.perJob.defaultCrewSize), [Validators.min(1), Validators.max(8)]],
    perWorkerPerJob: [Math.round((this.config.perJob.perWorkerPerJobLow + this.config.perJob.perWorkerPerJobHigh)/2)],
    seasonal: ['normal'],

    // Contact (optional for PDF header)
    customerName: [''],
    customerEmail: [''],
    customerPhone: [''],
  });

  // Manual calculation trigger (simpler UX)
  resultSig = signal<EstimateResult | null>(null);

  // UI helpers
  gbbOptions = computed(() => {
    const v = this.form.value;
    const st = v.systemType;
    const tn = v.tonnage as string;
    const fb = v.furnaceBtu as string;
    const options: { key: string; label: string }[] = [];
    if (st === 'ac_split') options.push({ key: 'SEER2_14', label: 'Good (SEER2 14)' }, { key: 'SEER2_16', label: 'Better (SEER2 16)' }, { key: 'SEER2_18', label: 'Best (SEER2 18)' });
    else if (st === 'heat_pump') options.push({ key: 'SEER2_15', label: 'Good (SEER2 15)' }, { key: 'SEER2_17', label: 'Better (SEER2 17)' }, { key: 'SEER2_19', label: 'Best (SEER2 19)' });
    else if (st === 'gas_furnace') options.push({ key: 'AFUE_80', label: 'Good (AFUE 80%)' }, { key: 'AFUE_92', label: 'Better (AFUE 92%)' }, { key: 'AFUE_96', label: 'Best (AFUE 96%)' });
    else options.push({ key: v.efficiencyTier || 'SEER2_16', label: 'Standard' });
    return options;
  });

  // Actions
  print() { window.print(); }

  async copyShareLink() {
    const data = JSON.stringify({ f: this.form.getRawValue(), t: Date.now() });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    try {
      await navigator.clipboard.writeText(url);
      alert('Share link copied to clipboard.');
    } catch {
      prompt('Copy this link:', url);
    }
  }

  pickCrew(size: number) {
    this.form.patchValue({ crewSize: size as any });
  }

  // Template helpers for typed indexing
  accessMult() {
    const key = this.form.get('access')?.value as 'easy'|'standard'|'difficult';
    return this.config.accessMultipliers[key] ?? 1;
  }
  seasonalMult() {
    const key = this.form.get('seasonal')?.value as 'normal'|'summer';
    return this.config.seasonalMultipliers[key] ?? 1;
  }

  calculate() {
    this.form.markAllAsTouched();
    if (this.form.invalid) { return; }
    const v = this.form.getRawValue() as any as EstimateInputs;
    // Ensure per-job by default in simplified mode
    (v as any).laborMode = 'perJob';
    // Force default crew size and mid per-worker-per-job (hide labor choices)
    const mid = Math.round((this.config.perJob.perWorkerPerJobLow + this.config.perJob.perWorkerPerJobHigh) / 2);
    (v as any).crewSize = this.config.perJob.defaultCrewSize;
    (v as any).perWorkerPerJob = mid;
    this.resultSig.set(this.svc.estimateCost(v, this.config));
    // optional: scroll to result
    setTimeout(() => {
      const el = document.querySelector('#estimate-result');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  resetEstimate() {
    // Clear the current result and reset the form to sane defaults
    this.resultSig.set(null);
    this.form.reset({
      zip: '',
      city: '',
      address: '',
      homeSqft: 2000,
      systems: 1,
      systemAge: 10,
      access: 'standard',
      atticOrCrawl: false,
      isCommercial: false,
      serviceType: 'replacement',
      systemType: 'ac_split',
      tonnage: '3.0',
      furnaceBtu: '60000',
      efficiencyTier: 'SEER2_16',
      ductScope: 'none',
      electricalUpgrade: false,
      lineSet: false,
      condenserPad: false,
      whipDisconnect: false,
      thermostat: 'none',
      refrigerantType: 'none',
      refrigerantLbs: 0,
      permit: true,
      crane: false,
      disposal: true,
      afterHours: false,
      crewSize: Number(this.config.perJob.defaultCrewSize),
      perWorkerPerJob: Math.round((this.config.perJob.perWorkerPerJobLow + this.config.perJob.perWorkerPerJobHigh)/2),
      seasonal: 'normal',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
    });
    // Ensure validation state is clean
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private mergeConfigWithSettings() {
    const cfg: any = structuredClone(PRICING_CONFIG);
    const est = this.settingsSvc.value?.estimate;
    if (!est) return cfg;
    if (typeof est.taxRate === 'number') cfg.tax.rate = est.taxRate;
    if (typeof (est as any).laborTaxResidential === 'boolean') (cfg.tax as any).laborTaxResidential = (est as any).laborTaxResidential;
    if (typeof (est as any).laborTaxCommercial === 'boolean') (cfg.tax as any).laborTaxCommercial = (est as any).laborTaxCommercial;
    if (typeof est.overheadPct === 'number') cfg.overheadPct = est.overheadPct;
    if (est.seasonalMultipliers) cfg.seasonalMultipliers = { ...cfg.seasonalMultipliers, ...est.seasonalMultipliers };
    if (est.accessMultipliers) cfg.accessMultipliers = { ...cfg.accessMultipliers, ...est.accessMultipliers };
    if (typeof est.afterHoursMultiplier === 'number') cfg.afterHoursMultiplier = est.afterHoursMultiplier;
    if (typeof est.permitFlat === 'number') cfg.addOnPrices.permitFlat = est.permitFlat;
    if (est.perJob) cfg.perJob = { ...cfg.perJob, ...est.perJob };
    if (est.zipPrefixes) cfg.zipPrefixes = { ...cfg.zipPrefixes, ...est.zipPrefixes };
    if (typeof est.targetMargin === 'number') (cfg as any).targetMargin = est.targetMargin;
    if (est.addOnPrices) cfg.addOnPrices = { ...cfg.addOnPrices, ...est.addOnPrices,
      refrigerant: { ...cfg.addOnPrices.refrigerant, ...(est.addOnPrices.refrigerant ?? {}) },
      smartThermostat: { ...cfg.addOnPrices.smartThermostat, ...(est.addOnPrices.smartThermostat ?? {}) },
      basicThermostat: { ...cfg.addOnPrices.basicThermostat, ...(est.addOnPrices.basicThermostat ?? {}) },
    } as any;
    if (est.ductworkAddersHours) cfg.ductworkAddersHours = { ...cfg.ductworkAddersHours, ...est.ductworkAddersHours } as any;
    if (typeof est.goodBetterBest === 'boolean') (cfg as any).goodBetterBest = est.goodBetterBest;
    return cfg;
  }
}
