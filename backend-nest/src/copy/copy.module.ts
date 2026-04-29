import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CopyVariant } from './copy-variant.entity';
import { CopyService } from './copy.service';
import { CopyController } from './copy.controller';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { ClaudeService } from '../shared/services/claude.service';

@Module({
  imports: [TypeOrmModule.forFeature([CopyVariant]), CampaignsModule],
  providers: [CopyService, ClaudeService],
  controllers: [CopyController],
  exports: [CopyService],
})
export class CopyModule {}
