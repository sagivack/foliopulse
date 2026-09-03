import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard à utiliser sur tous les endpoints protégés :
 * @UseGuards(JwtAuthGuard)
 * Injecte req.user = { id: string } via JwtStrategy.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
