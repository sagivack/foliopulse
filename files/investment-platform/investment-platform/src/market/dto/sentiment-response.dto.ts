/**
 * Réponse brute de l'endpoint Finnhub /news-sentiment
 * https://finnhub.io/docs/api/news-sentiment
 */
export interface FinnhubSentimentDto {
  symbol: string;
  buzz: {
    articlesInLastWeek: number;
    buzz: number;
    weeklyAverage: number;
  };
  sentiment: {
    bearishPercent: number;
    bullishPercent: number;
  };
  companyNewsScore: number;
  sectorAverageBullishPercent: number;
  sectorAverageNewsScore: number;
}

export interface SentimentResponseDto {
  symbol: string;
  bullishPercent: number;
  bearishPercent: number;
  buzzScore: number;
  articlesLastWeek: number;
  fromCache: boolean;
}

export interface NewsItemDto {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  image?: string;
}
