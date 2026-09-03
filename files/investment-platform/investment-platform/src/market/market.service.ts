import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { FinnhubService } from './finnhub.service';
import { QuoteResponseDto } from './dto/quote-response.dto';
import { SentimentResponseDto, NewsItemDto } from './dto/sentiment-response.dto';

/**
 * ============================================================================
 * Explication pour les non-informaticiens :
 * Ce module est le "garde champêtre" de nos données financières. 
 * Pour éviter de demander le prix de la bourse 1 000 fois par minute 
 * (ce qui coûterait cher et ralentirait l'application), ce fichier
 * garde en mémoire (en "cache") le dernier prix connu pendant quelques 
 * secondes/minutes et le ressort immédiatement, rendant le site ultra rapide.
 * ============================================================================
 * 
 * Service métier du module Market.
 * Orchestration : vérifie le cache PostgreSQL (table MarketDataCache,
 * cf. cahier des charges section 6) avant d'appeler Finnhub, pour
 * respecter la contrainte de performance section 9 ("Requêtes Finnhub
 * mises en cache").
 */
@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  private readonly cacheTtlSeconds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly finnhub: FinnhubService,
    private readonly configService: ConfigService,
  ) {
    this.cacheTtlSeconds = Number(
      this.configService.get<string>('MARKET_CACHE_TTL_SECONDS') ?? 60,
    );
  }

  private isCacheFresh(updatedAt: Date): boolean {
    const ageMs = Date.now() - updatedAt.getTime();
    return ageMs < this.cacheTtlSeconds * 1000;
  }

  /**
   * GET /market/quote/:symbol
   * Vérifie le cache avant d'appeler Finnhub. Met à jour le cache après.
   */
  async getQuote(symbolRaw: string): Promise<QuoteResponseDto> {
    const symbol = symbolRaw.toUpperCase();

    const cached = await this.prisma.marketDataCache.findFirst({
      where: { symbol },
      orderBy: { updatedAt: 'desc' },
    });

    if (cached && this.isCacheFresh(cached.updatedAt) && cached.price != null) {
      this.logger.debug(`Cache hit pour ${symbol}`);
      return {
        symbol,
        currentPrice: cached.price,
        change: cached.change || 0,
        percentChange: cached.percentChange || 0,
        high: cached.price,
        low: cached.price,
        open: cached.price,
        previousClose: cached.price,
        timestamp: Math.floor(cached.updatedAt.getTime() / 1000),
        fromCache: true,
      };
    }

    const quote = await this.finnhub.getQuote(symbol);

    await this.prisma.marketDataCache.upsert({
      where: { symbol },
      update: { price: quote.c, change: quote.d, percentChange: quote.dp, updatedAt: new Date() },
      create: { symbol, price: quote.c, change: quote.d, percentChange: quote.dp, sentiment: null },
    });

    return {
      symbol,
      currentPrice: quote.c,
      change: quote.d,
      percentChange: quote.dp,
      high: quote.h,
      low: quote.l,
      open: quote.o,
      previousClose: quote.pc,
      timestamp: quote.t,
      fromCache: false,
    };
  }

  /**
   * GET /market/sentiment/:symbol
   */
  async getSentiment(symbolRaw: string): Promise<SentimentResponseDto> {
    const symbol = symbolRaw.toUpperCase();

    const cached = await this.prisma.marketDataCache.findFirst({
      where: { symbol },
      orderBy: { updatedAt: 'desc' },
    });

    if (
      cached &&
      this.isCacheFresh(cached.updatedAt) &&
      cached.sentiment != null
    ) {
      this.logger.debug(`Cache hit (sentiment) pour ${symbol}`);
      const parsed = JSON.parse(cached.sentiment) as SentimentResponseDto;
      return { ...parsed, fromCache: true };
    }

    const raw = await this.finnhub.getSentiment(symbol);

    const result: SentimentResponseDto = {
      symbol,
      bullishPercent: raw.sentiment?.bullishPercent ?? 0,
      bearishPercent: raw.sentiment?.bearishPercent ?? 0,
      buzzScore: raw.buzz?.buzz ?? 0,
      articlesLastWeek: raw.buzz?.articlesInLastWeek ?? 0,
      fromCache: false,
    };

    await this.prisma.marketDataCache.upsert({
      where: { symbol },
      update: {
        sentiment: JSON.stringify(result),
        updatedAt: new Date(),
      },
      create: {
        symbol,
        price: cached?.price ?? 0,
        sentiment: JSON.stringify(result),
      },
    });

    return result;
  }

  /**
   * GET /market/news
   * Actualités générales du marché (pas de cache DB ici, faible volume/coût).
   */
  async getGeneralNews(): Promise<NewsItemDto[]> {
    return this.finnhub.getGeneralNews();
  }

  /**
   * GET /market/news/:symbol (bonus, pratique pour le module IA)
   */
  async getCompanyNews(symbol: string, days = 7): Promise<NewsItemDto[]> {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);

    const format = (d: Date) => d.toISOString().split('T')[0];

    return this.finnhub.getCompanyNews(symbol, format(from), format(to));
  }
}
