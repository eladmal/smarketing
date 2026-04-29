import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Audience } from './audience.entity';
import { AudiencesService } from './audiences.service';
import { AudiencesController } from './audiences.controller';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { ClaudeService } from '../shared/services/claude.service';

@Module({
  imports: [TypeOrmModule.forFeature([Audience]), CampaignsModule],
  providers: [AudiencesService, ClaudeService],
  controllers: [AudiencesController],
  exports: [AudiencesService],
})
export class AudiencesModule {}
