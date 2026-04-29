import { Controller, Post, Get, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AudiencesService } from './audiences.service';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('audiences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audiences')
export class AudiencesController {
  constructor(private readonly svc: AudiencesService) {}

  @Post('generate')
  generate(@Body('campaignId', ParseIntPipe) campaignId: number, @CurrentUser() user: User) {
    return this.svc.generate(campaignId, user.id);
  }

  @Get('campaign/:id')
  findByCampaign(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.svc.findByCampaign(id, user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.svc.remove(id, user.id);
  }
}
