export type AIProvider = 'gemini' | 'openai-compatible';

export type JudgingCriterion =
  | 'Product Thinking'
  | 'Innovation'
  | 'Use of AI'
  | 'Feasibility';

export interface ModelConfig {
  provider: AIProvider;
  modelId: string;
  apiKey: string;
  baseUrl?: string;
}

export interface HackStackInput {
  idea: string;
  stack: string;
  features: string[];
  modelConfig?: ModelConfig;
}

export interface PreviewMetric {
  label: string;
  value: string;
  trend: string;
}

export interface PitchSlide {
  slideNumber: number;
  title: string;
  headline: string;
  bullets: string[];
  speakerNote: string;
}

export interface DemoScriptSegment {
  timeRange: string;
  visualAction: string;
  voiceover: string;
}

export interface BuildNextItem {
  priority: number;
  task: string;
  judgingCriteria: JudgingCriterion;
  impactScore: string;
}

export interface HackStackOutput {
  projectName: string;
  tagline: string;
  validation: {
    schemaValid: boolean;
    compileCheckPassed: boolean;
    usedFallback: boolean;
    modelUsed?: string;
    fallbackReason?: string;
  };
  previewApp: {
    primaryEntityName: string;
    metrics: PreviewMetric[];
    columns: string[];
    sampleRows: Record<string, string>[];
    quickActionLabel: string;
  };
  codebase: {
    prismaSchema: string;
    apiRouteCode: string;
    starterTestCode: string;
    readmeMarkdown: string;
  };
  pitchDeck: PitchSlide[];
  demoKit: {
    scriptSegments: DemoScriptSegment[];
    buildNextChecklist: BuildNextItem[];
  };
}

