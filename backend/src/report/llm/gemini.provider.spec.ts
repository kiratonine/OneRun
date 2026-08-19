import axios from 'axios';
import { TripSummaryDto } from '../dto/trip-summary.dto';
import { buildFallbackReport } from '../templates/fallback-report';
import { GeminiProvider } from './gemini.provider';

const summary: TripSummaryDto = {
  tripCode: 'TRIP-001',
  hubName: 'Актау',
  stopOrder: ['Актау', 'Шетпе', 'Актау'],
  totalDistanceKm: 220,
  soloDistanceKm: 240,
  savedDistanceKm: 20,
  savedCostKzt: 3570,
  totalWeightKg: 520,
  costPerKmKzt: 178.5,
  orders: [],
};

const validGeminiReport = `# Отчёт

## Маршрут следования
220 км

## План погрузки
| Очерёдность загрузки | Заявка | Посёлок | Груз | Вес | Места | Размещение |
|---:|---|---|---|---:|---|---|

## Стоимость по заявкам
| Заявка | Отправитель | Посёлок | Вес | Расстояние от хаба | Цена |
|---|---|---|---:|---:|---:|
240 км

## Экономический эффект
- Сэкономлено: 20 км, 3570 ₸
- Общий вес груза: 520 кг
- Стоимость километра: 178.5 ₸/км

## Особые замечания
Нет`;

