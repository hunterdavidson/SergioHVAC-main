export const PRICING_CONFIG = {
  region: 'DFW',
  zipPrefixes: { '760': 1.00, '761': 1.02, '750': 1.03 },
  targetMargin: 0.40, // 40% gross margin
  tax: {
    rate: 0.0825,
    laborTaxResidential: false,
    laborTaxCommercial: true,
  },

  overheadPct: 0.12,
  seasonalMultipliers: { normal: 1.00, summer: 1.10 },
  accessMultipliers: { easy: 0.95, standard: 1.00, difficult: 1.15 },
  afterHoursMultiplier: 1.25,

  laborMode: 'perJob' as const,
  perJob: {
    perWorkerPerJobLow: 300,
    perWorkerPerJobHigh: 400,
    defaultCrewSize: 3,
    altCrewSize: 4,
  },
  perHour: {
    hourlyRatePerTech: 95,
    defaultCrewSize: 3,
  },

  baselineHours: {
    acSplitChangeout: { min: 4, max: 8 },
    furnaceReplace: { min: 4, max: 8 },
    heatPumpReplace: { min: 6, max: 9 },
    miniSplitSingle: { min: 4, max: 6 },
    miniSplitExtraHead: { min: 4, max: 6 },
    electricalUpgrade: 2,
    lineSetReplace: 2,
  },

  equipmentBasePrices: {
    ac_split: {
      '2.0': { SEER2_14: 2200, SEER2_16: 2700, SEER2_18: 3400 },
      '3.0': { SEER2_14: 2600, SEER2_16: 3200, SEER2_18: 4000 },
      '5.0': { SEER2_14: 3400, SEER2_16: 4200, SEER2_18: 5200 },
    },
    heat_pump: {
      '2.0': { SEER2_15: 2600, SEER2_17: 3300, SEER2_19: 4200 },
      '3.0': { SEER2_15: 3100, SEER2_17: 3900, SEER2_19: 4900 },
      '5.0': { SEER2_15: 4200, SEER2_17: 5200, SEER2_19: 6500 },
    },
    gas_furnace: {
      '60000': { AFUE_80: 900, AFUE_92: 1200, AFUE_96: 1600 },
      '100000': { AFUE_80: 1200, AFUE_92: 1500, AFUE_96: 2000 },
    },
    mini_split: {
      '9k': { base: 1100 },
      '12k': { base: 1300 },
      '18k': { base: 1700 },
      '24k': { base: 2100 },
    },
  },

  addOnPrices: {
    permitFlat: 175,
    lineSet: 380,
    condenserPad: 120,
    whipDisconnect: 95,
    electricalUpgrade: 350,
    smartThermostat: { label: 'Smart (Ecobee3 Lite)', price: 250 },
    basicThermostat: { label: 'Basic (Honeywell T4)', price: 85 },
    craneFee: 550,
    disposalFee: 95,
    refrigerant: {
      R410A: 65, // per lb (example reference)
      R22: 120, // premium per lb
    },
  },

  ductworkAddersHours: { none: 0, minor: 6, moderate: 12, major: 20 },

  goodBetterBest: true,
  showFinancing: false,
} as const;

export type PricingConfig = typeof PRICING_CONFIG;