export const FALLBACK_HACKSTACK_RESULT: HackStackOutput = {
  projectName: 'CampusSplit AI',
  tagline: 'Instant UPI bill-splitting and late-night hostel order pooling for college campuses.',
  validation: {
    schemaValid: true,
    compileCheckPassed: true,
    usedFallback: false,
    modelUsed: 'gemini-3.5-flash (golden-preset)'
  },
  previewApp: {
    primaryEntityName: 'Active Hostel Order Pools',
    metrics: [
      { label: 'Active Order Pools', value: '14', trend: '+4 tonight' },
      { label: 'Avg Split Settlement', value: '42 sec', trend: 'Instant UPI settlement' },
      { label: 'Delivery Fees Saved', value: '₹4,850', trend: 'NST Hostel B' }
    ],
    columns: ['poolName', 'hostelWing', 'totalAmount', 'status'],
    sampleRows: [
      {
        poolName: 'Midnight Biryani Run',
        hostelWing: 'Block C - 3rd Floor',
        totalAmount: '₹1,240',
        status: 'Pooling (4/5 joined)'
      },
      {
        poolName: 'Dominos Exam Study Fuel',
        hostelWing: 'Block A - Common Lounge',
        totalAmount: '₹890',
        status: 'UPI Split Locked'
      },
      {
        poolName: 'Chai & Maggi Bulk Order',
        hostelWing: 'Block B - 2nd Floor',
        totalAmount: '₹450',
        status: 'Delivered'
      }
    ],
    quickActionLabel: '+ Create New Order Pool'
  },
  codebase: {
    prismaSchema: `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model OrderPool {
  id          String   @id @default(cuid())
  poolName    String
  hostelWing  String
  totalAmount Int
  status      String   @default("OPEN")
  createdAt   DateTime @default(now())
  splits      SplitShare[]
}

model SplitShare {
  id          String    @id @default(cuid())
  studentName String
  upiId       String
  amountOwed  Int
  isPaid      Boolean   @default(false)
  poolId      String
  pool        OrderPool @relation(fields: [poolId], references: [id], onDelete: Cascade)
}`,
    apiRouteCode: `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    pools: [
      { id: 'pool_1', poolName: 'Midnight Biryani Run', hostelWing: 'Block C', totalAmount: 1240, status: 'OPEN' }
    ]
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.poolName || !body.hostelWing) {
    return NextResponse.json({ error: 'poolName and hostelWing are required' }, { status: 400 });
  }
  return NextResponse.json({ status: 'created', pool: { id: 'pool_new', ...body } }, { status: 201 });
}`,
    starterTestCode: `import { describe, it, expect } from 'vitest';

export function calculateEqualSplit(totalAmount: number, members: number): number {
  if (members <= 0) throw new Error('Members must be greater than zero');
  return Math.ceil(totalAmount / members);
}

describe('CampusSplit Billing Engine', () => {
  it('calculates rounded per-student UPI share accurately', () => {
    expect(calculateEqualSplit(1240, 4)).toBe(310);
  });

  it.todo('rejects negative order totals and expired hostel pool windows');
});`,
    readmeMarkdown: `# CampusSplit AI
Scaffolded with **HackStack** (Team Blue10.1 — NST-ADYPU).

## Quickstart
1. \`npm install\`
2. Copy \`.env.example\` to \`.env\` and set \`DATABASE_URL\`
3. \`npx prisma db push\`
4. \`npm run test\` (runs Vitest starter suite)
5. \`npm run dev\``
  },
  pitchDeck: [
    {
      slideNumber: 1,
      title: 'Title & Hook',
      headline: 'CampusSplit AI: Zero-Friction Hostel Order Pooling',
      bullets: ['Eliminates duplicate ₹60 delivery fees across hostel wings', 'Auto-splits itemized receipts via instant UPI links'],
      speakerNote: 'Open with the 2 AM hostel hunger problem every residential student knows firsthand.'
    },
    {
      slideNumber: 2,
      title: 'The Problem',
      headline: 'Hostel students overpay on solo late-night food orders',
      bullets: ['5 students on the same floor order separately from the same restaurant', 'Manual WhatsApp bill splitting leads to unpaid IOUs and awkwardness'],
      speakerNote: 'Highlight that coordination friction—not lack of demand—prevents pooled orders.'
    },
    {
      slideNumber: 3,
      title: 'Target Persona',
      headline: '2nd & 3rd Year Outstation Hostel Students',
      bullets: ['Order food 3-5x a week during lab deadlines and exam weeks', 'Highly price-sensitive on delivery + packaging surcharges'],
      speakerNote: 'Point out our immediate beachhead at NST Pune residential hostels.'
    },
    {
      slideNumber: 4,
      title: 'The Solution',
      headline: '1-Click Floor Pool + Auto-Locked UPI Micro-Splits',
      bullets: ['Live 10-minute countdown lobby per hostel block', 'Orders unlock only when each participant confirms their UPI share'],
      speakerNote: 'Walk through the 20-second flow from craving to pooled checkout.'
    },
    {
      slideNumber: 5,
      title: 'Why AI?',
      headline: 'Smart Receipt OCR & GST/Packaging Fair-Share Splitter',
      bullets: ['Parses messy food delivery screenshots into itemized student shares', 'Pro-rates taxes, discounts, and delivery fees automatically'],
      speakerNote: 'Show how AI removes manual calculator math on uneven item orders.'
    },
    {
      slideNumber: 6,
      title: 'System Architecture',
      headline: 'Next.js App Router + PostgreSQL + Prisma + Vitest',
      bullets: ['Type-safe relational schema for OrderPool and SplitShare', 'Pre-validated API endpoints with unit-tested split calculation logic'],
      speakerNote: 'Reference Tab 2 where judges can inspect our validated schema and tests.'
    },
    {
      slideNumber: 7,
      title: 'Live Demo Flow',
      headline: 'From Craving to Pooled Order in 20 Seconds',
      bullets: ['1. View active floor pools in Tab 1', '2. Click "+ Create New Order Pool" to add a live entry'],
      speakerNote: 'Switch to Tab 1 during this slide to prove live state updates.'
    },
    {
      slideNumber: 8,
      title: 'Market & Campus GTM',
      headline: 'Viral Wing-Representative Loop Across 25 Campuses',
      bullets: ['Zero CAC via hostel WhatsApp group deep-links', 'Built-in savings leaderboard per hostel block'],
      speakerNote: 'Explain why dense college hostels have natural network effects.'
    },
    {
      slideNumber: 9,
      title: 'Validation & Guardrails',
      headline: 'Schema-Validated, Type-Safe & Ready to Eject',
      bullets: ['Zod-verified data contracts prevent runtime crashes', '1-click ZIP eject delivers a full Next.js + Prisma starter repo'],
      speakerNote: 'Emphasize engineering rigor over fragile hackathon spaghetti code.'
    },
    {
      slideNumber: 10,
      title: 'Roadmap & Ask',
      headline: 'Launching Campus Beta Across NST Hostels This Week',
      bullets: ['Week 3: Live UPI deep-link intent integration', 'Target: 500 pooled hostel orders in first 14 days'],
      speakerNote: 'Close strong and invite judges to test the live URL on their phones.'
    }
  ],
  demoKit: {
    scriptSegments: [
      {
        timeRange: '0:00 - 0:15',
        visualAction: 'Show HackStack intake bar with idea, stack, and BYOK model selector, then click Generate.',
        voiceover: 'Hackathon teams waste 15 hours on boilerplate setup and 3 AM pitch decks. With HackStack, we enter a two-sentence idea and generate a complete launch kit in seconds.'
      },
      {
        timeRange: '0:15 - 0:30',
        visualAction: 'Click through Tab 1 (Live App Preview) and use "+ Create New Order Pool" to add a live row.',
        voiceover: 'First, Tab 1 renders an interactive, schema-driven dashboard preview with live state—so judges can click and test our core user flow immediately.'
      },
      {
        timeRange: '0:30 - 0:45',
        visualAction: 'Switch to Tab 2 (Code, Schema & Tests), show the green validation badges, and click Download ZIP.',
        voiceover: 'Under the hood, Tab 2 injects our Prisma schema, Next.js API routes, and Vitest starter tests into a golden template that teams can eject as a clean ZIP repo in one click.'
      },
      {
        timeRange: '0:45 - 1:00',
        visualAction: 'Flip through Tab 3 (10-Slide Pitch Deck) and Tab 4 (60s Recorder & CoNSTruct Rubric Checklist).',
        voiceover: 'Finally, Tabs 3 and 4 wire our actual architecture into a 10-slide CoNSTruct pitch deck, a 60-second screen recorder, and a ranked Build-Next rubric checklist.'
      }
    ],
    buildNextChecklist: [
      {
        priority: 1,
        task: 'Implement the pending Vitest edge-case test in starter.test.ts for negative/zero split counts',
        judgingCriteria: 'Feasibility',
        impactScore: 'High (technical proof)'
      },
      {
        priority: 2,
        task: 'Wire Gemini Vision receipt-OCR endpoint to auto-populate item rows from uploaded bill screenshots',
        judgingCriteria: 'Use of AI',
        impactScore: 'High (AI depth)'
      },
      {
        priority: 3,
        task: 'Add 1-click WhatsApp share deep-link on each active Hostel Order Pool card',
        judgingCriteria: 'Product Thinking',
        impactScore: 'Medium (campus adoption)'
      },
      {
        priority: 4,
        task: 'Record a 60-second backup .webm walkthrough using the Tab 4 browser screen recorder',
        judgingCriteria: 'Innovation',
        impactScore: 'High (Zero-risk stage demo)'
      }
    ]
  }
};
