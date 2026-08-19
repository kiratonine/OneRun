import axios from 'axios';
import { TripSummaryDto } from '../dto/trip-summary.dto';
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
                text: '```markdown\n# Отчёт\n\n## Маршрут следования\n220 км\n\n## План погрузки\n520 кг\n\n## Стоимость по заявкам\n240 км\n\n## Экономический эффект\n20 км, 3570 ₸, 178.5 ₸/км\n\n## Особые замечания\nНет\n```',
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
      contentMd:
        '# Отчёт\n\n## Маршрут следования\n220 км\n\n## План погрузки\n520 кг\n\n## Стоимость по заявкам\n240 км\n\n## Экономический эффект\n20 км, 3570 ₸, 178.5 ₸/км\n\n## Особые замечания\nНет',
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
});
