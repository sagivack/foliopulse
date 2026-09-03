import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Wrapper Nest.js autour de PrismaClient.
 * Permet l'injection de dépendance (@InjectRepository-like) et gère
 * proprement la connexion/déconnexion avec le cycle de vie du module.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
