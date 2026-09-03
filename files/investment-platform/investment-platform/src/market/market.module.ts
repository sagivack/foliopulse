import { Module } from '@nestjs/common';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { FinnhubService } from './finnhub.service';
import { MarketGateway } from './market.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // pour JwtStrategy utilisée par JwtAuthGuard
  controllers: [MarketController],
  providers: [MarketService, FinnhubService, PrismaService, MarketGateway],
  exports: [MarketService], // le module ai en aura besoin pour contextualiser ses réponses
})
export class MarketModule {}
