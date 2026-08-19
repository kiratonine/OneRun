import { GeminiProvider } from './llm/gemini.provider';
import { MockProvider } from './llm/mock.provider';
import { ReportService } from './report.service';

const summary = {
  tripCode: 'TRIP-001',
  hubName: 'Актау',
  stopOrder: ['Актау', 'Шетпе', 'Актау'],
  totalDistanceKm: 220,
  soloDistanceKm: 240,
  savedDistanceKm: 20,
  savedCostKzt: 3570,
  totalWeightKg: 520,
  costPerKmKzt: 178.5,
  orders: [
    {
      code: 'ORD-001',
      shipperName: 'ИП Дәулет',
      toName: 'Шетпе',
      cargoName: 'Стройматериалы',
      weightKg: 520,
      boxesCount: 10,
      boxNote: '10 мешков',
      dropIndex: 1,
      loadPosition: 1,
      priceKzt: 39_270,
      legDistanceKm: 110,
    },
  ],
};

describe('ReportService', () => {
  const originalProvider = process.env.LLM_PROVIDER;
  const originalKey = process.env.GEMINI_API_KEY;

  afterEach(() => {
    if (originalProvider === undefined) {
      delete process.env.LLM_PROVIDER;
    } else {
      process.env.LLM_PROVIDER = originalProvider;
    }
    if (originalKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalKey;
    }
    jest.restoreAllMocks();
  });

  it('uses the deterministic mock provider by default', async () => {
    delete process.env.LLM_PROVIDER;
    delete process.env.GEMINI_API_KEY;

    const result = await new ReportService().generate(summary);

    expect(result.source).toBe('mock');
    expect(result.raw).toBeNull();
    expect(result.contentMd).toContain('# План рейса TRIP-001');
    expect(result.contentMd).toContain('## План погрузки');
  });

  it('uses Gemini only when both provider and key are configured', async () => {
    process.env.LLM_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'configured-key';
    const mockProvider = new MockProvider();
    const geminiProvider = new GeminiProvider();
    jest.spyOn(geminiProvider, 'generate').mockResolvedValue({
      contentMd: '# Gemini report',
      raw: { ok: true },
      source: 'gemini',
    });
    const service = new ReportService(mockProvider, geminiProvider);

    await expect(service.generate(summary)).resolves.toEqual({
      contentMd: '# Gemini report',
      raw: { ok: true },
      source: 'gemini',
    });
    expect(service.status()).toEqual({ provider: 'gemini', hasKey: true });
  });

  it('falls back to mock when Gemini is requested without a key', async () => {
    process.env.LLM_PROVIDER = 'gemini';
    delete process.env.GEMINI_API_KEY;
    const geminiProvider = new GeminiProvider();
    const geminiGenerate = jest.spyOn(geminiProvider, 'generate');
    const service = new ReportService(new MockProvider(), geminiProvider);

    const result = await service.generate(summary);

    expect(result.source).toBe('mock');
    expect(geminiGenerate).not.toHaveBeenCalled();
    expect(service.status()).toEqual({ provider: 'mock', hasKey: false });
  });

  it('never throws when the selected provider fails', async () => {
    process.env.LLM_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'configured-key';
    const mockProvider = new MockProvider();
    const geminiProvider = new GeminiProvider();
    jest
      .spyOn(geminiProvider, 'generate')
      .mockRejectedValue(new Error('provider failed'));

    const result = await new ReportService(
      mockProvider,
      geminiProvider,
    ).generate(summary);

    expect(result.source).toBe('mock');
    expect(result.contentMd).toContain('# План рейса TRIP-001');
  });
});
