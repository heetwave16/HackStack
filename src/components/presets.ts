import { HackStackOutput, FALLBACK_HACKSTACK_RESULT } from '@/types/hackstack';
import type { EntityOverride } from '@/lib/studio-result';
import { synthesizeCustomHackStack } from '@/components/offline-synth';

export interface HackStackPreset {
  id: string;
  name: string;
  badge: string;
  ideaText: string;
  stack: string;
  features: string;
  output: HackStackOutput;
  /** Optional rendering hints (labels, types, status tones). Data only. */
  entity?: EntityOverride;
}

export const TEXTSWAP_PRESET_OUTPUT: HackStackOutput = {
  projectName: 'TextSwap NST',
  tagline: 'Peer-to-peer engineering textbook escrow with UPI hold and syllabus-matched ISBN scanner.',
  validation: {
    schemaValid: true,
    compileCheckPassed: true,
    usedFallback: false,
    modelUsed: 'gemini-3.5-flash (golden-preset)'
  },
  previewApp: {
    primaryEntityName: 'Active Textbook Listings',
    metrics: [
      { label: 'Verified Listings', value: '87', trend: '+12 today' },
      { label: 'Avg Student Savings', value: '₹1,450', trend: 'Under retail price' },
      { label: 'Escrow Dispute Rate', value: 'Target: under 1%', trend: 'NST Pune B-Tech' }
    ],
    columns: ['bookTitle', 'courseCode', 'sellerHostel', 'escrowPrice', 'condition'],
    sampleRows: [
      {
        bookTitle: 'Higher Engineering Mathematics (Grewal 44th Ed)',
        courseCode: 'EN-101',
        sellerHostel: 'Block A - Room 204',
        escrowPrice: '₹350',
        condition: 'Like New (Annotated)'
      },
      {
        bookTitle: 'Operating System Concepts (Silberschatz)',
        courseCode: 'CS-302',
        sellerHostel: 'Block D - Room 112',
        escrowPrice: '₹420',
        condition: 'Good (Clean Margin)'
      },
      {
        bookTitle: 'Design Patterns: Elements of Reusable Object-Oriented Software',
        courseCode: 'CS-401',
        sellerHostel: 'Block B - Room 309',
        escrowPrice: '₹480',
        condition: 'Mint / Unread'
      }
    ],
    quickActionLabel: '+ List Textbook for Sale'
  },
  codebase: {
    prismaSchema: `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model BookListing {
  id           String      @id @default(cuid())
  title        String
  isbn         String
  courseCode   String
  price        Int
  sellerUpi    String
  condition    String
  status       String      @default("AVAILABLE")
  createdAt    DateTime    @default(now())
  transactions Transaction[]
}

model Transaction {
  id           String      @id @default(cuid())
  listingId    String
  listing      BookListing @relation(fields: [listingId], references: [id])
  buyerUpi     String
  escrowStatus String      @default("HELD")
  handoverCode String
  releasedAt   DateTime?
}`,
    apiRouteCode: `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    listings: [
      { id: 'book_1', title: 'Higher Engineering Mathematics', courseCode: 'EN-101', price: 350, status: 'AVAILABLE' }
    ]
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.title || !body.price || !body.isbn) {
    return NextResponse.json({ error: 'Title, price, and ISBN are required' }, { status: 400 });
  }
  return NextResponse.json({ status: 'created', listing: { id: 'book_new', ...body } }, { status: 201 });
}`,
    starterTestCode: `import { describe, it, expect } from 'vitest';

export function calculateEscrowReleaseFee(amount: number): number {
  if (amount <= 0) throw new Error('Listing price must be positive');
  // 2% campus platform maintenance fee capped at ₹25
  return Math.min(25, Math.ceil(amount * 0.02));
}

describe('TextSwap Escrow Settlement Engine', () => {
  it('correctly calculates 2% escrow platform fee for student exchanges', () => {
    expect(calculateEscrowReleaseFee(350)).toBe(7);
    expect(calculateEscrowReleaseFee(2000)).toBe(25);
  });

  it.todo('verifies 4-digit handover OTP before releasing UPI escrow hold');
});`,
    readmeMarkdown: `# TextSwap NST
Scaffolded with **HackStack** (Team Blue10.1 — NST-ADYPU).

## Quickstart
1. \`npm install\`
2. Copy \`.env.example\` to \`.env\` and set \`DATABASE_URL\`
3. \`npx prisma db push\`
4. \`npm run test\` (runs Vitest unit suite)
5. \`npm run dev\``
  },
  pitchDeck: [
    {
      slideNumber: 1,
      title: 'Title & Hook',
      headline: 'TextSwap NST: Zero-Scam Campus Textbook Escrow',
      bullets: ['Saves engineering students ₹1,400+ per semester', 'Eliminates WhatsApp marketplace ghosting and non-delivery'],
      speakerNote: 'Open with the pile of ₹1,000 reference books every semester that sit unused in dorm rooms.'
    },
    {
      slideNumber: 2,
      title: 'The Problem',
      headline: 'Juniors pay full price for books seniors throw away',
      bullets: ['College bookstores keep large margins on buybacks', 'Hostel WhatsApp groups are chaotic, unindexed, and plagued by UPI scams'],
      speakerNote: 'Highlight that many syllabus books are used for one semester and then sit unused.'
    },
    {
      slideNumber: 3,
      title: 'Target Persona',
      headline: '1st & 2nd Year Engineering Students',
      bullets: ['Need mandatory reference texts for calculus, basic EE, and mechanics', 'Sticking to strict semester textbook budgets under ₹2,000'],
      speakerNote: 'Establish our beachhead: first-year students at NST Pune.'
    },
    {
      slideNumber: 4,
      title: 'The Solution',
      headline: 'Scan ISBN → Auto-Match Syllabus → UPI Escrow Hold',
      bullets: ['Buyer reserves book with instant UPI escrow deposit', 'Funds release to seller only after physical OTP handshake'],
      speakerNote: 'Explain the 3-step guarantee: scan, meet at cafeteria, enter OTP, money transfers.'
    },
    {
      slideNumber: 5,
      title: 'Why AI?',
      headline: 'Computer Vision Edition & Syllabus Alignment',
      bullets: ['Scans cover damage & highlighted margins to rate condition objectively', 'Maps book edition against latest 2026 university curriculum differences'],
      speakerNote: 'Show how AI flags edition differences so juniors do not buy outdated chapter editions.'
    },
    {
      slideNumber: 6,
      title: 'System Architecture',
      headline: 'Next.js App Router + PostgreSQL + Prisma + Vitest',
      bullets: ['Strict transactional integrity for book listing and escrow release', 'Vitest-tested fee calculator ensuring transparent 2% platform cap'],
      speakerNote: 'Direct judges to Tab 2 to inspect our relational escrow schema and unit test.'
    },
    {
      slideNumber: 7,
      title: 'Live Demo Flow',
      headline: 'Live Listing to Escrow Reservation in 15 Seconds',
      bullets: ['1. Browse live listings in Tab 1', '2. Use "+ List Textbook" modal to insert a live textbook item'],
      speakerNote: 'Click "+ List Textbook for Sale" in Tab 1 to prove live reactive state updates.'
    },
    {
      slideNumber: 8,
      title: 'Campus GTM',
      headline: 'Department Orientation Partnerships',
      bullets: ['Embed directly in freshers welcome kit WhatsApp channels', 'End-of-semester "Pass-it-Down" hostel collection drives'],
      speakerNote: 'Demonstrate how organic batch handovers create a self-sustaining supply flywheel.'
    },
    {
      slideNumber: 9,
      title: 'Validation & Trust',
      headline: 'Zod-Validated Safe Architecture',
      bullets: ['Zero runtime schema errors on listings and transactions', '1-click repo download empowers any college committee to self-host'],
      speakerNote: 'Reiterate that HackStack builds production code, not disposable hackathon prototypes.'
    },
    {
      slideNumber: 10,
      title: 'Roadmap & Ask',
      headline: 'Piloting Across NST Pune Campus Starting Monday',
      bullets: ['Goal: 200 textbook handovers during semester 2 exam week', 'Next: Calculator and engineering graphics tool rentals'],
      speakerNote: 'Conclude with our ask for student body endorsement and campus ambassador leads.'
    }
  ],
  demoKit: {
    scriptSegments: [
      {
        timeRange: '0:00 - 0:15',
        visualAction: 'Show TextSwap intake form with NST campus idea and click Generate Launch Kit.',
        voiceover: 'Engineering students waste thousands on textbooks every semester while seniors have copies collecting dust. With HackStack, we generated TextSwap in seconds.'
      },
      {
        timeRange: '0:15 - 0:30',
        visualAction: 'Navigate to Tab 1 (Live App Preview), search "CS-302", and use "+ List Textbook" to add a record.',
        voiceover: 'In Tab 1, judges can test the interactive marketplace—searching courses or adding a real book listing that immediately updates the live inventory.'
      },
      {
        timeRange: '0:30 - 0:45',
        visualAction: 'Switch to Tab 2 (Code & Tests), show passing Vitest fee suite, and demonstrate 1-Click ZIP eject.',
        voiceover: 'Behind this UI is an auto-generated Next.js and Prisma escrow architecture with passing unit tests that can be downloaded as a full repo in one click.'
      },
      {
        timeRange: '0:45 - 1:00',
        visualAction: 'Review Tab 3 pitch carousel and Tab 4 ranked CoNSTruct checklist.',
        voiceover: 'Finally, Tabs 3 and 4 provide our complete 10-slide CoNSTruct pitch deck and a ranked judge checklist to guide our next technical milestones.'
      }
    ],
    buildNextChecklist: [
      {
        priority: 1,
        task: 'Implement physical OTP handshake verification in Vitest starter test suite',
        judgingCriteria: 'Feasibility',
        impactScore: 'High (trust proof)'
      },
      {
        priority: 2,
        task: 'Connect Gemini Vision API to auto-extract ISBN barcode and syllabus match',
        judgingCriteria: 'Use of AI',
        impactScore: 'High (AI automation)'
      },
      {
        priority: 3,
        task: 'Add hostel block pickup location filters in marketplace search table',
        judgingCriteria: 'Product Thinking',
        impactScore: 'Medium (UX flow)'
      },
      {
        priority: 4,
        task: 'Record 60-second backup demo video using Tab 4 screen recorder',
        judgingCriteria: 'Innovation',
        impactScore: 'High (Stage-safe demo)'
      }
    ]
  }
};

