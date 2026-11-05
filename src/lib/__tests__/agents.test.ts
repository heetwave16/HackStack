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

  it.each([
    { format: 'seconds', timeRanges: ['0-15s', '15-30s', '30-45s', '45-60s'] },
    { format: 'canonical', timeRanges: ['0:00 - 0:15', '0:15 - 0:30', '0:30 - 0:45', '0:45 - 1:00'] }
  ])('preserves all four $format ranges through parsing and merging', ({ timeRanges }) => {
    const patch = parseAgentPatch(JSON.stringify({
      demoScript: timeRanges.map((timeRange) => ({ timeRange, visualAction: 'Demo action', voiceover: 'Demo narration' }))
    }));
    const expected = ['0:00 - 0:15', '0:15 - 0:30', '0:30 - 0:45', '0:45 - 1:00'];

    expect(patch.demoScript?.map((segment) => segment.timeRange)).toEqual(expected);
    const next = mergeAgentPatch(FALLBACK_HACKSTACK_RESULT, patch);
    expect(next.demoKit.scriptSegments.map((segment) => segment.timeRange)).toEqual(expected);
    expect(next.demoKit.scriptSegments.every((segment) => segment.visualAction === 'Demo action' && segment.voiceover === 'Demo narration')).toBe(true);
  });

  it('preserves omitted preview fields in metadata-only patches', () => {
    const patch = parseAgentPatch('{"livePreview":{"tagline":"Updated tagline"}}');

    expect(patch.livePreview?.columns).toBeUndefined();
    expect(patch.livePreview?.sampleRows).toBeUndefined();
    const next = mergeAgentPatch(FALLBACK_HACKSTACK_RESULT, patch);
    expect(next.tagline).toBe('Updated tagline');
    expect(next.previewApp.columns).toEqual(FALLBACK_HACKSTACK_RESULT.previewApp.columns);
    expect(next.previewApp.sampleRows).toEqual(FALLBACK_HACKSTACK_RESULT.previewApp.sampleRows);
  });

  it('normalizes rows-only preview patches against existing columns', () => {
    const sampleRows = [{ 'Pool Name': 'Updated pool', hostel_wing: 'A', total_amount: 500, STATUS: 'Open' }];
    const patch = parseAgentPatch(JSON.stringify({ livePreview: { sampleRows } }));

    expect(patch.livePreview?.columns).toBeUndefined();
    expect(patch.livePreview?.sampleRows).toEqual(sampleRows);
    const next = mergeAgentPatch(FALLBACK_HACKSTACK_RESULT, patch);
    expect(next.previewApp.columns).toEqual(FALLBACK_HACKSTACK_RESULT.previewApp.columns);
    expect(next.previewApp.sampleRows).toEqual([{ poolName: 'Updated pool', hostelWing: 'A', totalAmount: '500', status: 'Open' }]);
  });

  it('preserves existing rows when a preview patch only supplies columns', () => {
    const patch = parseAgentPatch(JSON.stringify({ livePreview: { columns: FALLBACK_HACKSTACK_RESULT.previewApp.columns } }));

    expect(patch.livePreview?.sampleRows).toBeUndefined();
    const next = mergeAgentPatch(FALLBACK_HACKSTACK_RESULT, patch);
    expect(next.previewApp.sampleRows).toEqual(FALLBACK_HACKSTACK_RESULT.previewApp.sampleRows);
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
