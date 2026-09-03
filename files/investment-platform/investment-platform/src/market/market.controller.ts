import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { MarketService } from './market.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Endpoints conformes au cahier des charges section 3.3 :
 *  - /market/quote/:symbol
 *  - /market/news
 *  - /market/sentiment/:symbol
 */
@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) { }

  @Get('quote/:symbol')
  getQuote(@Param('symbol') symbol: string) {
    return this.marketService.getQuote(symbol);
  }

  @Get('sentiment/:symbol')
  getSentiment(@Param('symbol') symbol: string) {
    return this.marketService.getSentiment(symbol);
  }

  @Get('news')
  getNews(@Query('symbol') symbol?: string, @Query('days') days?: string) {
    if (symbol) {
      return this.marketService.getCompanyNews(
        symbol,
        days ? Number(days) : undefined,
      );
    }
    return this.marketService.getGeneralNews();
  }
}
