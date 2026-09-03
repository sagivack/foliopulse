import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SubmitQuestionnaireDto,
  QuestionDto,
  InvestmentProfileResponseDto,
} from './dto/submit-questionnaire.dto';

const TOTAL_QUESTIONS = 12;

/**
 * ============================================================================
 * Explication pour les non-informaticiens :
 * Ce fichier est responsable de comprendre "qui vous êtes" en tant 
 * qu'investisseur. Lorsque vous répondez au petit questionnaire (12 questions), 
 * ce module calcule un score. En fonction de ce score, il détermine si vous 
 * êtes de nature prudente (conservateur) ou plutôt prêt à prendre des risques 
 * (spéculatif).
 * ============================================================================
 * 
 * Module "profiles" (cahier des charges section 3.1 + 3.2).
 * Calcule le score de risque à partir des réponses au questionnaire
 * dynamique et attribue automatiquement un profil d'investissement.
 */
@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) { }

  /** GET /profiles/questions — liste les 12 questions actives */
  async getQuestions(): Promise<QuestionDto[]> {
    const questions = await this.prisma.question.findMany({
      orderBy: { order: 'asc' },
    });

    return questions.map((q) => ({ id: q.id, text: q.text, order: q.order }));
  }

  /**
   * POST /profiles/questionnaire
   * Enregistre les réponses, calcule le score pondéré, attribue le profil.
   */
  async submitQuestionnaire(
    userId: string,
    dto: SubmitQuestionnaireDto,
  ): Promise<InvestmentProfileResponseDto> {
    if (dto.answers.length !== TOTAL_QUESTIONS) {
      throw new BadRequestException(
        `Le questionnaire doit contenir exactement ${TOTAL_QUESTIONS} réponses`,
      );
    }

    const questionIds = dto.answers.map((a) => a.questionId);
    const questions = await this.prisma.question.findMany({
      where: { id: { in: questionIds } },
    });

    if (questions.length !== TOTAL_QUESTIONS) {
      throw new BadRequestException('Une ou plusieurs questions sont invalides');
    }

    // Sauvegarde des réponses (upsert pour permettre de refaire le test)
    await this.prisma.$transaction(
      dto.answers.map((a) =>
        this.prisma.answer.upsert({
          where: { userId_questionId: { userId, questionId: a.questionId } },
          update: { value: a.value },
          create: { userId, questionId: a.questionId, value: a.value },
        }),
      ),
    );

    const score = this.computeRiskScore(dto.answers, questions);
    const { type, riskTolerance, horizon } = this.mapScoreToProfile(score);

    const profile = await this.prisma.investmentProfile.create({
      data: {
        userId,
        score,
        type,
        riskTolerance,
        horizon,
      },
    });

    return {
      id: profile.id,
      score: profile.score,
      type: profile.type,
      riskTolerance: profile.riskTolerance,
      horizon: profile.horizon,
      createdAt: profile.createdAt,
    };
  }

  /** GET /profiles/me — dernier profil actif de l'utilisateur */
  async getCurrentProfile(
    userId: string,
  ): Promise<InvestmentProfileResponseDto | null> {
    const profile = await this.prisma.investmentProfile.findFirst({
      where: { userId },
      orderBy: { id: 'desc' },
    });

    if (!profile) return null;

    return {
      id: profile.id,
      score: profile.score,
      type: profile.type,
      riskTolerance: profile.riskTolerance,
      horizon: profile.horizon,
      createdAt: profile.createdAt,
    };
  }

  /**
   * Score pondéré 0-100 : chaque réponse (1-5) est ramenée à un pourcentage
   * puis pondérée par le poids de la question.
   */
  private computeRiskScore(
    answers: SubmitQuestionnaireDto['answers'],
    questions: { id: number; weight: number }[],
  ): number {
    const weightById = new Map(questions.map((q) => [q.id, q.weight]));

    let weightedSum = 0;
    let totalWeight = 0;

    for (const answer of answers) {
      const weight = weightById.get(answer.questionId) ?? 1;
      weightedSum += (answer.value / 5) * 100 * weight;
      totalWeight += weight;
    }

    return Math.round(weightedSum / totalWeight);
  }

  /** Mapping score -> profil, tolérance au risque et horizon par défaut */
  private mapScoreToProfile(score: number): {
    type: string;
    riskTolerance: string;
    horizon: string;
  } {
    if (score < 25) {
      return { type: 'CONSERVATEUR', riskTolerance: 'FAIBLE', horizon: 'LONG_TERME' };
    }
    if (score < 50) {
      return { type: 'MODERE', riskTolerance: 'MOYENNE', horizon: 'MOYEN_TERME' };
    }
    if (score < 75) {
      return { type: 'AGRESSIF', riskTolerance: 'ELEVEE', horizon: 'MOYEN_TERME' };
    }
    return { type: 'SPECULATIF', riskTolerance: 'ELEVEE', horizon: 'COURT_TERME' };
  }
}