export const MEDDRONE_PRESET_OUTPUT: HackStackOutput = {
  projectName: 'MedDrone Dispatch',
  tagline: 'Autonomous urban medical drone dispatch coordinating antivenom and rare blood units over traffic gridlocks.',
  validation: {
    schemaValid: true,
    compileCheckPassed: true,
    usedFallback: false,
    modelUsed: 'gemini-3.5-flash (golden-preset)'
  },
  previewApp: {
    primaryEntityName: 'Active Emergency Flight Corridors',
    metrics: [
      { label: 'Active Corridors', value: '8', trend: '3 in-flight' },
      { label: 'Avg Dispatch Time', value: '6.2 min', trend: 'Target: under 10 min' },
      { label: 'Payload Temp Range', value: '3.8°C', trend: 'Optimal Cold-Chain' }
    ],
    columns: ['missionId', 'hospitalTarget', 'payloadType', 'flightAltitude', 'etaMinutes', 'status'],
    sampleRows: [
      {
        missionId: 'MD-804',
        hospitalTarget: 'Ruby Hall Clinic - Pune',
        payloadType: 'O-Negative Packed RBC (2 units)',
        flightAltitude: '120m AGL',
        etaMinutes: '4 mins',
        status: 'In Flight (GPS Locked)'
      },
      {
        missionId: 'MD-805',
        hospitalTarget: 'Sassoon General Hospital',
        payloadType: 'Polyvalent Snake Antivenom',
        flightAltitude: '95m AGL',
        etaMinutes: '8 mins',
        status: 'Corridor Clear'
      },
      {
        missionId: 'MD-806',
        hospitalTarget: 'Jehangir Hospital Trauma Bay',
        payloadType: 'Pediatric Cardiac Defibrillator',
        flightAltitude: '110m AGL',
        etaMinutes: '11 mins',
        status: 'Preparing Launch'
      }
    ],
    quickActionLabel: '+ Authorize Emergency Dispatch'
  },
  codebase: {
    prismaSchema: `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model DroneMission {
  id              String       @id @default(cuid())
  missionCode     String       @unique
  originPad       String
  hospitalTarget  String
  payloadType     String
  requiredTempMax Float
  status          String       @default("STAGED")
  createdAt       DateTime     @default(now())
  telemetryPoints Telemetry[]
}

model Telemetry {
  id              String       @id @default(cuid())
  missionId       String
  mission         DroneMission @relation(fields: [missionId], references: [id])
  lat             Float
  lng             Float
  altitudeMeters  Float
  payloadTemp     Float
  batteryPercent  Int
  timestamp       DateTime     @default(now())
}`,
    apiRouteCode: `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    activeMissions: [
      { id: 'mission_1', missionCode: 'MD-804', hospitalTarget: 'Ruby Hall Clinic', status: 'IN_FLIGHT' }
    ]
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.hospitalTarget || !body.payloadType) {
    return NextResponse.json({ error: 'Hospital target and payload type required' }, { status: 400 });
  }
  return NextResponse.json({ status: 'authorized', mission: { id: 'mission_new', ...body } }, { status: 201 });
}`,
    starterTestCode: `import { describe, it, expect } from 'vitest';

export function calculateCorridorETA(distanceKm: number, droneSpeedKmh: number = 75): number {
  if (distanceKm <= 0) throw new Error('Distance must be greater than zero');
  const travelHours = distanceKm / droneSpeedKmh;
  return Math.ceil(travelHours * 60) + 2; // +2 mins for landing descent clearance
}

describe('MedDrone Flight Clearance Telemetry', () => {
  it('accurately calculates flight time with terminal landing buffer', () => {
    expect(calculateCorridorETA(5, 75)).toBe(6);
  });

  it.todo('aborts dispatch if cold-chain temperature exceeds 6.0C during flight corridor');
});`,
    readmeMarkdown: `# MedDrone Dispatch
Scaffolded with **HackStack** (Team Blue10.1 — NST-ADYPU).

## Quickstart
1. \`npm install\`
2. Copy \`.env.example\` to \`.env\` and set \`DATABASE_URL\`
3. \`npx prisma db push\`
4. \`npm run test\` (runs Vitest telemetry suite)
5. \`npm run dev\``
  },
  pitchDeck: [
    {
      slideNumber: 1,
      title: 'Title & Hook',
      headline: 'MedDrone Dispatch: Bypassing Traffic to Save Lives',
      bullets: ['Cuts critical blood and antivenom transit time from 45 mins to 6 mins', 'Zero emissions, autonomous point-to-point hospital drone corridors'],
      speakerNote: 'Open with Pune rush-hour gridlock: an ambulance stuck 1.2 km away from the trauma center.'
    },
    {
      slideNumber: 2,
      title: 'The Problem',
      headline: 'Traffic congestion delays golden-hour trauma supplies',
      bullets: ['Rare blood group matches often sit in peripheral storage', 'Road ambulances lose up to 40 minutes in urban bottlenecks'],
      speakerNote: 'Frame the stakes: during severe hemorrhages, every minute of delay during a severe hemorrhage matters.'
    },
    {
      slideNumber: 3,
      title: 'Target Persona',
      headline: 'Hospital Trauma Chiefs & Blood Bank Directors',
      bullets: ['Require guaranteed cold-chain integrity (2-6°C) during transport', 'Need instant regulatory clearance through pre-mapped aerial corridors'],
      speakerNote: 'Focus on emergency medical personnel who need immediate airborne logistics.'
    },
    {
      slideNumber: 4,
      title: 'The Solution',
      headline: 'Autonomous 120m Air Corridors + IoT Cold-Chain Lock',
      bullets: ['1-click dispatch sends GPS-guided drone via pre-cleared air lanes', 'Smart IoT payload box maintains live temp and pressure telemetry'],
      speakerNote: 'Walk judges through the 30-second authorization to takeoff sequence.'
    },
    {
      slideNumber: 5,
      title: 'Why AI?',
      headline: 'Dynamic Wind & Rooftop Thermal Avoidance Routing',
      bullets: ['Real-time micro-weather inference recalculates flight altitude', 'Predicts hospital rooftop landing wind-shear risks'],
      speakerNote: 'Explain how AI prevents turbulence from destabilizing sensitive blood plasma payloads.'
    },
    {
      slideNumber: 6,
      title: 'System Architecture',
      headline: 'Next.js App Router + PostgreSQL + Prisma + Vitest',
      bullets: ['Telemetry logging points captured in relational PostgreSQL tables', 'Vitest-tested ETA calculators with landing safety buffer'],
      speakerNote: 'Show Tab 2 with validated schema models for DroneMission and Telemetry.'
    },
    {
      slideNumber: 7,
      title: 'Live Demo Flow',
      headline: 'Live Flight Corridor Authorization in 10 Seconds',
      bullets: ['1. View active urban drone corridors in Tab 1', '2. Authorize an emergency flight to insert a live mission into state'],
      speakerNote: 'Click "+ Authorize Emergency Dispatch" in Tab 1 to demonstrate instant state reactivity.'
    },
    {
      slideNumber: 8,
      title: 'Regulatory & GTM',
      headline: 'DGCA Green Zone Hospital Air Corridors',
      bullets: ['Pre-cleared point-to-point routes between 6 major Pune hospital helipads', 'Partnership with municipal disaster response authorities'],
      speakerNote: 'Address regulatory compliance: flying in designated green sub-120m corridors.'
    },
    {
      slideNumber: 9,
      title: 'Safety Guardrails',
      headline: 'Zod-Enforced Mission Contracts & Vitest Rigor',
      bullets: ['Fail-safe schema prevents launching with unvalidated battery or temp', '1-click repository eject for hospital IT integration'],
      speakerNote: 'Reiterate that medical systems demand strict type-safety and contract validation.'
    },
    {
      slideNumber: 10,
      title: 'Roadmap & Ask',
      headline: 'Executing First Test Corridor Flight in Q1',
      bullets: ['Target: 50 scheduled dummy-payload test runs between clinics', 'Seeking mentor support for DGCA Beyond Visual Line of Sight (BVLOS) approvals'],
      speakerNote: 'Close with our vision: saving lives by eliminating the traffic penalty for critical medicine.'
    }
  ],
  demoKit: {
    scriptSegments: [
      {
        timeRange: '0:00 - 0:15',
        visualAction: 'Select MedDrone preset in HackStack Studio and click Generate Launch Kit.',
        voiceover: 'Urban traffic delays critical blood deliveries by 45 minutes during the golden hour. With HackStack, we generated MedDrone Dispatch to solve this crisis.'
      },
      {
        timeRange: '0:15 - 0:30',
        visualAction: 'Navigate to Tab 1 (Live App Preview) and authorize an emergency flight corridor.',
        voiceover: 'Tab 1 demonstrates our flight coordinator dashboard with real-time altitude, ETA, and live mission insertion into schema-validated state.'
      },
      {
        timeRange: '0:30 - 0:45',
        visualAction: 'Switch to Tab 2 (Code & Tests), show Prisma telemetry models, and click Download Repo.',
        voiceover: 'Under Tab 2, teams get a complete Next.js and Prisma architecture with unit tests ready to eject as a production-grade ZIP archive in one click.'
      },
      {
        timeRange: '0:45 - 1:00',
        visualAction: 'Inspect Tab 3 pitch deck and Tab 4 ranked CoNSTruct rubric tasks.',
        voiceover: 'Finally, Tabs 3 and 4 deliver a 10-slide CoNSTruct pitch deck, 60s teleprompter, and a ranked judge checklist to guide next milestones.'
      }
    ],
    buildNextChecklist: [
      {
        priority: 1,
        task: 'Implement cold-chain temperature threshold test in Vitest starter suite',
        judgingCriteria: 'Feasibility',
        impactScore: 'High (safety validation)'
      },
      {
        priority: 2,
        task: 'Wire Gemini AI to process real-time micro-weather wind telemetry',
        judgingCriteria: 'Use of AI',
        impactScore: 'High (AI intelligence)'
      },
      {
        priority: 3,
        task: 'Design rooftop helipad QR-code landing verification interface',
        judgingCriteria: 'Product Thinking',
        impactScore: 'Medium (operations)'
      },
      {
        priority: 4,
        task: 'Capture 60-second stage demo walkthrough using Tab 4 screen recorder',
        judgingCriteria: 'Innovation',
        impactScore: 'High (Backup stage proof)'
      }
    ]
  }
};


