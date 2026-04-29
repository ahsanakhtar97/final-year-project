import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Report } from './entities/report.entity';
import { User } from '../users/entities/user.entity';
import { AnalyticsService } from '../analytics/analytics.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly analyticsService: AnalyticsService,
    private readonly aiService: AiService,
  ) {}

  @Cron(CronExpression.EVERY_WEEKEND)
  async generateWeeklyReports() {
    this.logger.log('Starting weekly report generation...');
    
    // In a real prod app, you would chunk this
    const users = await this.userRepository.find();
    
    for (const user of users) {
      try {
        await this.generateReportForUser(user.userId);
      } catch (error) {
        this.logger.error(`Failed to generate report for user ${user.userId}`, error);
      }
    }
    
    this.logger.log('Weekly report generation complete.');
  }

  async generateReportForUser(userId: number) {
    const analytics = await this.analyticsService.getUserAnalytics(userId);
    
    // Very basic prompt generation
    const prompt = `Based on the following data of habit completion and mood for the past week, write a short, encouraging weekly wellness summary and a tip for the next week. Data: ${JSON.stringify(analytics.correlations.slice(-7))}`;
    
    const summary = await this.aiService.generateText(prompt);

    const report = this.reportRepository.create({
      userId,
      summary,
      metadata: { period: 'weekly', dataLength: analytics.correlations.slice(-7).length }
    });

    await this.reportRepository.save(report);
  }

  async getUserReports(userId: number) {
    return this.reportRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10
    });
  }
}
