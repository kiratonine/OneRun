import { Injectable, Logger } from '@nestjs/common';
import { ReportResult, TripSummaryDto } from './dto/trip-summary.dto';
import { GeminiProvider } from './llm/gemini.provider';
import { LlmProvider } from './llm/llm.provider';
import { MockProvider } from './llm/mock.provider';

export interface ReportStatus {
  provider: 'gemini' | 'mock';
  hasKey: boolean;
}

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private readonly mockProvider: MockProvider = new MockProvider(),
    private readonly geminiProvider: GeminiProvider = new GeminiProvider(),
  ) {}

  async generate(summary: TripSummaryDto): Promise<ReportResult> {
    const provider = this.resolveProvider(true);

    try {
      return await provider.generate(summary);
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Report provider failed; using mock (${reason})`);

      try {
        return await this.mockProvider.generate(summary);
      } catch {
        return {
          contentMd: `# План рейса ${summary?.tripCode ?? 'без кода'}\n\nОтчёт временно недоступен.`,
          raw: null,
          source: 'mock',
        };
      }
    }
  }

  status(): ReportStatus {
    const hasKey = Boolean(process.env.GEMINI_API_KEY?.trim());
    return {
      provider:
        process.env.LLM_PROVIDER?.trim().toLowerCase() === 'gemini' && hasKey
          ? 'gemini'
          : 'mock',
      hasKey,
    };
  }

  private resolveProvider(logFallback: boolean): LlmProvider {
    const requested = process.env.LLM_PROVIDER?.trim().toLowerCase() || 'mock';
    const hasKey = Boolean(process.env.GEMINI_API_KEY?.trim());

    if (requested === 'gemini' && hasKey) {
      return this.geminiProvider;
    }
    if (logFallback && requested === 'gemini' && !hasKey) {
      this.logger.warn('GEMINI_API_KEY is empty; using mock provider');
    } else if (logFallback && requested !== 'mock') {
      this.logger.warn(`Unsupported LLM_PROVIDER=${requested}; using mock`);
    }

    return this.mockProvider;
  }
}
