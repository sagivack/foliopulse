import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UserResponseDto } from './dto/create-user.dto';

const SALT_ROUNDS = 12;

/**
 * Module "users" (cahier des charges section 5).
 * Gère le cycle de vie du compte utilisateur. Le hashing du mot de passe
 * se fait ici, jamais dans le module auth, pour garder une seule source
 * de vérité sur la sécurité des credentials.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponseDto(user: {
    id: string;
    email: string;
    createdAt: Date;
  }): UserResponseDto {
    return { id: user.id, email: user.email, createdAt: user.createdAt };
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: { email: dto.email, password: hashedPassword },
    });

    return this.toResponseDto(user);
  }

  /** Utilisé en interne par AuthService pour vérifier le mot de passe */
  async findByEmailWithPassword(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return this.toResponseDto(user);
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
