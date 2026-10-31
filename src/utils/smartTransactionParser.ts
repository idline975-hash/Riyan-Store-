import { SembakoItem } from '../types';
import { getUnitMultiplier, getUnitPrice, formatMultiUnitStock } from './multiUnit';

export interface ParsedTransactionResult {
  success: boolean;
  item?: SembakoItem;
  quantity?: number;
  unit?: string;
  baseQtyRequired?: number;
  unitPrice?: number;
  subtotal?: number;
  remainingStockAfter?: number;
  formattedRemainingStock?: string;
  errorMessage?: string;
}

/**
 * Parses fractional strings like "1/4", "1/2", "3/4", "0.25", "250 gram", "500 ml"
 */
export function parseQuantityAndUnit(raw: string): { quantity: number; unit?: string } {
  const clean = raw.trim().toLowerCase();

  // 1. Gram conversion -> Kg
  const gramMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:gr|gram)$/);
  if (gramMatch) {
    return { quantity: Number(gramMatch[1]) / 1000, unit: 'Kg' };
  }

  // 2. ML conversion -> Liter
  const mlMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:ml|mili)$/);
  if (mlMatch) {
    return { quantity: Number(mlMatch[1]) / 1000, unit: 'Liter' };
  }

  // 3. Simple fractions like 1/4, 1/2, 3/4, 1/8
  const fracMatch = clean.match(/^(\d+)\s*\/\s*(\d+)(.*)$/);
  if (fracMatch) {
    const num = parseFloat(fracMatch[1]);
    const den = parseFloat(fracMatch[2]);
    const remainder = fracMatch[3].trim();
    if (den !== 0) {
      return { quantity: Number((num / den).toFixed(3)), unit: remainder || undefined };
    }
  }

  // 4. Decimal or integer numbers like 0.25, 1.5, 10
  const numMatch = clean.match(/^(\d+(?:\.\d+)?)(.*)$/);
  if (numMatch) {
    const qty = parseFloat(numMatch[1]);
    const remainder = numMatch[2].trim();
    return { quantity: qty, unit: remainder || undefined };
  }

  return { quantity: 1 };
}

/**
 * Normalizes unit string to standard unit label
 */
export function normalizeUnit(rawUnit: string, item?: SembakoItem): string {
  const u = rawUnit.trim().toLowerCase();

  if (['kg', 'kilo', 'kilogram'].includes(u)) return 'Kg';
  if (['l', 'lt', 'ltr', 'liter', 'litre'].includes(u)) return 'Liter';
  if (['rcg', 'renceng', 'rencengan'].includes(u)) return 'Renceng';
  if (['dus', 'box', 'karton', 'kardus', 'ctn'].includes(u)) return 'Dus';
  if (['slop', 'selop', 'slof'].includes(u)) return 'Slop';
  if (['bgk', 'bks', 'bungkus', 'pack', 'pak'].includes(u)) return 'Bungkus';
  if (['pcs', 'pc', 'buah', 'biji', 'saset', 'sachet'].includes(u)) return 'Pcs';
  if (['karung', 'krg', 'sak'].includes(u)) return 'Karung';
  if (['botol', 'btl'].includes(u)) return 'Botol';

  return item ? item.unitBase : 'Pcs';
}

/**
 * Intelligently recognizes product, quantity, and unit from cashier input:
 * Examples:
 * - "gula 1/4 kg"
 * - "minyak 0.5 liter"
 * - "kopi 1 renceng"
 * - "kopi 2 dus"
 * - "rokok 1 slop"
 * - "sampoerna 2 dus"
 * - "8991002101344"
 */
