import { Product } from './types';

/**
 * Normalizes text for Venezuelan retail search:
 * - Accents / diacritics removed (á -> a)
 * - Lowercase & whitespace trimmed
 * - P.A.N. -> pan
 * - Size units normalized: 1 lt / 1 litro / 1l -> 1l, 1 kg -> 1kg, 500 gr -> 500g, 355 ml -> 355ml
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  let norm = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  // Normalize punctuation in brand names (e.g. p.a.n. -> pan)
  norm = norm.replace(/\bp\.?a\.?n\.?\b/g, 'pan');

  // Normalize numbers with comma: 1,5 -> 1.5
  norm = norm.replace(/(\d+),(\d+)/g, '$1.$2');

  // Normalize liquid volume units:
  // 1 litro, 1 lts, 1 lt, 1 l, 1l -> 1l
  norm = norm.replace(/(\d+(?:\.\d+)?)\s*(?:litros?|lts?|lt|l)\b/g, '$1l');
  // 355 mililitros, 355 mls, 355 ml, 355ml -> 355ml
  norm = norm.replace(/(\d+(?:\.\d+)?)\s*(?:mililitros?|mls?|ml)\b/g, '$1ml');

  // Normalize weight units:
  // 1 kilo, 1 kgs, 1 kg, 1 k -> 1kg
  norm = norm.replace(/(\d+(?:\.\d+)?)\s*(?:kilos?|kgs?|kg|k)\b/g, '$1kg');
  // 500 gramos, 500 grs, 500 gr, 500 g -> 500g
  norm = norm.replace(/(\d+(?:\.\d+)?)\s*(?:gramos?|grs?|gr|g)\b/g, '$1g');

  // Clean remaining unwanted special characters except dots/numbers/letters
  norm = norm.replace(/[^a-z0-9\.\s]/g, ' ').replace(/\s+/g, ' ').trim();

  return norm;
}

export interface MatchResult {
  matches: boolean;
  score: number;
  isExact: boolean;
}

/**
 * Checks if a product satisfies the user's search query criteria:
 * 1. Must contain all non-size keywords (e.g. "yogurt" AND "vainilla").
 * 2. If a size/presentation is specified in query (e.g. "1l", "2l", "1kg", "500g"), product MUST match that size.
 * 3. Handles specific brand constraints (e.g. "harina pan").
 */
export function evaluateProductMatch(
  product: Product,
  query: string
): MatchResult {
  const normQuery = normalizeText(query);
  const qTokens = normQuery.split(/\s+/).filter(Boolean);

  if (qTokens.length === 0) {
    return { matches: true, score: 100, isExact: true };
  }

  const productFullName = `${product.name} ${product.brand || ''} ${product.presentation || ''}`;
  const normProduct = normalizeText(productFullName);

  // Extract size tokens (e.g. 1l, 2l, 1.5l, 1kg, 500g, 355ml)
  const sizeTokenRegex = /^(\d+(?:\.\d+)?)(l|kg|g|ml)$/;
  const sizeTokens = qTokens.filter((t) => sizeTokenRegex.test(t));
  const keywordTokens = qTokens.filter((t) => !sizeTokenRegex.test(t));

  let matchedKeywords = 0;

  for (const token of keywordTokens) {
    // Check for exact word boundary match
    const regex = new RegExp(`\\b${escapeRegex(token)}\\b`, 'i');
    if (regex.test(normProduct)) {
      matchedKeywords++;
    } else {
      // Substring match for compound words (e.g. "vainill" in "vainilla")
      if (token.length >= 4 && normProduct.includes(token)) {
        matchedKeywords += 0.8;
      }
    }
  }

  const keywordMatchRatio =
    keywordTokens.length > 0 ? matchedKeywords / keywordTokens.length : 1;

  // If size is requested, check if product matches the size
  let sizeMatched = true;
  if (sizeTokens.length > 0) {
    sizeMatched = false;
    for (const st of sizeTokens) {
      const match = st.match(sizeTokenRegex);
      if (match) {
        const val = parseFloat(match[1]);
        const unit = match[2];

        const equivTokens = [st];
        if (unit === 'l') {
          equivTokens.push(`${Math.round(val * 1000)}ml`);
        } else if (unit === 'kg') {
          equivTokens.push(`${Math.round(val * 1000)}g`);
        } else if (unit === 'ml' && val >= 1000) {
          equivTokens.push(`${val / 1000}l`);
        } else if (unit === 'g' && val >= 1000) {
          equivTokens.push(`${val / 1000}kg`);
        }

        const hasMatchingSize = equivTokens.some((eq) => {
          const sizeRegex = new RegExp(`\\b${escapeRegex(eq)}\\b`, 'i');
          return sizeRegex.test(normProduct);
        });

        if (hasMatchingSize) {
          sizeMatched = true;
          break;
        }
      }
    }
  }

  // Exact match criteria:
  // - All keywords present (ratio >= 0.95)
  // - If size specified, size matched
  const isExact = keywordMatchRatio >= 0.95 && sizeMatched;

  // Strict match threshold
  const isStrictMatch = keywordMatchRatio >= 0.85 && sizeMatched;

  const score =
    keywordMatchRatio * 70 +
    (sizeMatched ? 30 : 0) +
    (normProduct.startsWith(normQuery) ? 20 : 0);

  return {
    matches: isStrictMatch,
    score,
    isExact,
  };
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extracts the core query for store search engines.
 * E.g. "coca cola 1lt" -> "coca cola 1l" / "coca cola"
 */
export function getStoreSearchQuery(query: string): string {
  // Normalize units for store searching
  return normalizeText(query);
}
