import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { GeminiService } from './gemini.service';

/**
 * GeminiService is a thin wrapper around the SDK. We don't try to test
 * Google's responses -- we test our parsing and fallback contract:
 *
 *   - When no API key is configured, isReady is false and every method
 *     short-circuits to null.
 *   - When the SDK returns malformed JSON, the service swallows the error
 *     and returns null (so the caller falls back gracefully).
 */

describe('GeminiService', () => {
  describe('without GEMINI_API_KEY', () => {
    let svc: GeminiService;

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        providers: [
          GeminiService,
          {
            provide: ConfigService,
            useValue: { get: jest.fn(() => undefined) },
          },
        ],
      }).compile();
      svc = moduleRef.get(GeminiService);
    });

    it('reports as not ready', () => {
      expect(svc.isReady).toBe(false);
    });

    it('returns null from generateCoachReply', async () => {
      const out = await svc.generateCoachReply('hi', { openTasks: 3 });
      expect(out).toBeNull();
    });

    it('returns null from generateRecommendation', async () => {
      const out = await svc.generateRecommendation(7, 4);
      expect(out).toBeNull();
    });

    it('returns null from analyzeJournalEntry', async () => {
      const out = await svc.analyzeJournalEntry('rough day');
      expect(out).toBeNull();
    });
  });

  describe('coach reply parsing (with mocked model)', () => {
    function svcWithModel(modelText: string) {
      // Hand-build the service with a fake model to avoid touching the real
      // GoogleGenerativeAI constructor.
      const svc = new GeminiService({
        get: jest.fn((key: string) =>
          key === 'GEMINI_API_KEY' ? 'fake-key' : 'gemini-1.5-flash',
        ),
      } as unknown as ConfigService);
      // Force-replace the private model with a stub. Cast through unknown
      // because the field is intentionally private.
      (svc as unknown as { model: unknown }).model = {
        generateContent: jest.fn().mockResolvedValue({
          response: { text: () => modelText },
        }),
      };
      return svc;
    }

    it('parses well-formed JSON into the expected shape', async () => {
      const svc = svcWithModel(
        JSON.stringify({
          reply: 'You are doing fine.',
          suggestions: ['rest', 'walk'],
          tone: 'reset',
        }),
      );
      const out = await svc.generateCoachReply('overwhelmed', {});
      expect(out).toEqual({
        reply: 'You are doing fine.',
        suggestions: ['rest', 'walk'],
        tone: 'reset',
      });
    });

    it('returns null when the response is not valid JSON', async () => {
      const svc = svcWithModel('not json at all');
      const out = await svc.generateCoachReply('hi', {});
      expect(out).toBeNull();
    });

    it('defaults tone to encourage when the model picks something invalid', async () => {
      const svc = svcWithModel(
        JSON.stringify({
          reply: 'ok',
          suggestions: ['x'],
          tone: 'invalid-tone-value',
        }),
      );
      const out = await svc.generateCoachReply('hi', {});
      expect(out?.tone).toBe('encourage');
    });

    it('caps suggestions at 3 even if the model returns more', async () => {
      const svc = svcWithModel(
        JSON.stringify({
          reply: 'ok',
          suggestions: ['a', 'b', 'c', 'd', 'e'],
          tone: 'encourage',
        }),
      );
      const out = await svc.generateCoachReply('hi', {});
      expect(out?.suggestions).toHaveLength(3);
    });
  });
});
