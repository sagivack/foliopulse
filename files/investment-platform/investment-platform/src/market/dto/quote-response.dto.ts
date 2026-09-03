/**
 * Réponse brute de l'endpoint Finnhub /quote
 * https://finnhub.io/docs/api/quote
 */
export interface FinnhubQuoteDto {
  c: number; // current price
  d: number; // change
  dp: number; // percent change
  h: number; // high of the day
  l: number; // low of the day
  o: number; // open price of the day
  pc: number; // previous close price
  t: number; // timestamp (unix)
}

/**
 * Format normalisé renvoyé par notre API (plus lisible côté front)
 */
export interface QuoteResponseDto {
  symbol: string;
  currentPrice: number;
  change: number;
  percentChange: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
  fromCache: boolean;
}
