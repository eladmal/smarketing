import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { CopyModule } from './copy/copy.module';
import { AudiencesModule } from './audiences/audiences.module';
import { AssetsModule } from './assets/assets.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { AlertsModule } from './alerts/alerts.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const dbUrl = cfg.get<string>('DATABASE_URL', '');
        const isProd = cfg.get('NODE_ENV') === 'production';

        // Dev: SQLite — Prod: PostgreSQL
        if (!dbUrl || dbUrl.startsWith('sqlite')) {
          return {
            type: 'better-sqlite3',
            database: cfg.get('SQLITE_PATH', 'smarketing.db'),
            autoLoadEntities: true,
            synchronize: true,
          } as any;
        }

        return {
          type: 'postgres',
          url: dbUrl,
          autoLoadEntities: true,
          synchronize: cfg.get('DB_SYNC', 'false') === 'true' || !isProd,
          ssl: false,
        };
      },
    }),

    ThrottlerModule.forRoot([{ name: 'global', ttl: 60_000, limit: 100 }]),
    ScheduleModule.forRoot(),

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: { fallthrough: true },
    }),

    AuthModule,
    UsersModule,
    CampaignsModule,
    CopyModule,
    AudiencesModule,
    AssetsModule,
    IntegrationsModule,
    AlertsModule,
    AnalyticsModule,
    SubscriptionsModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
