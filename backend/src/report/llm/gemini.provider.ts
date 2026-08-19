import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ReportResult, TripSummaryDto } from '../dto/trip-summary.dto';
import {
  buildReportPrompt,
  COST_PER_KM_LABEL,
  LOADING_TABLE_HEADER,
  PRICE_TABLE_HEADER,
  REPORT_SYSTEM_INSTRUCTION,
  TOTAL_WEIGHT_LABEL,
} from '../prompts/report.prompt';
import { buildFallbackReport } from '../templates/fallback-report';
import { LlmProvider } from './llm.provider';

const GEMINI_API_BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_TIMEOUT_MS = 15_000;
const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite';

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

interface GeminiAttempt {
  contentMd: string;
  raw: GeminiGenerateContentResponse;
}

class LoadingPlanConsistencyError extends Error {}

export function cleanMarkdownResponse(text: string): string {
  return text
    .trim()
    .replace(/^```(?:markdown|md)?\s*(?:\r?\n)?/i, '')
    .replace(/(?:\r?\n)?```\s*$/, '')
    .trim();
}

function extractText(response: GeminiGenerateContentResponse): string {
  return (
    response.candidates?.[0]?.content?.parts
      ?.map(({ text }) => text ?? '')
      .join('\n') ?? ''
  );
}

function containsExactNumber(content: string, value: number): boolean {
  const token = String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\d.,])${token}($|[^\\d.,])`).test(content);
}

function hasRequiredNumbers(content: string, summary: TripSummaryDto): boolean {
  const required = [
    summary.totalDistanceKm,
    summary.soloDistanceKm,
    summary.savedDistanceKm,
    summary.savedCostKzt,
    summary.totalWeightKg,
    summary.costPerKmKzt,
    ...summary.orders.flatMap((order) => [
      order.weightKg,
      ...(order.boxesCount === null ? [] : [order.boxesCount]),
      order.dropIndex,
      order.loadPosition,
      order.priceKzt,
      order.legDistanceKm,
    ]),
  ];

  return [...new Set(required.filter(Number.isFinite))].every((value) =>
    containsExactNumber(content, value),
  );
}

const REQUIRED_REPORT_SECTIONS = [
  'Маршрут следования',
  'План погрузки',
  'Стоимость по заявкам',
  'Экономический эффект',
  'Особые замечания',
] as const;

function hasRequiredSections(content: string): boolean {
  return REQUIRED_REPORT_SECTIONS.every((section) => content.includes(section));
}

function hasLocalizedLabels(content: string): boolean {
  return (
    content.includes(LOADING_TABLE_HEADER) &&
    content.includes(PRICE_TABLE_HEADER) &&
    content.includes(TOTAL_WEIGHT_LABEL) &&
    content.includes(COST_PER_KM_LABEL)
  );
}

function hasConsistentLoadingPlan(
  content: string,
  summary: TripSummaryDto,
): boolean {
  if (summary.orders.length < 2) {
    return true;
  }

  const loadingStart = content.indexOf('План погрузки');
  const loadingEnd = content.indexOf('Стоимость по заявкам', loadingStart);
  if (loadingStart < 0 || loadingEnd < 0) {
    return false;
  }

  const loadingLines = content.slice(loadingStart, loadingEnd).split(/\r?\n/);
  const firstDropIndex = Math.min(
    ...summary.orders.map(({ dropIndex }) => dropIndex),
  );
  const lastDropIndex = Math.max(
    ...summary.orders.map(({ dropIndex }) => dropIndex),
  );
  if (firstDropIndex === lastDropIndex) {
    return true;
  }

  const rowContains = (code: string, placement: RegExp) =>
    loadingLines.some((line) => line.includes(code) && placement.test(line));

  return (
    summary.orders
      .filter(({ dropIndex }) => dropIndex === firstDropIndex)
      .every(({ code }) => rowContains(code, /двер/i)) &&
    summary.orders
      .filter(({ dropIndex }) => dropIndex === lastDropIndex)
      .every(({ code }) => rowContains(code, /глубин/i))
  );
}

function validateReport(contentMd: string, summary: TripSummaryDto): void {
  if (!contentMd) {
    throw new Error('Empty Gemini response');
  }
  if (!hasRequiredNumbers(contentMd, summary)) {
    throw new Error('Gemini response omitted required numeric values');
  }
  if (!hasRequiredSections(contentMd)) {
    throw new Error('Gemini response omitted required report sections');
  }
  if (!hasLocalizedLabels(contentMd)) {
    throw new Error('Gemini response omitted localized report labels');
  }
  if (!hasConsistentLoadingPlan(contentMd, summary)) {
    throw new LoadingPlanConsistencyError(
      'Gemini response contradicts route loading order',
    );
  }
}

function buildLoadingCorrectionPrompt(summary: TripSummaryDto): string {
  return `${buildReportPrompt(summary)}

Предыдущий ответ был отклонён из-за неверного размещения груза. Сформируй полный отчёт заново. Строго проверь план погрузки: заявка с минимальным dropIndex выгружается первой и должна стоять у дверей; заявка с максимальным dropIndex выгружается последней и должна стоять в глубине прицепа.`;
}

function errorReason(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return `HTTP status=${error.response?.status ?? 'none'} code=${error.code ?? 'none'}`;
  }
  return error instanceof Error ? error.message : 'unknown error';
}

@Injectable()
export class GeminiProvider implements LlmProvider {
  private readonly logger = new Logger(GeminiProvider.name);

  async generate(summary: TripSummaryDto): Promise<ReportResult> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is empty; using fallback report');
      return this.fallback(summary);
    }

    const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

    try {
      const firstAttempt = await this.request(
        model,
        apiKey,
        buildReportPrompt(summary),
      );

      try {
        validateReport(firstAttempt.contentMd, summary);
        return {
          contentMd: firstAttempt.contentMd,
          raw: firstAttempt.raw,
          source: 'gemini',
        };
      } catch (error: unknown) {
        if (!(error instanceof LoadingPlanConsistencyError)) {
          throw error;
        }

        this.logger.warn(`${error.message}; retrying with correction`);
      }

      const correctedAttempt = await this.request(
        model,
        apiKey,
        buildLoadingCorrectionPrompt(summary),
      );
      validateReport(correctedAttempt.contentMd, summary);

      return {
        contentMd: correctedAttempt.contentMd,
        raw: correctedAttempt.raw,
        source: 'gemini',
      };
    } catch (error: unknown) {
      this.logger.warn(
        `Gemini failed; using fallback report (${errorReason(error)})`,
      );
      return this.fallback(summary);
    }
  }

  private async request(
    model: string,
    apiKey: string,
    prompt: string,
  ): Promise<GeminiAttempt> {
    const { data } = await axios.post<GeminiGenerateContentResponse>(
      `${GEMINI_API_BASE_URL}/${encodeURIComponent(model)}:generateContent`,
      {
        system_instruction: {
          parts: [{ text: REPORT_SYSTEM_INSTRUCTION }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: { temperature: 0.2 },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        timeout: GEMINI_TIMEOUT_MS,
      },
    );

    return {
      contentMd: cleanMarkdownResponse(extractText(data)),
      raw: data,
    };
  }

  private fallback(summary: TripSummaryDto): ReportResult {
    return {
      contentMd: buildFallbackReport(summary),
      raw: null,
      source: 'mock',
    };
  }
}
