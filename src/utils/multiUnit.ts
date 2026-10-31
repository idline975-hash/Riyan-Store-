import { SembakoItem } from '../types';

/**
 * Formats base stock count into human readable breakdown:
 * - Kopi: "7 Dus, 2 Renceng, 5 Pcs"
 * - Rokok: "1 Dus, 3 Slop, 4 Bungkus"
 * - Gula / Minyak: "998.75 Kg" / "499.5 Liter"
 */
export function formatMultiUnitStock(totalBaseQty: number, item?: SembakoItem): string {
  if (totalBaseQty <= 0) {
    return `0 ${item?.unitBase || 'Pcs'}`;
  }

  // 1. Weight or Volume items (Kg, Liter)
  if (item?.unitBase === 'Kg' || item?.unitBase === 'Liter') {
    const cleanDec = Number(totalBaseQty.toFixed(3));
    return `${cleanDec} ${item.unitBase}`;
  }

  // 2. Cigarette items with Slop & Dus (Rokok Sampoerna)
  const isRokokItem =
    item?.multiUnit?.slopQty !== undefined ||
    (item?.unitConversion && item.unitConversion.toLowerCase().includes('slop')) ||
    (item?.name && item.name.toLowerCase().includes('rokok'));

  if (isRokokItem) {
    const dusSize = item?.multiUnit?.dusQty || 400; // 1 Dus = 400 Bungkus
    const slopSize = item?.multiUnit?.slopQty || 10; // 1 Slop = 10 Bungkus

    const dus = Math.floor(totalBaseQty / dusSize);
    const remainderAfterDus = totalBaseQty % dusSize;
    const slop = Math.floor(remainderAfterDus / slopSize);
    const bungkus = remainderAfterDus % slopSize;

    const parts: string[] = [];
    if (dus > 0) parts.push(`${dus} Dus`);
    if (slop > 0) parts.push(`${slop} Slop`);
    if (bungkus > 0 || parts.length === 0) parts.push(`${bungkus} Bungkus`);

    return parts.join(', ');
  }

  // 3. Multi-unit items with Renceng & Dus (Kopi Kapal Api)
  const isKopiItem =
    item?.multiUnit?.rencengQty !== undefined ||
    (item?.unitConversion && item.unitConversion.toLowerCase().includes('renceng')) ||
    (item?.name && item.name.toLowerCase().includes('kopi'));

  if (isKopiItem) {
    const dusSize = item?.multiUnit?.dusQty || 40;
    const rencengSize = item?.multiUnit?.rencengQty || 10;

    const dus = Math.floor(totalBaseQty / dusSize);
    const remainderAfterDus = totalBaseQty % dusSize;
    const renceng = Math.floor(remainderAfterDus / rencengSize);
    const pcs = remainderAfterDus % rencengSize;

    const parts: string[] = [];
    if (dus > 0) parts.push(`${dus} Dus`);
    if (renceng > 0) parts.push(`${renceng} Renceng`);
    if (pcs > 0 || parts.length === 0) parts.push(`${pcs} Pcs`);

    return parts.join(', ');
  }

  return `${totalBaseQty} ${item?.unitBase || 'Pcs'}`;
}

/**
 * Gets base units multiplier for selected unit
 * - Dus: 400 (for Rokok) or 40 (for Kopi)
 * - Slop: 10 Bungkus
 * - Renceng: 10 Pcs
 * - Kg, Liter, Pcs, Bungkus: 1
 */
export function getUnitMultiplier(unit: string, item: SembakoItem): number {
  const normalized = unit.toLowerCase();
  if (normalized === 'dus') {
    if (item.multiUnit?.dusQty) return item.multiUnit.dusQty;
    if (item.name.toLowerCase().includes('rokok') || item.unitConversion?.toLowerCase().includes('slop')) {
      return 400;
    }
    return 40;
  }
  if (normalized === 'slop') {
    return item.multiUnit?.slopQty || 10;
  }
  if (normalized === 'renceng') {
    return item.multiUnit?.rencengQty || 10;
  }
  return 1; // Pcs / Kg / Liter / Bungkus
}

/**
 * Gets price per selected unit
 */
export function getUnitPrice(unit: string, item: SembakoItem, priceType: 'retail' | 'wholesale' = 'retail'): number {
  const normalized = unit.toLowerCase();
  if (normalized === 'dus') {
    if (item.multiUnit?.dusPrice) return item.multiUnit.dusPrice;
    return item.sellPrice * getUnitMultiplier('dus', item);
  }
  if (normalized === 'slop') {
    if (item.multiUnit?.slopPrice) return item.multiUnit.slopPrice;
    return item.sellPrice * getUnitMultiplier('slop', item);
  }
  if (normalized === 'renceng') {
    if (item.multiUnit?.rencengPrice) return item.multiUnit.rencengPrice;
    return item.sellPrice * getUnitMultiplier('renceng', item);
  }
  return priceType === 'wholesale' ? item.wholesalePrice : item.sellPrice;
}

