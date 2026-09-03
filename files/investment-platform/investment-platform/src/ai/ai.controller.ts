import { Body, Controller, Post, Req, UseGuards, Get } from '@nestjs/common';
import { AiService } from './ai.service';
import { AskQuestionDto, GenerateRecommendationDto } from './dto/ask-question.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Endpoints du module IA (cahier des charges section 3.5).
 * Protégés par JWT — userId extrait du token, pas du body,
 * pour éviter qu'un utilisateur consulte le profil d'un autre.
 */
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) { }

  @Post('recommendation')
  generateRecommendation(@Req() req: any, @Body() dto: GenerateRecommendationDto) {
    return this.aiService.generateRecommendation(req.user.id, dto.symbol);
  }

  @Post('ask')
  askQuestion(@Req() req: any, @Body() dto: AskQuestionDto) {
    return this.aiService.askQuestion(req.user.id, dto.question, dto.symbol);
  }

  @Get('macro')
  getMacroMarketInsights() {
    return this.aiService.getMacroMarketInsights();
  }
}