describe('GeminiProvider', () => {
  const originalKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-api-key';
    process.env.GEMINI_MODEL = 'test-model';
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalKey;
    }
    if (originalModel === undefined) {
      delete process.env.GEMINI_MODEL;
    } else {
      process.env.GEMINI_MODEL = originalModel;
    }
    jest.restoreAllMocks();
  });

  it('requests Gemini with a 15 second timeout and cleans a Markdown fence', async () => {
    const response = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: `\`\`\`markdown\n${validGeminiReport}\n\`\`\``,
              },
            ],
          },
        },
      ],
    };
    const post = jest
      .spyOn(axios, 'post')
      .mockResolvedValue({ data: response });

    const result = await new GeminiProvider().generate(summary);

    expect(result).toEqual({
      contentMd: validGeminiReport,
      raw: response,
      source: 'gemini',
    });
    expect(post).toHaveBeenCalledWith(
      expect.stringContaining('/test-model:generateContent'),
      expect.objectContaining({
        system_instruction: expect.any(Object),
        contents: expect.any(Array),
      }),
      expect.objectContaining({
        timeout: 15_000,
        headers: expect.objectContaining({ 'x-goog-api-key': 'test-api-key' }),
      }),
    );
  });

  it('returns the fallback report when Gemini fails', async () => {
    jest.spyOn(axios, 'post').mockRejectedValue(new Error('network failed'));

    const result = await new GeminiProvider().generate(summary);

    expect(result.source).toBe('mock');
    expect(result.raw).toBeNull();
    expect(result.contentMd).toContain('# План рейса TRIP-001');
  });

  it('returns the fallback report for an empty Gemini response', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({ data: { candidates: [] } });

    const result = await new GeminiProvider().generate(summary);

    expect(result.source).toBe('mock');
    expect(result.contentMd).toContain('# План рейса TRIP-001');
  });

  it('returns the fallback report when Gemini omits required numbers', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      data: {
        candidates: [{ content: { parts: [{ text: '# Неполный отчёт' }] } }],
      },
    });

    const result = await new GeminiProvider().generate(summary);

    expect(result.source).toBe('mock');
    expect(result.contentMd).toContain('# План рейса TRIP-001');
  });

  it('returns the fallback report when Gemini omits required sections', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      data: {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: '# Неполный отчёт\n\n220 км, 240 км, 20 км, 3570 ₸, 520 кг, 178.5 ₸/км',
                },
              ],
            },
          },
        ],
      },
    });

    const result = await new GeminiProvider().generate(summary);

    expect(result.source).toBe('mock');
    expect(result.contentMd).toContain('## Маршрут следования');
  });

  it('returns the localized fallback when Gemini exposes technical field names as table headers', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      data: {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: validGeminiReport
                    .replace(
                      '| Очерёдность загрузки | Заявка | Посёлок | Груз | Вес | Места | Размещение |',
                      '| loadPosition | code | toName | cargoName | weightKg | boxesCount | boxNote |',
                    )
                    .replace(
                      '| Заявка | Отправитель | Посёлок | Вес | Расстояние от хаба | Цена |',
                      '| code | shipperName | toName | weightKg | legDistanceKm | priceKzt |',
                    ),
                },
              ],
            },
          },
        ],
      },
    });

    const result = await new GeminiProvider().generate(summary);

    expect(result.source).toBe('mock');
    expect(result.contentMd).toContain(
      '| Очерёдность загрузки | Заявка | Посёлок | Груз | Вес | Места | Размещение |',
    );
    expect(result.contentMd).not.toContain('| loadPosition | code | toName |');
  });

  it('returns the localized fallback when Gemini exposes technical field names as economic labels', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      data: {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: validGeminiReport
                    .replace('Общий вес груза', 'totalWeightKg')
                    .replace('Стоимость километра', 'costPerKmKzt'),
                },
              ],
            },
          },
        ],
      },
    });

    const result = await new GeminiProvider().generate(summary);

    expect(result.source).toBe('mock');
    expect(result.contentMd).toContain('Расчётная себестоимость');
    expect(result.contentMd).not.toContain('totalWeightKg');
    expect(result.contentMd).not.toContain('costPerKmKzt');
  });

  it('retries Gemini with a correction when cargo placement is reversed', async () => {
    const loadingSummary: TripSummaryDto = {
      ...summary,
      orders: [
        {
          code: 'ORD-FIRST',
          shipperName: 'First shipper',
          toName: 'First stop',
          cargoName: 'First cargo',
          weightKg: 100,
          boxesCount: 1,
          boxNote: null,
          dropIndex: 1,
          loadPosition: 2,
          priceKzt: 10_000,
          legDistanceKm: 50,
        },
        {
          code: 'ORD-LAST',
          shipperName: 'Last shipper',
          toName: 'Last stop',
          cargoName: 'Last cargo',
          weightKg: 420,
          boxesCount: 2,
          boxNote: null,
          dropIndex: 2,
          loadPosition: 1,
          priceKzt: 29_270,
          legDistanceKm: 120,
        },
      ],
    };
    const correctReport = buildFallbackReport(loadingSummary);
    const reversedReport = `${correctReport
      .replace('ставить у дверей', '__PLACEMENT__')
      .replace('ставить в глубине прицепа', 'ставить у дверей')
      .replace('__PLACEMENT__', 'ставить в глубине прицепа')}

Общий вес груза: 520
Стоимость километра: 178.5`;
    const reportLabels = reversedReport.slice(
      reversedReport.lastIndexOf('\n\n'),
    );
    const correctedReport = `${correctReport}${reportLabels}`;
    const post = jest
      .spyOn(axios, 'post')
      .mockResolvedValueOnce({
        data: {
          candidates: [{ content: { parts: [{ text: reversedReport }] } }],
        },
      })
      .mockResolvedValueOnce({
        data: {
          candidates: [{ content: { parts: [{ text: correctedReport }] } }],
        },
      });

    const result = await new GeminiProvider().generate(loadingSummary);

    expect(result.source).toBe('gemini');
    expect(result.contentMd).toBe(correctedReport);
    expect(post).toHaveBeenCalledTimes(2);
    expect(post.mock.calls[1][1]).toEqual(
      expect.objectContaining({
        contents: [
          expect.objectContaining({
            parts: [
              expect.objectContaining({
                text: expect.stringContaining('dropIndex'),
              }),
            ],
          }),
        ],
      }),
    );
  });
});
