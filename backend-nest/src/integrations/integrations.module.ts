import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformConnection } from './platform-connection.entity';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { TokenEncryptionService } from '../shared/services/token-encryption.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlatformConnection]),
    CampaignsModule,
  ],
  providers: [IntegrationsService, TokenEncryptionService],
  controllers: [IntegrationsController],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
