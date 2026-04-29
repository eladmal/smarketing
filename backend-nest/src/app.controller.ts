import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@SkipThrottle()
@Controller()
export class AppController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  root() {
    return {
      app: 'Smarketing',
      version: process.env.npm_package_version || '1.0.0',
      status: 'running',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('health')
  async health() {
    const dbStatus = await this._checkDb();
    const uptime = Math.floor(process.uptime());

    return {
      status: dbStatus ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime_seconds: uptime,
      services: {
        database: dbStatus ? 'ok' : 'error',
      },
      memory: {
        used_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total_mb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    };
  }

  private async _checkDb(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
