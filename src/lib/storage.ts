import { Lot, ProductionRecord, calculateDates } from './types';

const STORAGE_KEY = 'stock-the-froid-lots';
const HISTORY_KEY = 'stock-the-froid-history';
const COUNTER_KEY = 'stock-the-froid-counter';

function getNextLotId(): string {
  const counter = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10);
  const newCounter = counter + 1;
  localStorage.setItem(COUNTER_KEY, newCounter.toString());
  return String(newCounter).padStart(6, '0');
}

export function getLots(): Lot[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveLots(lots: Lot[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lots));
}

export function getProductionHistory(): ProductionRecord[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveProductionHistory(history: ProductionRecord[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function deleteProductionRecord(recordId: string): ProductionRecord[] {
  const history = getProductionHistory();
  const index = history.findIndex(r => r.id === recordId);
  if (index !== -1) {
    history.splice(index, 1);
  }
  saveProductionHistory(history);
  return history;
}

export function addProductionRecord(arome: string, format: string, quantity: number, productionDate: string): ProductionRecord[] {
  const history = getProductionHistory();
  const record: ProductionRecord = {
    id: `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    arome: arome as any,
    format: format as any,
    quantity,
    productionDate,
    dateAdded: new Date().toISOString(),
  };
  history.unshift(record);
  saveProductionHistory(history);
  return history;
}

export function addOrUpdateLot(arome: string, format: string, quantity: number, productionDate: string, saleLimitDate: string, consumptionLimitDate: string): Lot[] {
  const lots = getLots();
  const trimmedFormat = format.trim();
  const existingLot = lots.find(l => 
    l.arome === arome && 
    l.format.trim() === trimmedFormat && 
    l.productionDate === productionDate
  );
  
  if (existingLot) {
    existingLot.quantity += quantity;
  } else {
    const lot: Lot = {
      id: getNextLotId(),
      arome: arome as any,
      format: trimmedFormat as any,
      quantity,
      productionDate,
      saleLimitDate,
      consumptionLimitDate,
    };
    lots.push(lot);
  }
  
  saveLots(lots);
  addProductionRecord(arome, trimmedFormat, quantity, productionDate);
  return lots;
}

export function addLot(lot: Lot): Lot[] {
  const lots = getLots();
  const existingLot = lots.find(l => 
    l.arome === lot.arome && 
    l.format === lot.format && 
    l.productionDate === lot.productionDate
  );
  
  if (existingLot) {
    existingLot.quantity += lot.quantity;
  } else {
    lots.push(lot);
  }
  
  saveLots(lots);
  return lots;
}

export function removeQuantity(lotId: string, quantity: number): Lot[] {
  const lots = getLots();
  const index = lots.findIndex(l => l.id === lotId);
  if (index !== -1) {
    lots[index].quantity = Math.max(0, lots[index].quantity - quantity);
    if (lots[index].quantity === 0) {
      lots.splice(index, 1);
    }
  }
  saveLots(lots);
  return lots;
}

export function deleteLot(lotId: string): Lot[] {
  const lots = getLots();
  const index = lots.findIndex(l => l.id === lotId);
  if (index !== -1) {
    lots.splice(index, 1);
  }
  saveLots(lots);
  return lots;
}

export function updateLot(lotId: string, quantity: number, productionDate: string): Lot[] {
  const lots = getLots();
  const index = lots.findIndex(l => l.id === lotId);
  if (index !== -1) {
    const dates = calculateDates(productionDate);
    lots[index].quantity = quantity;
    lots[index].productionDate = productionDate;
    lots[index].saleLimitDate = dates.saleLimitDate;
    lots[index].consumptionLimitDate = dates.consumptionLimitDate;
  }
  saveLots(lots);
  return lots;
}
