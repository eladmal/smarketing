import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Res,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { AssetsService } from './assets.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assets')
export class AssetsController {
  constructor(
    private readonly svc: AssetsService,
    private readonly campaigns: CampaignsService,
  ) {}

  @Get('platform-sizes')
  getPlatformSizes() {
    return this.svc.getPlatformSizes();
  }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file:        { type: 'string', format: 'binary' },
        campaign_id: { type: 'integer' },
        platforms:   { type: 'string', description: 'Comma-separated: facebook,instagram,google,tiktok' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }), // 20 MB
          new FileTypeValidator({ fileType: /^(image\/(jpeg|png|webp|gif)|video\/(mp4|quicktime))$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('campaign_id') campaignIdStr: string,
    @Body('platforms') platformsStr: string,
    @CurrentUser() user: User,
  ) {
    const campaignId = campaignIdStr ? parseInt(campaignIdStr, 10) : null;
    if (campaignIdStr && isNaN(campaignId!)) {
      throw new BadRequestException('Invalid campaign_id');
    }

    // Verify campaign ownership if provided
    if (campaignId) {
      await this.campaigns.findOneOwned(campaignId, user.id);
    }

    const platforms = platformsStr
      ? platformsStr.split(',').map((p) => p.trim()).filter(Boolean)
      : [];

    return this.svc.upload(user.id, campaignId, file, platforms);
  }

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('campaign_id') campaignIdStr?: string,
  ) {
    const campaignId = campaignIdStr ? parseInt(campaignIdStr, 10) : undefined;
    return this.svc.findAll(user.id, campaignId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.svc.remove(id, user.id);
  }

  @Post('export/:campaignId')
  async exportZip(
    @Param('campaignId', ParseIntPipe) campaignId: number,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    // Load full campaign with relations
    const campaign = await this.campaigns.findOneOwned(campaignId, user.id);

    const assets = await this.svc.findAll(user.id, campaignId);

    const zipBuffer = await this.svc.exportCampaignZip(
      campaignId,
      user.id,
      campaign,
      campaign.copyVariants || [],
      campaign.audiences || [],
      assets,
    );

    const filename = `campaign_${campaignId}_${Date.now()}.zip`;
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': zipBuffer.length.toString(),
    });
    res.end(zipBuffer);
  }
}
