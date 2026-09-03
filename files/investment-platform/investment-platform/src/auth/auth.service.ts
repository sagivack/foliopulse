import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto, AuthTokensDto } from './dto/auth.dto';

/**
 * Module "auth" (cahier des charges section 5) : JWT + Refresh, comme
 * spécifié dans la section Sécurité.
 * - Access token : courte durée (15 min), transporte { sub: userId }
 * - Refresh token : longue durée (7 jours), stocké en base (table
 *   RefreshToken) pour pouvoir être révoqué (logout, sécurité)
 */
@Injectable()
export class AuthService {
  private readonly refreshTokenTtlDays = 7;

  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokensDto> {
    const user = await this.usersService.create(dto);
    return this.issueTokens(user.id);
  }

  async login(dto: LoginDto): Promise<AuthTokensDto> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const isValid = await this.usersService.validatePassword(
      dto.password,
      user.password,
    );

    if (!isValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    return this.issueTokens(user.id);
  }

  async refresh(refreshToken: string): Promise<AuthTokensDto> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    // Rotation : on invalide l'ancien refresh token et on en émet un nouveau
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    return this.issueTokens(stored.userId);
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  private async issueTokens(userId: string): Promise<AuthTokensDto> {
    const accessToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      },
    );

    const refreshToken = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTokenTtlDays);

    // upsert : un seul refresh token actif par utilisateur à la fois
    await this.prisma.refreshToken.upsert({
      where: { userId },
      update: { token: refreshToken, expiresAt },
      create: { userId, token: refreshToken, expiresAt },
    });

    return { accessToken, refreshToken };
  }
}
