import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

/**
 * Body pour POST /ai/ask
 * L'utilisateur pose une question libre à l'IA (section 3.5 : "Réponses aux questions")
 */
export class AskQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  question: string;

  @IsOptional()
  @IsString()
  symbol?: string; // contexte optionnel: si la question porte sur un titre précis
}

/**
 * Body pour POST /ai/recommendation
 * Génère une recommandation basée sur le profil utilisateur + un symbole
 * (section 3.5 : "Recommandations basées sur profil + données Finnhub")
 */
export class GenerateRecommendationDto {
  @IsString()
  @IsNotEmpty()
  symbol: string;
}
