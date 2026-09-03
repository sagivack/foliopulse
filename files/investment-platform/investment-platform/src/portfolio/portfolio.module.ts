import { Module } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { PrismaService } from '../prisma/prisma.service';
import { MarketModule } from '../market/market.module';

@Module({
    imports: [MarketModule],
    controllers: [PortfolioController],
    providers: [PortfolioService, PrismaService],
})
export class PortfolioModule { }
