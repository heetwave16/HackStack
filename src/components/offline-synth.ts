import type {
  BuildNextItem,
  DemoScriptSegment,
  HackStackOutput,
  PitchSlide,
  PreviewMetric
} from '@/types/hackstack';

export interface SynthesisBrief {
  idea: string;
  stack: string;
  features: string[];
}

const STOP_WORDS = new Set(['a', 'an', 'and', 'for', 'in', 'of', 'on', 'the', 'to', 'with']);
const SAMPLE_STATUSES = ['Open', 'Active', 'Delivered'];

function words(text: string): string[] {
  return text.split(/[^A-Za-z0-9]+/).filter(Boolean);
}

function titleCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function toCamelCase(text: string): string {
  return words(text)
    .map((word, index) => (index === 0 ? word.toLowerCase() : titleCase(word)))
    .join('');
}

export function synthesizeCustomHackStack(brief: SynthesisBrief): HackStackOutput {
  const idea = brief.idea.trim();
  const stack = brief.stack;
  const features = brief.features.map((feature) => feature.trim()).filter(Boolean);
  const featureAt = (index: number) => features[index] ?? 'the core workflow';

  const nameWords = words(idea)
    .filter((word) => !STOP_WORDS.has(word.toLowerCase()))
    .slice(0, 3)
    .map(titleCase);
  const projectName = nameWords.length > 0 ? `${nameWords.join(' ')} App` : 'Untitled Hackathon App';

  const columns = Array.from(
    new Set(['name', ...features.slice(0, 4).map((feature) => toCamelCase(feature)), 'status'])
  ).filter((column) => column.length > 0);

  const sampleRows: Record<string, string>[] = [1, 2, 3].map((n) => {
    const row: Record<string, string> = {};
    columns.forEach((column, index) => {
      if (index === 0) row[column] = `${titleCase(column)} ${n}`;
      else if (column === 'status') row[column] = SAMPLE_STATUSES[n - 1];
      else row[column] = `Sample ${n}`;
    });
    return row;
  });

  const metrics: PreviewMetric[] = [
    { label: 'Records tracked', value: '3', trend: 'Sample data' },
    { label: 'Features wired', value: String(features.length), trend: 'From your brief' },
    { label: 'Stack', value: stack.split('+')[0]?.trim() || 'Next.js', trend: 'Starter template' }
  ];

  const fieldLines = columns.map((column) => `  ${column} String?`).join('\n');
  const prismaSchema = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Entry {
  id        String   @id @default(cuid())
${fieldLines}
  createdAt DateTime @default(now())
}`;

  const apiRouteCode = `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', entries: [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  return NextResponse.json({ status: 'created', entry: body }, { status: 201 });
}`;

  const starterTestCode = `import { describe, it, expect } from 'vitest';

export function isValidEntryName(name: string): boolean {
  return name.trim().length > 0;
}

describe('${projectName}', () => {
  it('rejects blank entry names', () => {
    expect(isValidEntryName('   ')).toBe(false);
    expect(isValidEntryName('Study group')).toBe(true);
  });

  it.todo('covers ${featureAt(0)}');
});`;

  const readmeMarkdown = `# ${projectName}

${idea}

Scaffolded with HackStack.

