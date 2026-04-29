import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { User } from '../users/user.entity';

class CallbackDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}

@ApiTags('integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly svc: IntegrationsService) {}

  @Get('platforms')
  getPlatforms() {
    return this.svc.getPlatformsInfo();
  }

  @Get('connections')
  getConnections(@CurrentUser() user: User) {
    return this.svc.getConnections(user.id);
  }

  @Get('connect/:platform')
  getOAuthUrl(@Param('platform') platform: string, @CurrentUser() user: User) {
    return this.svc.getOAuthUrl(platform, user.id);
  }

  @Post('callback/:platform')
  handleCallback(
    @Param('platform') platform: string,
    @Body() dto: CallbackDto,
    @CurrentUser() user: User,
  ) {
    return this.svc.handleCallback(platform, dto.code, user.id);
  }

  @Delete('disconnect/:platform')
  disconnect(@Param('platform') platform: string, @CurrentUser() user: User) {
    return this.svc.disconnect(platform, user.id);
  }

  @Post('publish/:campaignId')
  publishCampaign(
    @Param('campaignId') campaignIdStr: string,
    @CurrentUser() user: User,
  ) {
    const campaignId = parseInt(campaignIdStr, 10);
    return this.svc.publishCampaign(campaignId, user.id);
  }
}
