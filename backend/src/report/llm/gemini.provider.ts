import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ReportResult, TripSummaryDto } from '../dto/trip-summary.dto';
import {
  buildReportPrompt,
  REPORT_SYSTEM_INSTRUCTION,
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
      const { data } = await axios.post<GeminiGenerateContentResponse>(
        `${GEMINI_API_BASE_URL}/${encodeURIComponent(model)}:generateContent`,
        {
          system_instruction: {
            parts: [{ text: REPORT_SYSTEM_INSTRUCTION }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: buildReportPrompt(summary) }],
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
      const contentMd = cleanMarkdownResponse(extractText(data));
      if (!contentMd) {
        throw new Error('Empty Gemini response');
      }
      if (!hasRequiredNumbers(contentMd, summary)) {
        throw new Error('Gemini response omitted required numeric values');
      }

      return { contentMd, raw: data, source: 'gemini' };
    } catch (error: unknown) {
      this.logger.warn(
        `Gemini failed; using fallback report (${errorReason(error)})`,
      );
      return this.fallback(summary);
    }
  }

  private fallback(summary: TripSummaryDto): ReportResult {
    return {
      contentMd: buildFallbackReport(summary),
      raw: null,
      source: 'mock',
    };
  }
}
