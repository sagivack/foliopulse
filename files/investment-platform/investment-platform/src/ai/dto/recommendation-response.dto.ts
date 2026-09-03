export type RecommendationStance = 'ACHETER' | 'CONSERVER' | 'VENDRE' | 'EVITER';

export interface RecommendationResponseDto {
  symbol: string;
  stance: RecommendationStance;
  confidence: number; // 0-100
  summary: string; // résumé court (2-3 phrases)
  reasoning: string; // analyse détaillée
  risks: string[];
  generatedAt: string; // ISO date
  profileType: string;
}

export interface AiAnswerResponseDto {
  answer: string;
  relatedSymbol?: string;
  generatedAt: string;
}
