import { describe, expect, it } from 'vitest';
import { FALLBACK_HACKSTACK_RESULT } from '@/types/hackstack';
import { mergeAgentPatch, parseAgentPatch } from '@/lib/agents';

describe('agent workspace patches', () => {
  it('strips reasoning and fences while normalizing slides, timing, and row keys', () => {
    const patch = parseAgentPatch(`<think>internal reasoning</think>
\`\`\`json
{"livePreview":{"columns":["Order Name","status"],"sampleRows":[{"order_name":"Pool A","STATUS":"Active"}]},"pitchSlides":[{"title":"Hook"}],"demoScript":[{"timeRange":"0-15s"}]}
\`\`\``);

    expect(patch.livePreview?.columns).toEqual(['orderName', 'status']);
    expect(patch.livePreview?.sampleRows).toEqual([{ orderName: 'Pool A', status: 'Active' }]);
    expect(patch.pitchSlides?.[0].slideNumber).toBe(1);
    expect(patch.demoScript?.[0].timeRange).toBe('0:00 - 0:15');
  });

  it('merges targeted patches without wiping unrelated tabs', () => {
    const originalPitch = FALLBACK_HACKSTACK_RESULT.pitchDeck;
    const next = mergeAgentPatch(FALLBACK_HACKSTACK_RESULT, {
      files: { 'src/app/page.tsx': 'export default function Page() {}' },
      pitchSlides: Array.from({ length: 10 }, (_, index) => ({
        title: index === 0 ? 'Updated pitch' : `Slide ${index + 1}`,
        headline: 'Keep this deck targeted',
        bullets: ['One'],
        speakerNote: 'Note'
      }))
    });

    expect(next.codebase.additionalFiles?.[0].path).toBe('src/app/page.tsx');
    expect(next.pitchDeck[0].title).toBe('Updated pitch');
    expect(next.previewApp.sampleRows).toEqual(FALLBACK_HACKSTACK_RESULT.previewApp.sampleRows);
    expect(next.previewApp.metrics).toEqual(FALLBACK_HACKSTACK_RESULT.previewApp.metrics);
    expect(originalPitch).not.toBe(next.pitchDeck);
  });
});
