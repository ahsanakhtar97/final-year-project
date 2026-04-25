import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface SentimentResponse {
  english: string;
  urdu: string;
  sentiment_score: number;
}

interface RecommendationResponse {
  recommendation: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl =
      this.configService.get<string>('AI_SERVICE_URL') ?? 'http://127.0.0.1:5002';
  }

  /**
   * Qualitative sentiment analysis for the Growth Journal.
   * Falls back to a friendly canned message when the Python service is down.
   */
  async analyzeSentiment(text: string): Promise<{
    englishMessage: string;
    urduMessage: string;
    score: number;
  }> {
    const url = `${this.baseUrl}/analyze_text`;

    try {
      const response = await firstValueFrom(
        this.httpService.post<SentimentResponse>(url, { text }),
      );
      return {
        englishMessage: response.data.english,
        urduMessage: response.data.urdu,
        score: response.data.sentiment_score,
      };
    } catch (error) {
      this.logger.warn(
        `Sentiment analysis fallback engaged: ${(error as Error).message}`,
      );
      return {
        englishMessage: 'Reflection saved. Keep tracking your progress!',
        urduMessage: 'آپ کی تحریر محفوظ کر لی گئی ہے۔',
        score: 50,
      };
    }
  }

  /**
   * Quantitative recommendation based on mood + outstanding-task count.
   */
  async getRecommendation(moodScore: number, tasksCount: number): Promise<string> {
    const url = `${this.baseUrl}/recommend`;
    const payload = {
      mood_score: moodScore,
      incomplete_tasks_count: tasksCount,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post<RecommendationResponse>(url, payload),
      );
      return response.data.recommendation;
    } catch (error) {
      this.logger.warn(
        `Recommendation fallback engaged: ${(error as Error).message}`,
      );
      return 'Keep pushing forward! (جاری رکھیں!)';
    }
  }
}
