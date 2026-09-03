import { IsArray, ValidateNested, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitAnswerDto {
  @IsInt()
  questionId: number;

  @IsInt()
  @Min(1)
  @Max(5) // échelle de Likert 1-5, cf. section 3.1 "12 questions dynamiques"
  value: number;
}

export class SubmitQuestionnaireDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  answers: SubmitAnswerDto[];
}

export interface QuestionDto {
  id: number;
  text: string;
  order: number;
}

export interface InvestmentProfileResponseDto {
  id: number;
  score: number;
  type: string;
  riskTolerance: string;
  horizon: string;
  createdAt: Date;
}
