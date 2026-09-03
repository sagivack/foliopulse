import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * Bootstrap (cahier des charges section 5 "Sécurité") :
 *  - ValidationPipe global : valide tous les DTOs (class-validator)
 *  - whitelist : rejette les champs non déclarés dans les DTOs
 *  - CORS activé pour le front Next.js
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.setGlobalPrefix('api'); // toutes les routes préfixées /api (ex: /api/market/quote/AAPL)

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🚀 API démarrée sur http://localhost:${port}/api`);
}

bootstrap();
