import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FinnhubQuoteDto,
} from './dto/quote-response.dto';
import { FinnhubSentimentDto as SentimentRaw } from './dto/sentiment-response.dto';

/**
 * ============================================================================
 * Explication pour les non-informaticiens :
 * Ce fichier est notre point de contact avec la Bourse (via le service Finnhub).
 * Son rôle est d'aller demander poliment à la Bourse "Combien coûte cette 
 * action en ce moment ?" ou "Quelles sont les dernières nouvelles sur 
 * l'entreprise Apple ?". Il se charge uniquement de récupérer ces données 
 * brutes.
 * ============================================================================
 * 
 * Client HTTP dédié à l'API Finnhub.
 * Ne contient aucune logique métier ni de cache : c'est la responsabilité
 * de MarketService. Ce service se contente de parler à Finnhub et de
 * mapper les erreurs HTTP en exceptions Nest.js.
 */
@Injectable()
export class FinnhubService {
  private readonly logger = new Logger(FinnhubService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('FINNHUB_API_KEY') ?? '';
    this.baseUrl =
      this.configService.get<string>('FINNHUB_BASE_URL') ??
      'https://finnhub.io/api/v1';

    if (!this.apiKey) {
      this.logger.warn(
        'FINNHUB_API_KEY manquante — vérifie ton fichier .env',
      );
    }
  }

  private async request<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    url.searchParams.set('token', this.apiKey);
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.set(key, value),
    );

    let response: Response;
    try {
      response = await fetch(url.toString());
    } catch (err) {
      this.logger.error(`Erreur réseau Finnhub sur ${path}`, err as Error);
      throw new InternalServerErrorException(
        'Impossible de contacter le service de données de marché',
      );
    }

    if (response.status === 404) {
      throw new NotFoundException('Symbole boursier introuvable');
    }

    if (!response.ok) {
      this.logger.error(
        `Finnhub a répondu ${response.status} sur ${path}`,
      );
      throw new InternalServerErrorException(
        'Erreur du service de données de marché',
      );
    }

    return (await response.json()) as T;
  }

  /** GET /quote?symbol=XXX */
  async getQuote(symbol: string): Promise<FinnhubQuoteDto> {
    const data = await this.request<FinnhubQuoteDto>('/quote', {
      symbol: symbol.toUpperCase(),
    });

    // Finnhub renvoie 200 avec des zéros partout si le symbole n'existe pas
    if (data.c === 0 && data.h === 0 && data.l === 0 && data.pc === 0) {
      throw new NotFoundException(
        `Aucune donnée trouvée pour le symbole "${symbol}"`,
      );
    }

    return data;
  }

  /** GET /news-sentiment?symbol=XXX */
  async getSentiment(symbol: string): Promise<SentimentRaw> {
    return this.request<SentimentRaw>('/news-sentiment', {
      symbol: symbol.toUpperCase(),
    });
  }

  /** GET /company-news?symbol=XXX&from=YYYY-MM-DD&to=YYYY-MM-DD */
  async getCompanyNews(
    symbol: string,
    from: string,
    to: string,
  ): Promise<any[]> {
    return this.request<any[]>('/company-news', {
      symbol: symbol.toUpperCase(),
      from,
      to,
    });
  }

  /** GET /news?category=general (marché global, pas lié à un symbole) */
  async getGeneralNews(): Promise<any[]> {
    return this.request<any[]>('/news', { category: 'general' });
  }
}