const LABSLOT_IDEA = 'Lab equipment booking for engineering colleges so students reserve oscilloscopes and 3D printers by the hour.';

export const LABSLOT_PRESET_OUTPUT: HackStackOutput = {
  ...synthesizeCustomHackStack({
    idea: LABSLOT_IDEA,
    stack: 'Next.js + Node + Postgres',
    features: ['Hourly slots', 'Lab assistant approval', 'No-show tracking']
  }),
  projectName: 'LabSlot',
  tagline: LABSLOT_IDEA,
  previewApp: {
    primaryEntityName: 'Equipment bookings',
    metrics: [
      { label: 'Bookings today', value: '23', trend: 'Sample value' },
      { label: 'Machines listed', value: '41', trend: 'Sample value' },
      { label: 'Awaiting approval', value: '5', trend: 'Sample value' }
    ],
    columns: ['bookingId', 'equipment', 'labRoom', 'slotHours', 'deposit', 'status'],
    sampleRows: [
      { bookingId: 'LS-112', equipment: 'Rigol DS1054Z oscilloscope', labRoom: 'ECE Lab 2', slotHours: '2', deposit: '₹100', status: 'Approved' },
      { bookingId: 'LS-113', equipment: 'Prusa MK4 3D printer', labRoom: 'Maker Space', slotHours: '4', deposit: '₹250', status: 'Pending review' },
      { bookingId: 'LS-114', equipment: 'Soldering station', labRoom: 'ECE Lab 1', slotHours: '1', deposit: '₹50', status: 'No-show' }
    ],
    quickActionLabel: 'Book equipment'
  }
};