## Quickstart
1. npm install
2. Copy .env.example to .env and set DATABASE_URL
3. npx prisma db push
4. npm run test
5. npm run dev`;

  const pitchDeck: PitchSlide[] = [
    {
      slideNumber: 1,
      title: 'Title & Hook',
      headline: projectName,
      bullets: [idea, `Built around ${featureAt(0)}`],
      speakerNote: 'Open with the problem in one sentence, then name the person who has it.'
    },
    {
      slideNumber: 2,
      title: 'The Problem',
      headline: 'Teams lose the first hours of a hackathon to setup',
      bullets: ['Boilerplate, auth, and database wiring come before any product work', 'Demos break and decks get written at 3 AM'],
      speakerNote: 'Make the cost concrete: hours, not vague frustration.'
    },
    {
      slideNumber: 3,
      title: 'Target Persona',
      headline: 'Student hackathon teams of two or three',
      bullets: ['Need a working app in hours, not days', 'Want their time spent on the unique feature'],
      speakerNote: 'Name one real user you have talked to.'
    },
    {
      slideNumber: 4,
      title: 'The Solution',
      headline: `${projectName} wires the core flow`,
      bullets: [`Core feature: ${featureAt(0)}`, `Supporting feature: ${featureAt(1)}`],
      speakerNote: 'Walk the flow from input to working screen.'
    },
    {
      slideNumber: 5,
      title: 'Why AI?',
      headline: 'AI turns a two-sentence idea into a data model and tests',
      bullets: ['Structured output maps to schema, routes, and tests', 'Validation rejects output that does not match the contract'],
      speakerNote: 'Show the schema next to the original idea.'
    },
    {
      slideNumber: 6,
      title: 'System Architecture',
      headline: `${stack} with schema-first design`,
      bullets: ['Schema, API routes, and tests are generated together', 'Starter tests give the team a passing baseline'],
      speakerNote: 'Open the Code tab and point at the schema.'
    },
    {
      slideNumber: 7,
      title: 'Live Demo Flow',
      headline: 'From idea to working screen on stage',
      bullets: ['1. Show the live preview', '2. Add one record to prove state updates'],
      speakerNote: 'Click the add button during this slide.'
    },
    {
      slideNumber: 8,
      title: 'Go-to-Market',
      headline: 'Start with one campus and one workflow',
      bullets: ['Share the studio link with student clubs', 'Measure how many teams reach a working demo'],
      speakerNote: 'Tie the rollout to a single event your audience attends.'
    },
    {
      slideNumber: 9,
      title: 'Validation & Guardrails',
      headline: 'Output is checked before it reaches the screen',
      bullets: ['Zod-validated contract on every generation', 'One-click ZIP export of the starter repo'],
      speakerNote: 'Stress that the team gets a repo, not a throwaway prototype.'
    },
    {
      slideNumber: 10,
      title: 'Roadmap & Ask',
      headline: `Next: ${featureAt(2)}`,
      bullets: [`Build ${featureAt(2)} after the demo`, 'Ask judges to test the live link on their phones'],
      speakerNote: 'Close by inviting judges to try it themselves.'
    }
  ];

  const scriptSegments: DemoScriptSegment[] = [
    {
      timeRange: '0:00 - 0:15',
      visualAction: 'Show the intake with your idea and click Generate.',
      voiceover: `Teams lose hours to setup. ${projectName} starts from the idea itself.`
    },
    {
      timeRange: '0:15 - 0:30',
      visualAction: 'Click through the live preview and add one record.',
      voiceover: 'The preview runs on the same data model, so the screen reacts immediately.'
    },
    {
      timeRange: '0:30 - 0:45',
      visualAction: 'Open the code tab, show the schema and tests, then download the ZIP.',
      voiceover: 'Every file comes from one validated contract and is packaged as a repo.'
    },
    {
      timeRange: '0:45 - 1:00',
      visualAction: 'Flip through the pitch deck and the checklist.',
      voiceover: 'The story and the next steps come from the same build, ready for questions.'
    }
  ];

  const buildNextChecklist: BuildNextItem[] = [
    { priority: 1, task: `Implement ${featureAt(0)} end to end`, judgingCriteria: 'Feasibility', impactScore: 'High (core proof)' },
    { priority: 2, task: `Add a real data source for ${featureAt(1)}`, judgingCriteria: 'Use of AI', impactScore: 'High (AI depth)' },
    { priority: 3, task: 'Test the flow with three real users from the target group', judgingCriteria: 'Product Thinking', impactScore: 'Medium (user proof)' },
    { priority: 4, task: 'Record a 60-second backup walkthrough', judgingCriteria: 'Innovation', impactScore: 'High (stage safety)' }
  ];

  return {
    projectName,
    tagline: idea.length > 140 ? `${idea.slice(0, 137)}...` : idea,
    validation: {
      schemaValid: true,
      compileCheckPassed: false,
      usedFallback: true,
      modelUsed: 'Offline synthesizer'
    },
    previewApp: {
      primaryEntityName: `${projectName} entries`,
      metrics,
      columns,
      sampleRows,
      quickActionLabel: '+ Add Entry'
    },
    codebase: { prismaSchema, apiRouteCode, starterTestCode, readmeMarkdown },
    pitchDeck,
    demoKit: { scriptSegments, buildNextChecklist }
  };
}
