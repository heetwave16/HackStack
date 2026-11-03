export type DemoSlide = { kicker: string; title: string; points: string[] };
export type DemoScriptLine = { time: string; line: string };
export type DemoChecklistItem = { criterion: string; item: string };

export type DemoSample = {
  id: string;
  label: string;
  statement: string;
  intent: string;
  slotFile: string;
  slotLines: string[];
  slides: DemoSlide[];
  script: DemoScriptLine[];
  checklist: DemoChecklistItem[];
};

export const DEMO_SAMPLES: DemoSample[] = [
  {
    id: 'food-rescue',
    label: 'Campus food rescue',
    statement:
      'Dining halls throw away surplus meals each night while students nearby go hungry. Build a way to match them in real time.',
    intent: 'food_rescue · users: students, dining staff · judge: impact',
    slotFile: 'app/api/pickups/route.ts',
    slotLines: [
      "import { z } from 'zod';",
      '',
      '// slot: api.route  |  validated before injection',
      'const Pickup = z.object({',
      '  donorId: z.string().uuid(),',
      '  portions: z.number().int().min(1).max(200),',
      '  expiresAt: z.string().datetime(),',
      '});',
      '',
      'export async function POST(req: Request) {',
      '  const pickup = Pickup.parse(await req.json());',
      "  return Response.json({ status: 'listed', ...pickup });",
      '}',
    ],
    slides: [
      {
        kicker: 'Slide 01 · Problem',
        title: 'Good food leaves the dining hall in the trash every night',
        points: ['Surplus portions go in the trash every night', 'Students who need meals never hear about them'],
      },
      {
        kicker: 'Slide 04 · Solution',
        title: 'Pickups listed in real time, claimed in one tap',
        points: ['Dining staff post surplus in seconds', 'Students claim before the expiry window closes'],
      },
      {
        kicker: 'Slide 07 · Architecture',
        title: 'Next.js client, Node API, Postgres with atomic claims',
        points: ['Claims resolved in one transaction', 'Zod validates every donation payload'],
      },
      {
        kicker: 'Slide 09 · Impact',
        title: '[Add your pilot result here]',
        points: ['Name the pilot sites and the test window', 'Use one measured number from your own test'],
      },
    ],
    script: [
      { time: '00:00', line: 'Every night, good food leaves our dining halls in the trash.' },
      { time: '00:15', line: 'Dining staff post surplus here, and nearby students claim it in one tap.' },
      { time: '00:35', line: 'Watch this claim go through. Atomic, so two students never get the same meal.' },
      { time: '00:50', line: 'Pilot result: [add your measured number] across two halls.' },
    ],
    checklist: [
      { criterion: 'Product Thinking', item: 'Show the donor and recipient flow end to end' },
      { criterion: 'Feasibility', item: 'Demo the atomic claim with two browser tabs' },
      { criterion: 'Use of AI', item: 'Add a one-line AI summary for each listing' },
      { criterion: 'Innovation', item: 'Pitch the expiry-window ranking as the differentiator' },
    ],
  },
  {
    id: 'queuezero',
    label: 'Clinic queue anxiety',
    statement:
      'Patients often wait for hours without knowing when they will be seen, and staff juggle paper tickets. Give everyone a live position.',
    intent: 'queue_visibility · users: patients, front desk · judge: impact',
    slotFile: 'components/queue-board.tsx',
    slotLines: [
      "import { useQueue } from './use-queue';",
      '',
      '// slot: ui.component  |  props validated by Zod',
      'export function QueueBoard({ clinicId }: { clinicId: string }) {',
      '  const { tickets, position } = useQueue(clinicId);',
      '  return (',
      '    <section aria-label="Live queue">',
      '      <p>You are #{position} in line</p>',
      "      <ul>{tickets.map((t) => <li key={t.id}>{t.label}</li>)}</ul>",
      '    </section>',
      '  );',
      '}',
    ],
    slides: [
      {
        kicker: 'Slide 01 · Problem',
        title: 'Patients wait without knowing when they will be seen',
        points: ['No live wait visibility', 'Patients leave before being seen'],
      },
      {
        kicker: 'Slide 04 · Solution',
        title: 'QueueZero sends a live position to every patient',
        points: ['One-tap join from any phone', 'SMS alert at the three-patient mark'],
      },
      {
        kicker: 'Slide 07 · Architecture',
        title: 'Next.js front end, Node API, Postgres queue',
        points: ['Row-level locking on ticket claims', 'Single source of truth in Postgres'],
      },
      {
        kicker: 'Slide 09 · Result',
        title: '[Add your pilot result here]',
        points: ['Name the clinics and the test period', 'Use one measured number from your own test'],
      },
    ],
    script: [
      { time: '00:00', line: 'Patients wait for hours without knowing when they will be seen.' },
      { time: '00:15', line: 'QueueZero gives every patient a live position from their phone.' },
      { time: '00:35', line: 'Here is the running build. Join the queue, watch the position update.' },
      { time: '00:50', line: 'Pilot result: [add your measured number].' },
    ],
    checklist: [
      { criterion: 'Product Thinking', item: 'Walk one patient journey from join to call-up' },
      { criterion: 'Use of AI', item: 'Forecast wait times from the last 14 days of visits' },
      { criterion: 'Feasibility', item: 'Show the queue updating live across two devices' },
      { criterion: 'Innovation', item: 'Lead with the SMS alert at the three-patient mark' },
    ],
  },
  {
    id: 'study-match',
    label: 'Study group matchmaking',
    statement:
      'First-year students struggle to find peers in the same course with overlapping free time. Build a matchmaker that forms study groups in minutes.',
    intent: 'peer_matching · users: first-years · judge: feasibility',
    slotFile: 'db/schema.ts',
    slotLines: [
      "import { z } from 'zod';",
      '',
      '// slot: db.schema  |  row-level security on every table',
      'export const StudyGroup = z.object({',
      '  course: z.string().min(2),',
      "  schedule: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri'])),",
      '  maxMembers: z.number().int().max(6),',
      '});',
    ],
    slides: [
      {
        kicker: 'Slide 01 · Problem',
        title: 'First-years study alone because groups are hard to find',
        points: ['Course forums are noisy', 'Free time rarely lines up by chance'],
      },
      {
        kicker: 'Slide 04 · Solution',
        title: 'Study Match forms small groups from shared free time',
        points: ['Matches on course and free blocks', 'Groups capped at six members'],
      },
      {
        kicker: 'Slide 07 · Architecture',
        title: 'Typed schema, row-level security, one matching endpoint',
        points: ['Every row scoped to its owner', 'Zod validates each group before save'],
      },
      {
        kicker: 'Slide 09 · Result',
        title: '[Add your matching result here]',
        points: ['Name the test group and the time window', 'Use one measured number from your own test'],
      },
    ],
    script: [
      { time: '00:00', line: 'First-years struggle to find study partners who share their course and their schedule.' },
      { time: '00:15', line: 'Study Match builds groups of four from overlapping free blocks.' },
      { time: '00:35', line: 'Here is a live match. Every record is validated and scoped to its owner.' },
      { time: '00:50', line: 'Result so far: [add your measured number].' },
    ],
    checklist: [
      { criterion: 'Feasibility', item: 'Show the schema check rejecting a bad schedule' },
      { criterion: 'Product Thinking', item: 'Name the first-year user and their week-one pain' },
      { criterion: 'Use of AI', item: 'Explain the AI-written group intro messages' },
      { criterion: 'Innovation', item: 'Compare matching on free blocks versus course forums' },
    ],
  },
];
