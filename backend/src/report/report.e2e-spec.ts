import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../app.module';

describe('Report HTTP diagnostics', () => {
  let app: INestApplication;
  const originalProvider = process.env.LLM_PROVIDER;
  const originalKey = process.env.GEMINI_API_KEY;

  beforeAll(async () => {
    process.env.LLM_PROVIDER = 'mock';
    delete process.env.GEMINI_API_KEY;
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
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
    await app.close();
  });

  it('serves GET /api/report/status', async () => {
    await request(app.getHttpServer())
      .get('/api/report/status')
      .expect(200)
      .expect({ provider: 'mock', hasKey: false });
  });
});
