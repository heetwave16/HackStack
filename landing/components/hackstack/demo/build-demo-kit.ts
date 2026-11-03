import type { DemoSample } from './demo-data';

function buildKitMarkdown(sample: DemoSample) {
  const deck = sample.slides.flatMap((slide, index) => [
    `### Slide ${index + 1}: ${slide.title}`,
    ...slide.points.map((point) => `- ${point}`),
    '',
  ]);
  const script = sample.script.map((item) => `- **${item.time}** ${item.line}`);
  const checklist = sample.checklist.map(
    (entry, index) => `${index + 1}. **${entry.criterion}:** ${entry.item}`,
  );

  return [
    `# HackStack demo kit: ${sample.label}`,
    '',
    `> ${sample.statement}`,
    '',
    '## Pitch deck',
    '',
    ...deck,
    '## 60-second teleprompter script',
    '',
    ...script,
    '',
    '## Build Next checklist',
    '',
    ...checklist,
    '',
    `## Generated slot: \`${sample.slotFile}\``,
    '',
    '```ts',
    ...sample.slotLines,
    '```',
    '',
  ].join('\n');
}

export function downloadDemoKit(sample: DemoSample) {
  const blob = new Blob([buildKitMarkdown(sample)], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hackstack-${sample.id}-demo-kit.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
