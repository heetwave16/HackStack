import JSZip from 'jszip';
import type { HackStackOutput } from '@/types/hackstack';
import { GOLDEN_TEMPLATE_FILES } from '@/templates/golden-template';

export function buildEnvExample(projectName: string): string {
  const dbName = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return `# HackStack Environment Config - ${projectName}
# Copy this file to .env.local and configure your local PostgreSQL credentials

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/${dbName}?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# BYOK server key (only if the app calls Gemini directly)
GEMINI_API_KEY=""
`;
}

export function buildPitchDeckMarkdown(data: HackStackOutput): string {
  const slides = data.pitchDeck
    .map(
      (slide) =>
        `## Slide ${slide.slideNumber}: ${slide.title}\n` +
        `### ${slide.headline}\n\n` +
        slide.bullets.map((bullet) => `- ${bullet}`).join('\n') +
        `\n\n> **Presenter note**: ${slide.speakerNote}\n`
    )
    .join('\n---\n\n');
  return `# ${data.projectName} - 10-Slide Pitch Deck\n${data.tagline}\n\n${slides}`;
}

export function buildProjectSlug(projectName: string): string {
  return projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'project';
}

export async function buildHackStackZip(data: HackStackOutput): Promise<Blob> {
  const zip = new JSZip();
  const files: Record<string, string> = {
    ...GOLDEN_TEMPLATE_FILES,
    'prisma/schema.prisma': data.codebase.prismaSchema,
    'src/app/api/main/route.ts': data.codebase.apiRouteCode,
    'tests/starter.test.ts': data.codebase.starterTestCode,
    'README.md': data.codebase.readmeMarkdown,
    '.env.example': buildEnvExample(data.projectName),
    'PITCH_DECK.md': buildPitchDeckMarkdown(data)
  };
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }
  return zip.generateAsync({ type: 'blob' });
}

export async function downloadHackStackZip(data: HackStackOutput): Promise<void> {
  const blob = await buildHackStackZip(data);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${buildProjectSlug(data.projectName)}-hackstack.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
