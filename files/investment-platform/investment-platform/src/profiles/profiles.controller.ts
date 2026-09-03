import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { SubmitQuestionnaireDto } from './dto/submit-questionnaire.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('questions')
  getQuestions() {
    return this.profilesService.getQuestions();
  }

  @Post('questionnaire')
  submitQuestionnaire(@Body() dto: SubmitQuestionnaireDto, @Req() req: any) {
    return this.profilesService.submitQuestionnaire(req.user.id, dto);
  }

  @Get('me')
  getCurrentProfile(@Req() req: any) {
    return this.profilesService.getCurrentProfile(req.user.id);
  }
}
