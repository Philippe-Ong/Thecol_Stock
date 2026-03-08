export type Arome = string;

export type Format = string;

export interface Lot {
  id: string;
  arome: Arome;
  format: Format;
  quantity: number;
  productionDate: string;
  saleLimitDate: string;
  consumptionLimitDate: string;
}

export interface ProductionRecord {
  id: string;
  arome: Arome;
  format: Format;
  quantity: number;
  productionDate: string;
  dateAdded: string;
}

const DEFAULT_AROMES = ['hibiscus', 'mure sauvage', 'poire à botzi', 'sureau', 'herbes des alpes'];
const DEFAULT_FORMATS = ['0.25l', '0.5l', '1l'];

const AROMES_KEY = 'stock-the-froid-aromes';
const FORMATS_KEY = 'stock-the-froid-formats';

export function getAROMES(): Arome[] {
  if (typeof window === 'undefined') return DEFAULT_AROMES;
  const stored = localStorage.getItem(AROMES_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_AROMES;
}

export function getFORMATS(): Format[] {
  if (typeof window === 'undefined') return DEFAULT_FORMATS;
  const stored = localStorage.getItem(FORMATS_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_FORMATS;
}

export function saveAROMES(aromes: Arome[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AROMES_KEY, JSON.stringify(aromes));
}

export function saveFORMATS(formats: Format[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FORMATS_KEY, JSON.stringify(formats));
}

export function addArome(arome: Arome): Arome[] {
  const aromas = getAROMES();
  if (!aromas.includes(arome)) {
    aromas.push(arome);
    saveAROMES(aromas);
  }
  return aromas;
}

export function removeArome(arome: Arome): Arome[] {
  const aromas = getAROMES().filter(a => a !== arome);
  saveAROMES(aromas);
  return aromas;
}

export function addFormat(format: Format): Format[] {
  const formats = getFORMATS();
  if (!formats.includes(format)) {
    formats.push(format);
    saveFORMATS(formats);
  }
  return formats;
}

export function removeFormat(format: Format): Format[] {
  const formats = getFORMATS().filter(f => f !== format);
  saveFORMATS(formats);
  return formats;
}

export const AROMES = getAROMES();
export const FORMATS = getFORMATS();

export function calculateDates(productionDate: string): { saleLimitDate: string; consumptionLimitDate: string } {
  const prod = new Date(productionDate);
  
  const saleLimit = new Date(prod);
  saleLimit.setMonth(saleLimit.getMonth() + 1);
  
  const consumptionLimit = new Date(prod);
  consumptionLimit.setMonth(consumptionLimit.getMonth() + 6);
  
  return {
    saleLimitDate: saleLimit.toISOString().split('T')[0],
    consumptionLimitDate: consumptionLimit.toISOString().split('T')[0],
  };
}

export function getStatus(lot: Lot): 'ok' | 'warning' | 'expired' {
  const now = new Date();
  const saleLimit = new Date(lot.saleLimitDate);
  const consumptionLimit = new Date(lot.consumptionLimitDate);
  
  if (now > consumptionLimit) return 'expired';
  if (now > saleLimit) return 'warning';
  return 'ok';
}

export function isSellable(lot: Lot): boolean {
  return getStatus(lot) === 'ok';
}