export const BUILT_IN_PRESETS: HackStackPreset[] = [
  {
    id: 'campussplit',
    name: 'CampusSplit AI',
    badge: 'Hostel Bill Pooling',
    ideaText: 'Instant UPI bill-splitting and late-night hostel order pooling for college campuses.',
    stack: 'Next.js + Node + Postgres',
    features: 'UPI Micro-Splits, Live 10m Lobby, Receipt OCR',
    output: FALLBACK_HACKSTACK_RESULT
  },
  {
    id: 'textswap',
    name: 'TextSwap NST',
    badge: 'Textbook Escrow',
    ideaText: 'Peer-to-peer engineering textbook escrow with UPI hold and syllabus-matched ISBN scanner.',
    stack: 'Next.js + Node + Postgres',
    features: 'UPI Escrow Hold, Barcode Scanner, Hostel Delivery',
    output: TEXTSWAP_PRESET_OUTPUT
  },
  {
    id: 'meddrone',
    name: 'MedDrone Dispatch',
    badge: 'Medical Drones',
    ideaText: 'Autonomous urban medical drone dispatch coordinating antivenom and rare blood units over traffic gridlocks.',
    stack: 'Next.js + Node + Postgres',
    features: 'Corridor Routing, Cold-Chain Telemetry, Emergency Dispatch',
    output: MEDDRONE_PRESET_OUTPUT
  }
,
  {
    id: 'labslot',
    name: 'LabSlot',
    badge: 'Lab Equipment Booking',
    ideaText: LABSLOT_IDEA,
    stack: 'Next.js + Node + Postgres',
    features: 'Hourly slots, Lab assistant approval, No-show tracking',
    output: LABSLOT_PRESET_OUTPUT,
    entity: {
      fields: {
        slotHours: { label: 'Hours', type: 'number' },
        status: { toneMap: { approved: 'success', 'no-show': 'danger', pending: 'warning' } }
      }
    }
  }
];
