import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateWithGateway, listOpenRouterModels } from '@/lib/ai-gateway';
import { cleanAndParseJson, repairGeneratedOutput } from '@/app/api/generate/route';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('OpenRouter routing', () => {
  it('filters unsuitable free models and ranks capable instruction models first', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: [
        { id: 'lfm2.5-2.6b', context_length: 16_000, pricing: { prompt: '0', completion: '0' } },
        { id: 'text-embed-3-large', context_length: 16_000, pricing: { prompt: '0', completion: '0' } },
        { id: 'qwen/qwen-2.5-32b-instruct:free', context_length: 32_000, pricing: { prompt: '0', completion: '0' } },
        { id: 'meta-llama/llama-3.3-70b-instruct:free', context_length: 32_000, pricing: { prompt: '0', completion: '0' } }
      ]
    }), { status: 200 })));

    const models = await listOpenRouterModels('test-key');
    expect(models.map((model) => model.id)).toEqual([
      'meta-llama/llama-3.3-70b-instruct:free',
      'qwen/qwen-2.5-32b-instruct:free'
    ]);
  });

  it('omits response_format and limits reasoning overhead for OpenRouter', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        data: [{ id: 'qwen/qwen-2.5-32b-instruct:free', context_length: 32_000, pricing: { prompt: '0', completion: '0' } }]
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        choices: [{ message: { content: '<think>hidden</think>{"ok":true}' } }]
      }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(generateWithGateway({
      provider: 'openrouter',
      model: 'openrouter/free',
      apiKey: 'test-key',
      system: 'system',
      user: 'user',
      timeoutMs: 1000
    })).resolves.toContain('<think>');

    const requestBody = JSON.parse(fetchMock.mock.calls[1][1].body as string) as Record<string, unknown>;
    expect(requestBody.response_format).toBeUndefined();
    expect(requestBody.reasoning).toEqual({ effort: 'low' });
    expect(requestBody.max_tokens).toBeGreaterThanOrEqual(10_000);
  });

  it('retries an unavailable configured model with a filtered free model', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('model unavailable', { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        data: [{ id: 'qwen/qwen-2.5-32b-instruct:free', context_length: 32_000, pricing: { prompt: '0', completion: '0' } }]
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        choices: [{ message: { content: '{"ok":true}' } }]
      }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(generateWithGateway({
      provider: 'openrouter',
      model: 'stale/model',
      apiKey: 'test-key',
      system: 'system',
      user: 'user',
      timeoutMs: 1000
    })).resolves.toBe('{"ok":true}');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(JSON.parse(fetchMock.mock.calls[2][1].body as string).model).toBe('qwen/qwen-2.5-32b-instruct:free');
  });
});

describe('Generated output repair', () => {
  it('removes reasoning and fences before parsing JSON', () => {
    expect(cleanAndParseJson('<think>work</think>```json\n{"ok":true}\n```')).toEqual({ ok: true });
  });

  it('repairs numbering, time slots, and missing sample row keys', () => {
    const output = {
      previewApp: { columns: ['caseId', 'status', 'owner'], sampleRows: [{ caseId: '1', status: 'Open' }] },
      pitchDeck: Array.from({ length: 10 }, () => ({ slideNumber: 99 })),
      demoKit: { scriptSegments: Array.from({ length: 4 }, () => ({ timeRange: '0-15s' })) }
    };
    const repaired = repairGeneratedOutput(output) as typeof output;
    expect(repaired.previewApp.sampleRows[0]).toEqual({ caseId: '1', status: 'Open', owner: '' });
    expect(repaired.pitchDeck.map((slide) => slide.slideNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(repaired.demoKit.scriptSegments.map((segment) => segment.timeRange)).toEqual([
      '0:00 - 0:15', '0:15 - 0:30', '0:30 - 0:45', '0:45 - 1:00'
    ]);
  });
});
