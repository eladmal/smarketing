import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import * as sharp from 'sharp';
import * as archiver from 'archiver';
import { Asset } from './asset.entity';
import { Campaign } from '../campaigns/campaign.entity';
import { CopyVariant } from '../copy/copy-variant.entity';
import { Audience } from '../audiences/audience.entity';

export interface PlatformSize {
  name: string;
  width: number;
  height: number;
  label: string;
}

export const PLATFORM_SIZES: Record<string, PlatformSize[]> = {
  facebook: [
    { name: 'feed_square',     width: 1080, height: 1080, label: 'Feed Square'     },
    { name: 'feed_landscape',  width: 1200, height: 628,  label: 'Feed Landscape'  },
    { name: 'story',           width: 1080, height: 1920, label: 'Story'           },
    { name: 'cover',           width: 820,  height: 312,  label: 'Cover Photo'     },
  ],
  instagram: [
    { name: 'feed_square',     width: 1080, height: 1080, label: 'Feed Square'     },
    { name: 'feed_portrait',   width: 1080, height: 1350, label: 'Feed Portrait'   },
    { name: 'story',           width: 1080, height: 1920, label: 'Story'           },
  ],
  google: [
    { name: 'medium_rectangle', width: 300,  height: 250,  label: 'Medium Rectangle' },
    { name: 'leaderboard',      width: 728,  height: 90,   label: 'Leaderboard'      },
    { name: 'wide_skyscraper',  width: 160,  height: 600,  label: 'Wide Skyscraper'  },
    { name: 'half_page',        width: 300,  height: 600,  label: 'Half Page'        },
    { name: 'responsive',       width: 1200, height: 628,  label: 'Responsive'       },
  ],
  tiktok: [
    { name: 'feed_vertical',   width: 1080, height: 1920, label: 'Feed Vertical'   },
    { name: 'feed_square',     width: 1080, height: 1080, label: 'Feed Square'     },
  ],
};

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  constructor(
    @InjectRepository(Asset)
    private readonly repo: Repository<Asset>,
  ) {
    // Ensure uploads directory exists
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  getPlatformSizes() {
    return PLATFORM_SIZES;
  }

  async upload(
    userId: number,
    campaignId: number | null,
    file: Express.Multer.File,
    platforms: string[],
  ): Promise<Asset> {
    const resizedVariants: Array<{
      platform: string;
      sizeName: string;
      label: string;
      width: number;
      height: number;
      filePath: string;
      url: string;
    }> = [];

    // Create per-asset subdirectory
    const assetDir = path.join(UPLOADS_DIR, `user_${userId}`);
    if (!fs.existsSync(assetDir)) {
      fs.mkdirSync(assetDir, { recursive: true });
    }

    // Save original
    const ext = path.extname(file.originalname) || '.jpg';
    const basename = `${Date.now()}_orig${ext}`;
    const origPath = path.join(assetDir, basename);
    fs.writeFileSync(origPath, file.buffer);

    const isImage = file.mimetype.startsWith('image/');

    if (isImage) {
      for (const platform of platforms) {
        const sizes = PLATFORM_SIZES[platform];
        if (!sizes) continue;

        const platformDir = path.join(assetDir, platform);
        if (!fs.existsSync(platformDir)) {
          fs.mkdirSync(platformDir, { recursive: true });
        }

        for (const size of sizes) {
          try {
            const resizedName = `${Date.now()}_${platform}_${size.name}${ext}`;
            const resizedPath = path.join(platformDir, resizedName);

            await (sharp as unknown as (input: string) => sharp.Sharp)(origPath)
              .resize(size.width, size.height, { fit: 'cover', position: 'center' })
              .toFile(resizedPath);

            const relPath = path.relative(UPLOADS_DIR, resizedPath).replace(/\\/g, '/');
            resizedVariants.push({
              platform,
              sizeName: size.name,
              label: size.label,
              width: size.width,
              height: size.height,
              filePath: resizedPath,
              url: `/uploads/${relPath}`,
            });
          } catch (err) {
            this.logger.warn(`Failed to resize ${platform}/${size.name}: ${err.message}`);
          }
        }
      }
    }

    const relOrig = path.relative(UPLOADS_DIR, origPath).replace(/\\/g, '/');
    const asset = this.repo.create({
      userId,
      campaignId: campaignId ?? undefined,
      originalFilename: file.originalname,
      filePath: origPath,
      fileType: file.mimetype,
      resizedVariants,
    });

    return this.repo.save(asset);
  }

  findAll(userId: number, campaignId?: number): Promise<Asset[]> {
    const where: Record<string, unknown> = { userId };
    if (campaignId) where.campaignId = campaignId;
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async remove(id: number, userId: number): Promise<void> {
    const asset = await this.repo.findOne({ where: { id } });
    if (!asset) throw new NotFoundException('Asset not found');
    if (asset.userId !== userId) throw new ForbiddenException('Access denied');

    // Delete resized variants from disk
    for (const variant of asset.resizedVariants || []) {
      try {
        if (variant.filePath && fs.existsSync(variant.filePath)) {
          fs.unlinkSync(variant.filePath);
        }
      } catch (err) {
        this.logger.warn(`Could not delete variant file: ${err.message}`);
      }
    }

    // Delete original file
    try {
      if (asset.filePath && fs.existsSync(asset.filePath)) {
        fs.unlinkSync(asset.filePath);
      }
    } catch (err) {
      this.logger.warn(`Could not delete original file: ${err.message}`);
    }

    await this.repo.delete(id);
  }

  async exportCampaignZip(
    campaignId: number,
    userId: number,
    campaign: Campaign,
    copyVariants: CopyVariant[],
    audiences: Audience[],
    assets: Asset[],
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const archive = archiver.default('zip', { zlib: { level: 6 } });

      archive.on('data', (chunk: Buffer) => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', (err: Error) => reject(new InternalServerErrorException(`ZIP error: ${err.message}`)));

      // Campaign summary JSON
      const summary = {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          goal: campaign.goal,
          productName: campaign.productName,
          productDescription: campaign.productDescription,
          targetAudience: campaign.targetAudience,
          budget: campaign.budget,
          language: campaign.language,
          platforms: campaign.platforms,
          status: campaign.status,
          exportedAt: new Date().toISOString(),
        },
        copyVariants: copyVariants.map((cv) => ({
          id: cv.id,
          platform: cv.platform,
          variantType: cv.variantType,
          content: cv.content,
          isSelected: cv.isSelected,
        })),
        audiences: audiences.map((a) => ({
          id: a.id,
          platform: (a as any).platform,
          name: (a as any).name,
          ageMin: (a as any).ageMin,
          ageMax: (a as any).ageMax,
          interests: (a as any).interests,
          behaviors: (a as any).behaviors,
        })),
      };

      archive.append(JSON.stringify(summary, null, 2), { name: 'campaign_summary.json' });

      // Copy variants as text
      const copyText = copyVariants
        .map(
          (cv) =>
            `[${cv.platform?.toUpperCase()} - ${cv.variantType}]\n${cv.content}\n`,
        )
        .join('\n---\n\n');
      archive.append(copyText, { name: 'copy_variants.txt' });

      // Audience JSON
      archive.append(JSON.stringify(audiences, null, 2), { name: 'audiences.json' });

      // Asset files
      for (const asset of assets) {
        // Add original
        if (asset.filePath && fs.existsSync(asset.filePath)) {
          archive.file(asset.filePath, {
            name: `assets/original/${asset.originalFilename || path.basename(asset.filePath)}`,
          });
        }

        // Add resized variants
        for (const variant of asset.resizedVariants || []) {
          if (variant.filePath && fs.existsSync(variant.filePath)) {
            const ext2 = path.extname(variant.filePath);
            archive.file(variant.filePath, {
              name: `assets/${variant.platform}/${variant.sizeName}${ext2}`,
            });
          }
        }
      }

      archive.finalize();
    });
  }
}