export function parseSmartCustomerInput(
  rawInput: string,
  items: SembakoItem[]
): ParsedTransactionResult {
  const input = rawInput.trim();
  if (!input) {
    return { success: false, errorMessage: 'Input kosong.' };
  }

  // Case 1: Exact Barcode match
  const directBarcodeMatch = items.find((i) => i.barcode === input || i.id === input);
  if (directBarcodeMatch) {
    if (directBarcodeMatch.stock <= 0) {
      return {
        success: false,
        item: directBarcodeMatch,
        errorMessage: `⚠️ Peringatan: Stok "${directBarcodeMatch.name}" habis di toko!`,
      };
    }
    const unit = directBarcodeMatch.unitBase;
    const unitPrice = getUnitPrice(unit, directBarcodeMatch);
    return {
      success: true,
      item: directBarcodeMatch,
      quantity: 1,
      unit,
      baseQtyRequired: 1,
      unitPrice,
      subtotal: unitPrice,
      remainingStockAfter: Math.max(0, directBarcodeMatch.stock - 1),
      formattedRemainingStock: formatMultiUnitStock(directBarcodeMatch.stock - 1, directBarcodeMatch),
    };
  }

  // Case 2: Natural text parsing (e.g. "gula 1/4 kg", "kopi 1 renceng", "rokok 1 slop")
  // Extract words and numerical/fractional tokens
  const tokens = input.split(/\s+/);
  let matchedItem: SembakoItem | undefined;
  let rawQtyStr = '';
  let rawUnitStr = '';

  // Look for target products by common keywords
  const lower = input.toLowerCase();
  if (lower.includes('gula')) {
    matchedItem = items.find((i) => i.name.toLowerCase().includes('gula'));
  } else if (lower.includes('minyak') || lower.includes('curah')) {
    matchedItem = items.find((i) => i.name.toLowerCase().includes('minyak'));
  } else if (lower.includes('kopi') || lower.includes('kapal api')) {
    matchedItem = items.find((i) => i.name.toLowerCase().includes('kopi'));
  } else if (lower.includes('rokok') || lower.includes('sampoerna')) {
    matchedItem = items.find((i) => i.name.toLowerCase().includes('rokok') || i.name.toLowerCase().includes('sampoerna'));
  } else if (lower.includes('indomie') || lower.includes('mie')) {
    matchedItem = items.find((i) => i.name.toLowerCase().includes('indomie') || i.name.toLowerCase().includes('mie'));
  } else if (lower.includes('beras')) {
    matchedItem = items.find((i) => i.name.toLowerCase().includes('beras'));
  } else if (lower.includes('telur')) {
    matchedItem = items.find((i) => i.name.toLowerCase().includes('telur'));
  }

  // Fallback fuzzy search if keyword check didn't match
  if (!matchedItem) {
    for (const item of items) {
      const nameWords = item.name.toLowerCase().split(/\s+/);
      const hasMatch = nameWords.some((w) => w.length > 2 && lower.includes(w));
      if (hasMatch) {
        matchedItem = item;
        break;
      }
    }
  }

  if (!matchedItem) {
    return {
      success: false,
      errorMessage: `Barang atau barcode "${input}" tidak ditemukan dalam inventaris.`,
    };
  }

  // Extract quantity and unit from input string
  // Look for fraction (e.g. 1/4, 1/2) or decimal (0.25, 0.5) or integer (1, 2)
  const fractionMatch = lower.match(/(\d+\s*\/\s*\d+)/);
  const gramMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:gr|gram)/);
  const mlMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:ml|mili)/);
  const decimalMatch = lower.match(/(?:^|\s)(\d+\.\d+)(?:\s|$|[a-z])/);
  const intMatch = lower.match(/(?:^|\s)(\d+)(?:\s|$|[a-z])/);

  let parsedQty = 1;

  if (gramMatch) {
    parsedQty = parseFloat(gramMatch[1]) / 1000;
    rawUnitStr = 'Kg';
  } else if (mlMatch) {
    parsedQty = parseFloat(mlMatch[1]) / 1000;
    rawUnitStr = 'Liter';
  } else if (fractionMatch) {
    const parts = fractionMatch[1].split('/');
    parsedQty = parseFloat(parts[0]) / parseFloat(parts[1]);
  } else if (decimalMatch) {
    parsedQty = parseFloat(decimalMatch[1]);
  } else if (intMatch) {
    parsedQty = parseFloat(intMatch[1]);
  }

  // Detect unit keyword in input
  const knownUnits = ['kg', 'kilo', 'liter', 'ltr', 'lt', 'renceng', 'dus', 'slop', 'bungkus', 'pcs', 'saset'];
  for (const u of knownUnits) {
    if (new RegExp(`\\b${u}\\b`, 'i').test(lower)) {
      rawUnitStr = u;
      break;
    }
  }

  // If no unit specified, infer best unit for the item
  let finalUnit = rawUnitStr ? normalizeUnit(rawUnitStr, matchedItem) : matchedItem.unitBase;

  // If fraction was specified for multi-unit item like Kopi/Rokok and no unit given:
  // e.g. "kopi 1/4" -> 0.25 Dus (1 Renceng)
  if (fractionMatch && !rawUnitStr) {
    if (matchedItem.unitBase === 'Kg' || matchedItem.unitBase === 'Liter') {
      finalUnit = matchedItem.unitBase;
    } else if (matchedItem.multiUnit?.dusQty) {
      finalUnit = 'Dus';
    }
  }

  // Calculate base quantity required to deduct
  const multiplier = getUnitMultiplier(finalUnit, matchedItem);
  const cleanQty = Number(parsedQty.toFixed(3));
  const baseQtyRequired = cleanQty * multiplier;

  // Stock check: Rule 4 ("Jika stok habis/tidak cukup, berikan peringatan.")
  if (matchedItem.stock <= 0) {
    return {
      success: false,
      item: matchedItem,
      errorMessage: `⚠️ Peringatan: Stok barang "${matchedItem.name}" saat ini HABIS (0 ${matchedItem.unitBase})!`,
    };
  }

  if (baseQtyRequired > matchedItem.stock) {
    const currentStockFormatted = formatMultiUnitStock(matchedItem.stock, matchedItem);
    return {
      success: false,
      item: matchedItem,
      errorMessage: `⚠️ Peringatan: Stok "${matchedItem.name}" tidak mencukupi! Diminta: ${cleanQty} ${finalUnit} (${baseQtyRequired} ${matchedItem.unitBase}), sedangkan sisa stok fisik hanya ${currentStockFormatted}.`,
    };
  }

  const unitPrice = getUnitPrice(finalUnit, matchedItem);
  const subtotal = Math.round(cleanQty * unitPrice);
  const remainingStockAfter = Math.max(0, Number((matchedItem.stock - baseQtyRequired).toFixed(3)));
  const formattedRemainingStock = formatMultiUnitStock(remainingStockAfter, matchedItem);

  return {
    success: true,
    item: matchedItem,
    quantity: cleanQty,
    unit: finalUnit,
    baseQtyRequired,
    unitPrice,
    subtotal,
    remainingStockAfter,
    formattedRemainingStock,
  };
}
