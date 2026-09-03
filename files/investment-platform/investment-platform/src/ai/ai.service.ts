import { Injectable, Logger, NotFoundException, HttpException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarketService } from '../market/market.service';
import { ClaudeService } from './claude.service';
import {
  RecommendationResponseDto,
  AiAnswerResponseDto,
} from './dto/recommendation-response.dto';

/**
 * ============================================================================
 * Explication pour les non-informaticiens :
 * Ce fichier agit comme le "chef d'orchestre" de l'intelligence artificielle. 
 * Il récupère le profil de l'utilisateur (conservateur, agressif, etc.),
 * va chercher les cours de la Bourse en temps réel, puis combine ces données 
 * pour demander à l'IA de donner un conseil sur mesure (Acheter/Vendre).
 * ============================================================================
 * 
 * Service métier du module AI (cahier des charges section 3.5) :
 *  - Analyse personnalisée
 *  - Réponses aux questions
 *  - Recommandations basées sur profil + données Finnhub
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  // Cache for Macro Analysis
  private macroCache: any = null;
  private macroCacheTime: number = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly market: MarketService,
    private readonly claude: ClaudeService,
  ) { }

  /**
   * Génère une recommandation IA pour un symbole donné, contextualisée
   * par le profil de risque de l'utilisateur (InvestmentProfile) et les
   * données de marché en temps réel (quote + sentiment Finnhub).
   */
  async generateRecommendation(
    userId: string,
    symbol: string,
  ): Promise<RecommendationResponseDto> {
    const profile = await this.prisma.investmentProfile.findFirst({
      where: { userId },
      orderBy: { id: 'desc' },
    }) || { type: 'MODERE', riskTolerance: 'MOYENNE', horizon: 'MOYEN_TERME', score: 50 };

    // Récupère les données de marché en parallèle pour rester sous les 2s (objectif SMART)
    const [quote, sentiment] = await Promise.all([
      this.market.getQuote(symbol),
      this.market.getSentiment(symbol).catch(() => null), // le sentiment peut manquer pour certains titres
    ]);

    const systemPrompt = `Tu es conseiller financier IA. Tu dois OBLIGATOIREMENT répondre au format JSON stricte sans aucune autre balise.
IMPORTANT: Tu as interdiction d'utiliser des points de suspension '...' ou des abréviations. Tu dois rédiger ton analyse COMPLÈTE avec de vraies phrases développées.

Génère la structure JSON suivante :
- "stance" : choix entre "ACHETER", "CONSERVER", "VENDRE" ou "EVITER"
- "confidence" : un nombre entier entre 0 et 100
- "summary" : rédige une véritable analyse textuelle complète en 3 phrases au minimum (interdiction d'utiliser '...').
- "reasoning" : rédige le détail exhaustif de ta conclusion en 4 phrases (interdiction d'utiliser '...').
- "risks" : un tableau contenant obligatoirement 3 chaînes de caractères détaillant 3 risques réels distincts.

Adapte fidèlement ce verdict aux contraintes du profil de l'utilisateur.`;

    const userPrompt = `Profil investisseur :
- Type : ${profile.type}
- Tolérance au risque : ${profile.riskTolerance}
- Horizon : ${profile.horizon}
- Score de risque : ${profile.score}

Données de marché pour ${quote.symbol} :
- Prix actuel : ${quote.currentPrice}
- Variation : ${quote.change} (${quote.percentChange}%)
- Plus haut / plus bas du jour : ${quote.high} / ${quote.low}
- Clôture précédente : ${quote.previousClose}
${sentiment
        ? `- Sentiment marché : ${sentiment.bullishPercent}% haussier / ${sentiment.bearishPercent}% baissier (buzz: ${sentiment.buzzScore})`
        : '- Sentiment marché : non disponible pour ce titre'
      }

Génère une recommandation adaptée à ce profil pour ce titre.`;

    const aiResult = await this.claude.completeJson<{
      stance: RecommendationResponseDto['stance'];
      confidence: number;
      summary: string;
      reasoning: string;
      risks: string[];
    }>(systemPrompt, userPrompt);

    return {
      symbol: quote.symbol,
      stance: aiResult.stance,
      confidence: aiResult.confidence,
      summary: aiResult.summary,
      reasoning: aiResult.reasoning,
      risks: aiResult.risks,
      generatedAt: new Date().toISOString(),
      profileType: profile.type,
    };
  }

  /**
   * Répond à une question libre de l'utilisateur, avec contexte de
   * marché optionnel si un symbole est fourni.
   */
  async askQuestion(
    userId: string,
    question: string,
    symbol?: string,
  ): Promise<AiAnswerResponseDto> {
    const profile = await this.prisma.investmentProfile.findFirst({
      where: { userId },
      orderBy: { id: 'desc' },
    });

    let marketContext = '';
    if (symbol) {
      try {
        const quote = await this.market.getQuote(symbol);
        marketContext = `\nContexte marché actuel pour ${quote.symbol} : prix ${quote.currentPrice}, variation ${quote.percentChange}%.`;
      } catch {
        this.logger.warn(`Impossible de récupérer le contexte pour ${symbol}`);
      }
    }

    const systemPrompt = `Tu es un assistant pédagogique intégré à une plateforme d'investissement.
Tu expliques des concepts financiers simplement, sans jargon inutile, adapté à un investisseur ${profile ? `de profil "${profile.type}"` : 'débutant'
      }.
Tu ne donnes jamais de conseil financier personnalisé réglementé — tu expliques et informes.
Réponds en 3 à 8 phrases maximum, en français, ton clair et rassurant.`;

    const userPrompt = `Question : ${question}${marketContext}`;

    const answer = await this.claude.completeText(systemPrompt, userPrompt);

    return {
      answer,
      relatedSymbol: symbol,
      generatedAt: new Date().toISOString(),
    };
  }

  async getMacroMarketInsights() {
    const now = Date.now();
    if (this.macroCache && now - this.macroCacheTime < 1800000) { // 30 mins cache
      return this.macroCache;
    }

    const systemPrompt = `Tu es un Macro-économiste de Wall Street expert. Tu dois OBLIGATOIREMENT répondre au format JSON stricte sans aucune balise ni texte en dehors ou point de suspension.
Ton rôle est de donner un aperçu clair du sentiment actuel sur les marchés mondiaux (Tech, Crypto, Inflation, Taux d'intérêts).

Génère la structure JSON suivante EXACTEMENT:
- "marketMood" : choix entre "BULLISH", "BEARISH", ou "NEUTRAL"
- "sentimentScore" : Note de confiance entre 0 et 100
- "headline" : Un gros titre accrocheur sur la tendance du jour (1 ligne)
- "sectorsToWatch" : Un tableau contenant 3 noms de secteurs économiques (ex: ["IA", "Energie", "Bancaire"])
- "analysis" : Un paragraphe complet d'analyse macro économique détaillée (4 à 5 véritables phrases complètes formelles, sans utiliser '...').`;

    const userPrompt = `Génère le rapport Macro-économique de la journée. Les marchés attendaient les annonces de la réserve économique mondiale.`;

    let jsonString = '';
    try {
      jsonString = await this.claude.completeText(systemPrompt, userPrompt);
    } catch (e) {
      this.logger.error('Erreur Groq LLM, utilisation du fallback', e);
      return {
        marketMood: "NEUTRAL",
        sentimentScore: 60,
        headline: "Attentisme Pragmatique sur les Marchés Mondiaux",
        sectorsToWatch: ["Intelligence Artificielle", "Semi-conducteurs", "Renouvelable"],
        analysis: "En raison d'une saturation ponctuelle de l'API d'intelligence artificielle, l'analyse live est suspendue. Les investisseurs maintiennent généralement une posture défensive tout en capitalisant sur la croissance forte du secteur technologique."
      };
    }

    // Extraction robuste du JSON via brace counting
    let startIndex = -1;
    let endIndex = -1;
    let braceCount = 0;

    for (let i = 0; i < jsonString.length; i++) {
      if (jsonString[i] === '{') {
        if (braceCount === 0) startIndex = i;
        braceCount++;
      } else if (jsonString[i] === '}') {
        braceCount--;
        if (braceCount === 0 && startIndex !== -1) {
          endIndex = i;
          break;
        }
      }
    }

    if (startIndex !== -1 && endIndex !== -1) {
      const cleanJson = jsonString.substring(startIndex, endIndex + 1);
      try {
        const parsed = JSON.parse(cleanJson);
        this.macroCache = parsed;
        this.macroCacheTime = Date.now();
        return parsed;
      } catch (err) {
        this.logger.error('Erreur Parse JSON Macro', cleanJson);
        return {
          marketMood: "NEUTRAL",
          sentimentScore: 50,
          headline: "Correction Technique (Erreur Parse)",
          sectorsToWatch: ["Veuillez réessayer plus tard"],
          analysis: "L'IA a retourné un format illisible. Analyse par défaut affichée."
        };
      }
    } else {
      this.logger.error('Aucun objet JSON trouvé Macro', jsonString);
      return {
        marketMood: "NEUTRAL",
        sentimentScore: 50,
        headline: "Les Marchés reprennent leur souffle",
        sectorsToWatch: ["Intelligence Artificielle", "Semi-conducteurs", "Renouvelable"],
        analysis: "En raison d'une limite de tokens atteinte par l'IA lors de son raisonnement complexe, ce rapport de secours a été activé. Le marché reste résilient."
      };
    }
  }
}
