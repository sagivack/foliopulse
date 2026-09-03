import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { MarketModule } from './market/market.module';
import { AiModule } from './ai/ai.module';
import { PortfolioModule } from './portfolio/portfolio.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // charge le .env, accessible partout via ConfigService
    AuthModule,
    UsersModule,
    ProfilesModule,
    MarketModule,
    AiModule,
    PortfolioModule,
  ],
})
export class AppModule { }
