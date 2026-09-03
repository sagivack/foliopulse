import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ClaudeService } from './claude.service';
import { PrismaService } from '../prisma/prisma.service';
import { MarketModule } from '../market/market.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MarketModule, AuthModule], // MarketService (quote+sentiment) + JwtStrategy pour le guard
  controllers: [AiController],
  providers: [AiService, ClaudeService, PrismaService],
})
export class AiModule {}
