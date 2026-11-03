import { describe, expect, it } from 'vitest';
import { BUILT_IN_PRESETS } from '@/components/presets';
import { humanizeKey, inferFieldType, toStudioResult, toneForValue } from '@/lib/studio-result';
import { synthesizeCustomHackStack } from '@/components/offline-synth';

describe('StudioResult contract', () => {
  it('every preset produces a valid StudioResult', () => {
    for (const p of BUILT_IN_PRESETS) {
      const r = toStudioResult(p.output, { id: p.id, source: 'cached', latencyMs: null, entity: p.entity });
      expect(r.entity.fields.length).toBeGreaterThan(0);
      expect(r.primaryAction.label.startsWith('+')).toBe(false);
    }
  });

  it('ships at least 4 presets', () => {
    expect(BUILT_IN_PRESETS.length).toBeGreaterThanOrEqual(4);
  });

  it('offline builder output passes the same schema', () => {
    const out = synthesizeCustomHackStack({ idea: 'Lost and found board for campus', stack: 'Next.js', features: ['Photo upload'] });
    expect(() => toStudioResult(out, { id: 'custom', source: 'offline', latencyMs: 10 })).not.toThrow();
  });

  it('humanizes camelCase keys', () => {
    expect(humanizeKey('etaMinutes')).toBe('ETA minutes');
    expect(humanizeKey('hostelWing')).toBe('Hostel wing');
    expect(humanizeKey('missionId')).toBe('Mission ID');
  });

  it('infers currency and status types', () => {
    expect(inferFieldType('totalAmount', ['₹1,240', '₹890'])).toBe('currency');
    expect(inferFieldType('status', ['Delivered'])).toBe('status');
  });

  it('status tones are not all the same', () => {
    expect(toneForValue('Delivered', {})).toBe('success');
    expect(toneForValue('Preparing Launch', {})).toBe('warning');
    expect(toneForValue('Something else', {})).toBe('neutral');
  });

  it('no preset makes invented comparative claims', () => {
    const text = JSON.stringify(BUILT_IN_PRESETS.map((p) => p.output.previewApp.metrics));
    expect(text).not.toMatch(/faster than|% off retail/i);
  });
});
