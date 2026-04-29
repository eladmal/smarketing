import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PlatformConnection, ConnectionStatus } from './platform-connection.entity';
import { TokenEncryptionService } from '../shared/services/token-encryption.service';
import { CampaignsService } from '../campaigns/campaigns.service';

export interface PlatformInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  scopes: string[];
}

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
}

const PLATFORMS_INFO: PlatformInfo[] = [
  {
    id: 'facebook',
    name: 'Facebook Ads',
    icon: 'facebook',
    color: '#1877F2',
    description: 'Connect your Facebook Ads account to publish and manage campaigns',
    scopes: ['ads_management', 'ads_read', 'business_management'],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'instagram',
    color: '#E4405F',
    description: 'Connect Instagram Business account for organic and paid content',
    scopes: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights'],
  },
  {
    id: 'google',
    name: 'Google Ads',
    icon: 'google',
    color: '#4285F4',
    description: 'Connect Google Ads to run search and display campaigns',
    scopes: ['https://www.googleapis.com/auth/adwords'],
  },
  {
    id: 'tiktok',
    name: 'TikTok Ads',
    icon: 'tiktok',
    color: '#000000',
    description: 'Connect TikTok Ads Manager for short-form video campaigns',
    scopes: ['user.info.basic', 'video.list', 'tc.offline_access'],
  },
];

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    @InjectRepository(PlatformConnection)
    private readonly repo: Repository<PlatformConnection>,
    private readonly encryption: TokenEncryptionService,
    private readonly campaigns: CampaignsService,
    private readonly config: ConfigService,
  ) {}

  getPlatformsInfo(): PlatformInfo[] {
    return PLATFORMS_INFO;
  }

  getOAuthUrl(
    platform: string,
    userId: number,
  ): { url: string } | { ready: false; message: string } {
    const cfg = this.getOAuthConfig(platform);

    if (!cfg.clientId || !cfg.clientSecret) {
      return {
        ready: false,
        message: `${platform} OAuth credentials are not configured. Set ${platform.toUpperCase()}_CLIENT_ID and ${platform.toUpperCase()}_CLIENT_SECRET in your environment.`,
      };
    }

    const state = Buffer.from(JSON.stringify({ userId, platform, ts: Date.now() })).toString('base64');
    const params = new URLSearchParams({
      client_id: cfg.clientId,
      redirect_uri: cfg.redirectUri,
      scope: cfg.scopes.join(platform === 'google' ? ' ' : ','),
      response_type: 'code',
      state,
    });

    if (platform === 'tiktok') {
      // TikTok uses slightly different param names
      const tiktokParams = new URLSearchParams({
        client_key: cfg.clientId,
        redirect_uri: cfg.redirectUri,
        scope: cfg.scopes.join(','),
        response_type: 'code',
        state,
      });
      return { url: `${cfg.authUrl}?${tiktokParams.toString()}` };
    }

    return { url: `${cfg.authUrl}?${params.toString()}` };
  }

  async handleCallback(platform: string, code: string, userId: number): Promise<PlatformConnection> {
    const cfg = this.getOAuthConfig(platform);

    if (!cfg.clientId || !cfg.clientSecret) {
      throw new InternalServerErrorException(`${platform} OAuth credentials not configured`);
    }

    let tokenData: Record<string, any>;
    try {
      tokenData = await this.exchangeCodeForTokens(platform, code, cfg);
    } catch (err) {
      this.logger.error(`Token exchange failed for ${platform}: ${err.message}`);
      throw new InternalServerErrorException(`OAuth token exchange failed: ${err.message}`);
    }

    const accessToken: string = tokenData.access_token || tokenData.accessToken || '';
    const refreshToken: string = tokenData.refresh_token || tokenData.refreshToken || '';
    const expiresIn: number = tokenData.expires_in || tokenData.expiresIn || 3600;

    // Upsert connection
    let conn = await this.repo.findOne({ where: { userId, platform } });
    if (!conn) {
      conn = this.repo.create({ userId, platform });
    }

    conn.accessTokenEnc = this.encryption.encrypt(accessToken);
    conn.refreshTokenEnc = this.encryption.encrypt(refreshToken);
    conn.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
    conn.status = ConnectionStatus.CONNECTED;
    conn.connectedAt = new Date();
    conn.scopes = cfg.scopes;
    conn.extraData = { raw: tokenData };

    // Try to fetch account info
    try {
      const accountInfo = await this.fetchAccountInfo(platform, accessToken);
      conn.accountId = accountInfo.id || '';
      conn.accountName = accountInfo.name || '';
    } catch (err) {
      this.logger.warn(`Could not fetch account info for ${platform}: ${err.message}`);
    }

    return this.repo.save(conn);
  }

  async getConnections(userId: number): Promise<Array<{
    platform: string;
    status: ConnectionStatus;
    accountId: string;
    accountName: string;
    connectedAt: Date | null;
    tokenExpiresAt: Date | null;
    scopes: string[];
  }>> {
    const connections = await this.repo.find({ where: { userId } });
    const connMap = new Map(connections.map((c) => [c.platform, c]));

    return PLATFORMS_INFO.map((p) => {
      const conn = connMap.get(p.id);
      return {
        platform: p.id,
        status: conn?.status ?? ConnectionStatus.DISCONNECTED,
        accountId: conn?.accountId ?? '',
        accountName: conn?.accountName ?? '',
        connectedAt: conn?.connectedAt ?? null,
        tokenExpiresAt: conn?.tokenExpiresAt ?? null,
        scopes: conn?.scopes ?? [],
      };
    });
  }

  async disconnect(platform: string, userId: number): Promise<void> {
    const conn = await this.repo.findOne({ where: { userId, platform } });
    if (!conn) throw new NotFoundException(`No connection found for ${platform}`);

    conn.status = ConnectionStatus.DISCONNECTED;
    conn.accessTokenEnc = '';
    conn.refreshTokenEnc = '';
    conn.tokenExpiresAt = null!;
    conn.accountId = '';
    conn.accountName = '';
    conn.scopes = [];
    conn.extraData = {};
    await this.repo.save(conn);
  }

  async publishCampaign(
    campaignId: number,
    userId: number,
  ): Promise<{ results: Array<{ platform: string; status: string; message: string }> }> {
    const campaign = await this.campaigns.findOneOwned(campaignId, userId);
    const connections = await this.repo.find({
      where: { userId, status: ConnectionStatus.CONNECTED },
    });

    const connMap = new Map(connections.map((c) => [c.platform, c]));
    const results: Array<{ platform: string; status: string; message: string }> = [];

    for (const platform of campaign.platforms) {
      const conn = connMap.get(platform);

      if (!conn) {
        results.push({ platform, status: 'skipped', message: `Not connected to ${platform}` });
        continue;
      }

      // Check token expiry
      if (conn.tokenExpiresAt && conn.tokenExpiresAt < new Date()) {
        conn.status = ConnectionStatus.EXPIRED;
        await this.repo.save(conn);
        results.push({ platform, status: 'error', message: `${platform} token has expired — please reconnect` });
        continue;
      }

      try {
        // Stubbed publish — real implementation would call platform API
        await this.stubPublish(platform, campaign, conn);
        results.push({ platform, status: 'success', message: `Campaign submitted to ${platform}` });
      } catch (err) {
        this.logger.error(`Publish to ${platform} failed: ${err.message}`);
        results.push({ platform, status: 'error', message: err.message });
      }
    }

    return { results };
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private getOAuthConfig(platform: string): OAuthConfig {
    const base = this.config.get<string>('APP_URL', 'http://localhost:8000');
    const redirectUri = `${base}/api/v1/integrations/callback/${platform}`;

    switch (platform) {
      case 'facebook':
      case 'instagram':
        return {
          clientId:     this.config.get<string>('FACEBOOK_CLIENT_ID', ''),
          clientSecret: this.config.get<string>('FACEBOOK_CLIENT_SECRET', ''),
          redirectUri,
          authUrl:  'https://www.facebook.com/v19.0/dialog/oauth',
          tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
          scopes:   platform === 'facebook'
            ? ['ads_management', 'ads_read', 'business_management']
            : ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights'],
        };

      case 'google':
        return {
          clientId:     this.config.get<string>('GOOGLE_CLIENT_ID', ''),
          clientSecret: this.config.get<string>('GOOGLE_CLIENT_SECRET', ''),
          redirectUri,
          authUrl:  'https://accounts.google.com/o/oauth2/v2/auth',
          tokenUrl: 'https://oauth2.googleapis.com/token',
          scopes:   ['https://www.googleapis.com/auth/adwords'],
        };

      case 'tiktok':
        return {
          clientId:     this.config.get<string>('TIKTOK_CLIENT_ID', ''),
          clientSecret: this.config.get<string>('TIKTOK_CLIENT_SECRET', ''),
          redirectUri,
          authUrl:  'https://www.tiktok.com/auth/authorize/',
          tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/',
          scopes:   ['user.info.basic', 'video.list', 'tc.offline_access'],
        };

      default:
        throw new NotFoundException(`Unknown platform: ${platform}`);
    }
  }

  private async exchangeCodeForTokens(
    platform: string,
    code: string,
    cfg: OAuthConfig,
  ): Promise<Record<string, any>> {
    const body: Record<string, string> = {
      grant_type:    'authorization_code',
      code,
      redirect_uri:  cfg.redirectUri,
      client_id:     cfg.clientId,
      client_secret: cfg.clientSecret,
    };

    const response = await fetch(cfg.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body).toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Token endpoint returned ${response.status}: ${text}`);
    }

    return response.json() as Promise<Record<string, any>>;
  }

  private async fetchAccountInfo(
    platform: string,
    accessToken: string,
  ): Promise<{ id: string; name: string }> {
    switch (platform) {
      case 'facebook':
      case 'instagram': {
        const res = await fetch(
          `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${accessToken}`,
        );
        const data = (await res.json()) as any;
        return { id: data.id || '', name: data.name || '' };
      }

      case 'google': {
        const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = (await res.json()) as any;
        return { id: data.id || '', name: data.name || data.email || '' };
      }

      case 'tiktok': {
        const res = await fetch('https://open-api.tiktok.com/user/info/', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = (await res.json()) as any;
        return {
          id: data.data?.user?.open_id || '',
          name: data.data?.user?.display_name || '',
        };
      }

      default:
        return { id: '', name: '' };
    }
  }

  private async stubPublish(
    platform: string,
    campaign: any,
    conn: PlatformConnection,
  ): Promise<void> {
    // Structured stub — in production this would call the platform's campaign create API
    this.logger.log(
      `[STUB] Publishing campaign "${campaign.name}" to ${platform} (account: ${conn.accountName || conn.accountId})`,
    );
    // Simulate async work
    await new Promise((r) => setTimeout(r, 50));
  }
}
