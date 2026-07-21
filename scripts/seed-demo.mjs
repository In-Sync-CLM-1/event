// Seeds "TechFest India" demo org + "Product Summit 2026" event into the live event project.
// Idempotent: wipes and re-creates demo users/org/event/data each run.
// Usage: node scripts/seed-demo.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { loadEnv } from './lib/env.mjs';

// AI-generated headshots (scripts/gen-headshots.mjs) embedded as data URIs
const headshot = (key) => {
  try {
    return 'data:image/jpeg;base64,' +
      readFileSync(new URL(`./assets/speakers/${key}.jpg`, import.meta.url)).toString('base64');
  } catch {
    return null;
  }
};

const env = loadEnv(new URL('../.env', import.meta.url));
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = env.EVENT_DEMO_PASSWORD;
if (!PASSWORD) throw new Error('EVENT_DEMO_PASSWORD missing from .env');

const safe = (q) => Promise.resolve(q); // safe;

// ── helpers ─────────────────────────────────────────────────────────────────
const now = () => new Date().toISOString();
const daysFromNow = (d, h = 9, m = 0) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  dt.setHours(h, m, 0, 0);
  return dt.toISOString();
};
const TODAY_8AM  = daysFromNow(0, 8);
const TODAY_6PM  = daysFromNow(0, 18);
const TODAY_REGDL= daysFromNow(3, 23, 59);  // 3 days out → registration open for demo

// Deterministic RNG so every render gets the same believable dataset
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260628);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const shuffled = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ── people ───────────────────────────────────────────────────────────────────
const PEOPLE = [
  { key: 'rahul',  email: 'rahul@techfest-demo.in',  name: 'Rahul Mehta',    role: 'super_admin' },
  { key: 'priya',  email: 'priya@techfest-demo.in',  name: 'Priya Sharma',   role: 'attendee'    },
  { key: 'arjun',  email: 'arjun@techfest-demo.in',  name: 'Arjun Nair',     role: 'attendee'    },
  { key: 'kavya',  email: 'kavya@techfest-demo.in',  name: 'Kavya Reddy',    role: 'attendee'    },
  { key: 'suresh', email: 'suresh@techfest-demo.in', name: 'Suresh Kumar',   role: 'attendee'    },
  { key: 'meena',  email: 'meena@techfest-demo.in',  name: 'Meena Pillai',   role: 'attendee'    },
  { key: 'vikram', email: 'vikram@techfest-demo.in', name: 'Vikram Singh',   role: 'attendee'    },
  { key: 'anjali', email: 'anjali@techfest-demo.in', name: 'Anjali Iyer',    role: 'attendee'    },
  { key: 'rohit',  email: 'rohit@techfest-demo.in',  name: 'Rohit Joshi',    role: 'attendee'    },
  { key: 'divya',  email: 'divya@techfest-demo.in',  name: 'Divya Menon',    role: 'attendee'    },
];

const COMPANIES = [
  'NexaTech', 'DataBridge', 'TechForge', 'FinVault', 'QuickBasket', 'FoodRoute', 'LearnSpark',
  'ShopLocal', 'WealthBridge', 'TrustScore',
];
const DESIGNATIONS = [
  'CEO', 'CTO', 'CMO', 'CFO', 'COO',
  'Chief Product Officer', 'Co-Founder & CEO', 'Managing Director',
  'Chief Revenue Officer', 'Chief Growth Officer',
];

// ── wipe old event data FIRST (before deleting auth users, to clear FK refs) ──
console.log('Wiping old TechFest demo data...');
const DEMO_SLUGS = [
  'product-summit-2026',
  'saas-growth-conclave-2026', 'fintech-founders-roadshow-2026',
  'd2c-brand-summit-2026', 'ai-in-product-virtual-2026',
];
const { data: oldEvents } = await sb.from('events').select('id').in('slug', DEMO_SLUGS);
for (const oldEv of oldEvents || []) {
  const eid = oldEv.id;
  for (const tbl of [
    'engagement_scores','content_library','reward_claims','rewards','badge_awards','badges',
    'points_log','attendee_schedules','meeting_requests','meeting_bookings',
    'event_reminders','event_reminder_settings',
    'check_ins','certificates','registrations','meeting_slots','session_speakers',
    'sessions','speakers','meeting_spots','landing_pages',
  ]) {
    await sb.from(tbl).delete().eq('event_id', eid); // safe;
  }
  await sb.from('events').delete().eq('id', eid);
}
// Wipe user_roles for demo emails so auth delete can proceed
const demoEmails = PEOPLE.map(p => p.email);
const { data: existingAll } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
const demoUsers = (existingAll?.users || []).filter(u => demoEmails.includes(u.email));
if (demoUsers.length) {
  await sb.from('user_roles').delete().in('user_id', demoUsers.map(u => u.id)); // safe;
}

// ── auth: delete then recreate demo users ─────────────────────────────────────
console.log('Upserting auth users...');
for (const u of demoUsers) {
  await sb.auth.admin.deleteUser(u.id);
}
const userIds = {};
for (const p of PEOPLE) {
  const { data, error } = await sb.auth.admin.createUser({
    email: p.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: p.name },
  });
  if (error) throw new Error(`createUser ${p.email}: ${error.message}`);
  userIds[p.key] = data.user.id;
  console.log(`  ${p.name} (${p.email})`);
}

// ── user_roles: set admin ─────────────────────────────────────────────────────
console.log('Setting user roles...');
await sb.from('user_roles').insert({ user_id: userIds.rahul, role: 'super_admin' });

// ── event ─────────────────────────────────────────────────────────────────────
console.log('Creating Product Summit 2026...');
const { data: eventRow, error: evErr } = await sb.from('events').insert({
  title:                 'Product Summit 2026',
  slug:                  'product-summit-2026',
  description:           'India\'s premier product management conference. Two tracks, seven sessions, 300+ product minds — from Series A founders to PMs at FAANG. One day. Bengaluru.',
  venue:                 'NIMHANS Convention Centre',
  address:               'Hosur Road, Lakkasandra',
  city:                  'Bengaluru',
  start_date:            TODAY_8AM,
  end_date:              TODAY_6PM,
  registration_deadline: TODAY_REGDL,
  max_capacity:          300,
  total_spend:           1600000,
  mode:                  'in_person',
  event_type:            'conference',
  status:                'published',
  banner_url:            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&q=80&auto=format&fit=crop',
  created_by:            userIds.rahul,
}).select().single();
if (evErr) throw new Error(`event insert: ${evErr.message}`);
const EVENT_ID = eventRow.id;
console.log(`  event id: ${EVENT_ID}`);

// ── speakers ──────────────────────────────────────────────────────────────────
console.log('Creating speakers...');
const { data: speakerRows } = await sb.from('speakers').insert([
  {
    event_id:   EVENT_ID,
    name:       'Shreya Agarwal',
    title:      'Chief Product Officer',
    company:    'FinVault',
    bio:        'Shreya leads product strategy at FinVault, scaling the payments stack from ₹1K Cr to ₹5L Cr GMV. She is known for her zero-to-one thinking on fintech UX and building product orgs that ship.',
    photo_url:  headshot('shreya'),
    social_links: { linkedin: 'https://linkedin.com/in/shreya-agarwal' },
    sort_order: 1,
  },
  {
    event_id:   EVENT_ID,
    name:       'Karan Bajaj',
    title:      'Co-Founder & CTO',
    company:    'WealthBridge',
    bio:        'Karan built WealthBridge\'s engineering from 3 to 300 people and took the platform to 50M+ investors. His talk on "Building for Bharat" has become required reading across Indian fintech circles.',
    photo_url:  headshot('karan'),
    social_links: { linkedin: 'https://linkedin.com/in/karan-bajaj' },
    sort_order: 2,
  },
  {
    event_id:   EVENT_ID,
    name:       'Nandini Rao',
    title:      'Chief Design Officer',
    company:    'TrustScore',
    bio:        'Award-winning CDO behind TrustScore\'s cult-status app experience. Previously a design lead at a global search giant. Speaks about craft, obsession, and why delight is a C-suite strategy, not a design-team afterthought.',
    photo_url:  headshot('nandini'),
    social_links: { linkedin: 'https://linkedin.com/in/nandini-rao' },
    sort_order: 3,
  },
  {
    event_id:   EVENT_ID,
    name:       'Aarav Singh',
    title:      'Chief Revenue Officer',
    company:    'ShopLocal',
    bio:        'Aarav drove ShopLocal\'s 100x GMV era as CRO. He brings a data-first lens to every revenue decision and a healthy scepticism of vanity metrics that don\'t compound.',
    photo_url:  headshot('aarav'),
    social_links: { linkedin: 'https://linkedin.com/in/aarav-singh' },
    sort_order: 4,
  },
]).select();

const [spShreya, spKaran, spNandini, spAarav] = speakerRows;

// ── sessions ──────────────────────────────────────────────────────────────────
console.log('Creating sessions...');
const sessionSeed = [
  {
    title:      'Opening Keynote: The Product Decade',
    description:'Where Indian product is headed — and what it means to build for a billion users.',
    start_time: daysFromNow(0, 9, 0),
    end_time:   daysFromNow(0, 9, 45),
    location:   'Main Stage',
    track:      'Keynote',
    max_capacity: 300,
    sort_order: 1,
    speaker_ids: [spShreya.id, spKaran.id],
  },
  {
    title:      'Zero to PMF: Lessons from Building in Bharat',
    description:'How do you find product-market fit when your customer earns ₹15,000/month and has 2G data? Real stories from three founders who cracked it.',
    start_time: daysFromNow(0, 10, 0),
    end_time:   daysFromNow(0, 10, 45),
    location:   'Track A — Hall 1',
    track:      'Product Strategy',
    max_capacity: 150,
    sort_order: 2,
    speaker_ids: [spKaran.id],
  },
  {
    title:      'Design as Strategy: How TrustScore Built a Cult',
    description:'A behind-the-scenes look at the design decisions that made TrustScore the most talked-about app of the decade — and the principles you can steal.',
    start_time: daysFromNow(0, 10, 0),
    end_time:   daysFromNow(0, 10, 45),
    location:   'Track B — Hall 2',
    track:      'Design',
    max_capacity: 120,
    sort_order: 3,
    speaker_ids: [spNandini.id],
  },
  {
    title:      'Growth Without Ads: Building Retention First',
    description:'Aarav breaks down ShopLocal\'s organic growth playbook — cohort retention, referral loops, and why they never bought a single paid ad in their first year.',
    start_time: daysFromNow(0, 11, 15),
    end_time:   daysFromNow(0, 12, 0),
    location:   'Track A — Hall 1',
    track:      'Growth',
    max_capacity: 150,
    sort_order: 4,
    speaker_ids: [spAarav.id],
  },
  {
    title:      'PM Panel: Managing Up, Across, and Through',
    description:'Four PMs at different stages — seed, Series B, pre-IPO, and post-IPO — on how stakeholder management actually works in the real world.',
    start_time: daysFromNow(0, 14, 0),
    end_time:   daysFromNow(0, 15, 0),
    location:   'Main Stage',
    track:      'Keynote',
    max_capacity: 300,
    sort_order: 5,
    speaker_ids: [spShreya.id, spAarav.id],
  },
  {
    title:      'Workshop: Writing a PRD That Engineers Will Love',
    description:'Hands-on. You will walk out with a PRD template, three anti-patterns to avoid, and a checklist your team can use tomorrow.',
    start_time: daysFromNow(0, 15, 15),
    end_time:   daysFromNow(0, 16, 15),
    location:   'Track B — Hall 2',
    track:      'Workshops',
    max_capacity: 60,
    sort_order: 6,
    speaker_ids: [spNandini.id],
  },
  {
    title:      'Closing Keynote: What the Next 10 Years Demand',
    description:'Shreya\'s closing keynote on the skills, mindsets, and habits that will separate great product people from average ones in the AI era.',
    start_time: daysFromNow(0, 16, 30),
    end_time:   daysFromNow(0, 17, 15),
    location:   'Main Stage',
    track:      'Keynote',
    max_capacity: 300,
    sort_order: 7,
    speaker_ids: [spShreya.id],
  },
];

const sessionIds = [];
for (const s of sessionSeed) {
  const { speaker_ids, ...rest } = s;
  const { data: sr, error: sErr } = await sb.from('sessions').insert({ event_id: EVENT_ID, ...rest }).select().single();
  if (sErr) throw new Error(`session insert: ${sErr.message}`);
  sessionIds.push(sr.id);
  // link speakers
  if (speaker_ids?.length) {
    await sb.from('session_speakers').insert(speaker_ids.map(sid => ({ session_id: sr.id, speaker_id: sid }))); // safe;
  }
}
console.log(`  ${sessionIds.length} sessions created`);

// ── registrations ─────────────────────────────────────────────────────────────
console.log('Creating registrations...');
const attendeeKeys = ['priya','arjun','kavya','suresh','meena','vikram','anjali','rohit','divya'];
const regIds = {};

for (let i = 0; i < attendeeKeys.length; i++) {
  const key = attendeeKeys[i];
  const p = PEOPLE.find(x => x.key === key);
  const regNum = `PS2026-${String(i + 1).padStart(4, '0')}`;
  const company = COMPANIES[i % COMPANIES.length];
  const designation = DESIGNATIONS[i % DESIGNATIONS.length];
  const regTime = new Date(Date.now() - (9 - i) * 24 * 60 * 60 * 1000).toISOString();

  // priya & arjun checked in, rest confirmed
  const isCheckedIn = i < 7; // first 7 checked in
  const checkedInAt = isCheckedIn ? daysFromNow(0, 8 + (i % 3), 15 + (i * 7) % 30) : null;

  const { data: reg, error: rErr } = await sb.from('registrations').insert({
    event_id:            EVENT_ID,
    user_id:             userIds[key],
    full_name:           p.name,
    email:               p.email,
    phone:               `+91 9${8 + (i % 2)}${String(100000000 + i * 11111111).slice(0, 9)}`,
    company,
    designation,
    registration_number: regNum,
    status:              isCheckedIn ? 'checked_in' : 'confirmed',
    registered_at:       regTime,
    checked_in_at:       checkedInAt,
    linkedin_url:        i < 5 ? 'https://linkedin.com' : null,
  }).select().single();
  if (rErr) throw new Error(`reg insert ${key}: ${rErr.message}`);
  regIds[key] = reg.id;
}
console.log(`  ${attendeeKeys.length} registrations created`);

// ── synthetic crowd: 291 more registrations → 300 total ─────────────────────
console.log('Creating synthetic crowd (291 registrations)...');
const FIRST = ['Aditya','Ananya','Rohan','Ishita','Karthik','Sneha','Varun','Pooja','Nikhil','Riya',
  'Siddharth','Tanvi','Akash','Neha','Manish','Shruti','Rajat','Deepika','Harsh','Aisha',
  'Gaurav','Swati','Pranav','Nidhi','Abhishek','Kritika','Sameer','Lakshmi','Yash','Mansi',
  'Ravi','Preeti','Ankit','Sonal','Vivek','Ipsita','Mohit','Chitra','Tarun','Bhavna'];
const LAST = ['Verma','Krishnan','Deshpande','Chatterjee','Malhotra','Nambiar','Kulkarni','Bhat','Saxena','Chawla',
  'Rathore','Menon','Gokhale','Banerjee','Trivedi','Hegde','Choudhury','Mishra','Sethi','Naik',
  'Kapadia','Rana','Venkatesh','Dutta','Pandey'];
const CROWD_COMPANIES = [...COMPANIES,
  'CloudNine Labs','PayStack India','GrowthWorks','Meshwork','UrbanCart','SwiftLogix','BrightHire',
  'Zenlytics','CoreStack','MapleTech','NimbusPay','TalentBase','RetailPulse','FreshCart'];
const CROWD_ROLES = [...DESIGNATIONS,
  'Product Manager','Senior Product Manager','Director of Product','Group PM','Associate PM',
  'Growth Lead','Design Lead','Engineering Manager','VP Product','Founder','UX Researcher','Data Scientist'];

// Registration dates: spread across 30 days with a spike 14-13 days out (invite blast)
const regDayOffset = () => {
  const r = rnd();
  if (r < 0.35) return 13 + Math.floor(rnd() * 2);      // blast spike
  if (r < 0.65) return 1 + Math.floor(rnd() * 12);      // steady tail
  return 15 + Math.floor(rnd() * 15);                   // early trickle
};

const usedNames = new Set(PEOPLE.map(p => p.name));
const crowdRows = [];
for (let i = 0; i < 291; i++) {
  let name;
  do { name = `${pick(FIRST)} ${pick(LAST)}`; } while (usedNames.has(name));
  usedNames.add(name);
  const [fn, ln] = name.split(' ');
  const company = pick(CROWD_COMPANIES);
  const domain = company.toLowerCase().replace(/[^a-z]/g, '') + '.in';
  const daysAgo = regDayOffset();
  crowdRows.push({
    event_id:            EVENT_ID,
    user_id:             null,
    full_name:           name,
    email:               `${fn.toLowerCase()}.${ln.toLowerCase()}@${domain}`,
    phone:               `+91 9${String(100000000 + Math.floor(rnd() * 899999999)).slice(0, 9)}`,
    company,
    designation:         pick(CROWD_ROLES),
    registration_number: `PS2026-${String(i + 10).padStart(4, '0')}`,
    status:              'confirmed',
    registered_at:       new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - Math.floor(rnd() * 14) * 60 * 60 * 1000).toISOString(),
    checked_in_at:       null,
    linkedin_url:        rnd() < 0.6 ? 'https://linkedin.com' : null,
  });
}

// 208 of the crowd are checked in (215 total with the 7 named → +Neha live = 72%)
const checkedInCrowdIdx = shuffled(crowdRows.map((_, i) => i)).slice(0, 208);
// 40 of the checked-in picked up badges yesterday evening, the rest arrive this morning
const yesterdayIdx = new Set(checkedInCrowdIdx.slice(0, 40));
const checkinTimeFor = (i) => yesterdayIdx.has(i)
  ? daysFromNow(-1, 17 + Math.floor(rnd() * 3), Math.floor(rnd() * 60))
  : daysFromNow(0, 7 + Math.floor(rnd() * 4), 45 * (rnd() < 0.2 ? 1 : 0) + Math.floor(rnd() * 45));
for (const i of checkedInCrowdIdx) {
  crowdRows[i].status = 'checked_in';
  crowdRows[i].checked_in_at = checkinTimeFor(i);
}

const crowdIds = [];
for (let ofs = 0; ofs < crowdRows.length; ofs += 100) {
  const { data: batch, error: cErr } = await sb.from('registrations')
    .insert(crowdRows.slice(ofs, ofs + 100)).select('id, status, checked_in_at');
  if (cErr) throw new Error(`crowd insert @${ofs}: ${cErr.message}`);
  crowdIds.push(...batch);
}
console.log(`  291 crowd registrations created (208 checked in)`);

// ── check_ins rows (the stats/analytics source of truth) ─────────────────────
console.log('Creating check_ins...');
const checkedInRegs = [
  ...attendeeKeys.filter((_, i) => i < 7).map(k => ({ id: regIds[k], t: daysFromNow(0, 8, 10 + Math.floor(rnd() * 50)) })),
  ...crowdIds.filter(r => r.status === 'checked_in').map(r => ({ id: r.id, t: r.checked_in_at })),
];
const checkinRows = checkedInRegs.map(r => ({
  event_id:       EVENT_ID,
  registration_id: r.id,
  session_id:     null,
  check_in_time:  r.t,
  method:         rnd() < 0.8 ? 'qr' : 'manual',
}));

// Session-level check-ins → drives the Session Popularity chart
// [keynote 205/300, PMF 118/150, Design 110/120, Growth 92/150, Panel 160/300, PRD workshop 60/60 (sold out), Closing 140/300]
const SESSION_FILL = [205, 118, 110, 92, 160, 60, 140];
const sessionHours = [[9, 0], [10, 0], [10, 0], [11, 15], [14, 0], [15, 15], [16, 30]];
SESSION_FILL.forEach((target, sIdx) => {
  const audience = shuffled(checkedInRegs).slice(0, target);
  const [h, m] = sessionHours[sIdx];
  for (const r of audience) {
    checkinRows.push({
      event_id:       EVENT_ID,
      registration_id: r.id,
      session_id:     sessionIds[sIdx],
      check_in_time:  daysFromNow(0, h, m + Math.floor(rnd() * 20)),
      method:         'qr',
    });
  }
});

for (let ofs = 0; ofs < checkinRows.length; ofs += 500) {
  const { error: ciErr } = await sb.from('check_ins').insert(checkinRows.slice(ofs, ofs + 500));
  if (ciErr) throw new Error(`check_ins insert @${ofs}: ${ciErr.message}`);
}
console.log(`  ${checkinRows.length} check_ins created (${checkedInRegs.length} event-level)`);

// ── attendee schedules (session bookmarks) ────────────────────────────────────
console.log('Creating attendee schedules...');
// Priya bookmarked 3 sessions
await sb.from('attendee_schedules').insert([
  { registration_id: regIds.priya, session_id: sessionIds[0] },
  { registration_id: regIds.priya, session_id: sessionIds[1] },
  { registration_id: regIds.priya, session_id: sessionIds[4] },
]); // safe;
// Arjun bookmarked 2 sessions
await sb.from('attendee_schedules').insert([
  { registration_id: regIds.arjun, session_id: sessionIds[0] },
  { registration_id: regIds.arjun, session_id: sessionIds[3] },
]); // safe;

// ── points ────────────────────────────────────────────────────────────────────
console.log('Creating gamification data...');
const pointsData = [
  { key: 'priya',  pts: 480, acts: [
    { type: 'session_attended', desc: 'Opening Keynote', pts: 50 },
    { type: 'session_attended', desc: 'Zero to PMF', pts: 50 },
    { type: 'networking', desc: 'Connected with 5 attendees', pts: 100 },
    { type: 'content_viewed', desc: 'Downloaded PRD template', pts: 30 },
    { type: 'check_in', desc: 'Event check-in', pts: 100 },
    { type: 'profile_complete', desc: 'Completed profile', pts: 150 },
  ]},
  { key: 'arjun', pts: 320, acts: [
    { type: 'check_in', desc: 'Event check-in', pts: 100 },
    { type: 'session_attended', desc: 'Opening Keynote', pts: 50 },
    { type: 'networking', desc: 'Connected with 3 attendees', pts: 60 },
    { type: 'profile_complete', desc: 'Completed profile', pts: 110 },
  ]},
  { key: 'kavya', pts: 250, acts: [
    { type: 'check_in', desc: 'Event check-in', pts: 100 },
    { type: 'session_attended', desc: 'Design as Strategy', pts: 50 },
    { type: 'profile_complete', desc: 'Completed profile', pts: 100 },
  ]},
  { key: 'suresh', pts: 200, acts: [
    { type: 'check_in', desc: 'Event check-in', pts: 100 },
    { type: 'session_attended', desc: 'Opening Keynote', pts: 50 },
    { type: 'networking', desc: 'Sent 2 meeting requests', pts: 50 },
  ]},
  { key: 'meena', pts: 180, acts: [
    { type: 'check_in', desc: 'Event check-in', pts: 100 },
    { type: 'session_attended', desc: 'Growth Without Ads', pts: 50 },
    { type: 'content_viewed', desc: 'Viewed session slides', pts: 30 },
  ]},
  { key: 'vikram', pts: 150, acts: [
    { type: 'check_in', desc: 'Event check-in', pts: 100 },
    { type: 'session_attended', desc: 'PM Panel', pts: 50 },
  ]},
  { key: 'anjali', pts: 130, acts: [
    { type: 'check_in', desc: 'Event check-in', pts: 100 },
    { type: 'content_viewed', desc: 'Viewed slides', pts: 30 },
  ]},
  { key: 'rohit',  pts: 80,  acts: [{ type: 'check_in', desc: 'Event check-in', pts: 80 }] },
  { key: 'divya',  pts: 50,  acts: [{ type: 'check_in', desc: 'Event check-in', pts: 50 }] },
];

for (const { key, acts } of pointsData) {
  const regId = regIds[key];
  if (!regId) continue;
  const ts = new Date(Date.now() - 4 * 60 * 60 * 1000);
  for (const a of acts) {
    ts.setMinutes(ts.getMinutes() + 20);
    await sb.from('points_log').insert({
      event_id:       EVENT_ID,
      registration_id: regId,
      points:          a.pts,
      activity_type:   a.type,
      description:     a.desc,
      created_at:      ts.toISOString(),
    }); // safe;
  }
}

// ── badges ────────────────────────────────────────────────────────────────────
console.log('Creating badges...');
const { data: badgeRows } = await sb.from('badges').insert([
  { event_id: EVENT_ID, name: 'Early Bird',       description: 'Registered in the first 48 hours', points_value: 100, sort_order: 1 },
  { event_id: EVENT_ID, name: 'Networker',        description: 'Connected with 5+ fellow attendees', points_value: 150, sort_order: 2 },
  { event_id: EVENT_ID, name: 'Session Champion', description: 'Attended 5 or more sessions', points_value: 200, sort_order: 3 },
  { event_id: EVENT_ID, name: 'Top Contributor',  description: 'Asked a question in 3+ sessions', points_value: 250, sort_order: 4 },
]).select();

// Award early bird to first 4 registrants
if (badgeRows?.length) {
  const earlyBird = badgeRows[0];
  const networker = badgeRows[1];
  for (const key of ['priya', 'arjun', 'kavya', 'suresh']) {
    await sb.from('badge_awards').insert({ event_id: EVENT_ID, registration_id: regIds[key], badge_id: earlyBird.id, awarded_at: now() }); // safe;
  }
  // Award networker to priya
  await sb.from('badge_awards').insert({ event_id: EVENT_ID, registration_id: regIds.priya, badge_id: networker.id, awarded_at: now() }); // safe;
}

// ── rewards ───────────────────────────────────────────────────────────────────
console.log('Creating rewards...');
const { data: rewardRows } = await sb.from('rewards').insert([
  { event_id: EVENT_ID, name: 'Summit Notebook',       description: 'Exclusive leather-bound Product Summit notebook', points_required: 100,  quantity: 50,  sort_order: 1 },
  { event_id: EVENT_ID, name: 'Speaker Book Bundle',   description: 'Signed books from all 4 keynote speakers',        points_required: 300,  quantity: 20,  sort_order: 2 },
  { event_id: EVENT_ID, name: 'VIP After-Party Pass',  description: 'Exclusive access to the speaker dinner',          points_required: 500,  quantity: 10,  sort_order: 3 },
  { event_id: EVENT_ID, name: 'Full Recordings Pack',  description: 'All 7 session recordings + slides download',      points_required: 200,  quantity: null, sort_order: 4 },
]).select();

// Priya claimed the notebook
if (rewardRows?.length) {
  await sb.from('reward_claims').insert({
    event_id: EVENT_ID,
    registration_id: regIds.priya,
    reward_id: rewardRows[0].id,
    claimed_at: now(),
    status: 'pending',
  }); // safe;
}

// ── content items ─────────────────────────────────────────────────────────────
console.log('Creating content items...');
await sb.from('content_library').insert([
  {
    event_id:  EVENT_ID,
    title:     'Pre-Read: The State of Indian Product 2026',
    description: 'A 12-page brief covering market sizing, talent landscape, and the 5 product bets that matter this year.',
    type:      'pdf',
    url:       'https://drive.google.com/file/d/sample',
    is_gated:  false,
    sort_order: 1,
  },
  {
    event_id:  EVENT_ID,
    session_id: sessionIds[5], // Workshop session
    title:     'PRD Template — Workshop Edition',
    description: 'The exact PRD template from the Writing a PRD workshop. Plug-and-play for your team.',
    type:      'pdf',
    url:       'https://drive.google.com/file/d/sample2',
    is_gated:  true,
    sort_order: 2,
  },
  {
    event_id:  EVENT_ID,
    title:     'Summit Photo Gallery',
    description: 'Official event photography — shareable on LinkedIn.',
    type:      'image',
    url:       'https://drive.google.com/drive/folders/sample',
    is_gated:  false,
    sort_order: 3,
  },
]); // safe;

// ── engagement scores (all 300 attendees, with breakdowns) ───────────────────
console.log('Creating engagement scores...');
const engagementData = [
  { key: 'priya',  score: 92, tier: 'hot',     breakdown: { points: 480, sessions_attended: 3, badges_earned: 2 } },
  { key: 'arjun',  score: 74, tier: 'warm',    breakdown: { points: 320, sessions_attended: 2, badges_earned: 1 } },
  { key: 'kavya',  score: 68, tier: 'warm',    breakdown: { points: 250, sessions_attended: 1, badges_earned: 1 } },
  { key: 'suresh', score: 55, tier: 'engaged', breakdown: { points: 200, sessions_attended: 1, badges_earned: 1 } },
  { key: 'meena',  score: 48, tier: 'engaged', breakdown: { points: 180, sessions_attended: 1, badges_earned: 0 } },
  { key: 'vikram', score: 38, tier: 'engaged', breakdown: { points: 150, sessions_attended: 1, badges_earned: 0 } },
  { key: 'anjali', score: 28, tier: 'passive', breakdown: { points: 130, sessions_attended: 0, badges_earned: 0 } },
  { key: 'rohit',  score: 18, tier: 'passive', breakdown: { points: 80,  sessions_attended: 0, badges_earned: 0 } },
  { key: 'divya',  score: 10, tier: 'passive', breakdown: { points: 50,  sessions_attended: 0, badges_earned: 0 } },
];

const scoreRows = engagementData.map(({ key, score, tier, breakdown }) => ({
  event_id:        EVENT_ID,
  registration_id: regIds[key],
  score,
  tier,
  breakdown,
  calculated_at:   now(),
}));

// Crowd: hot 8% / warm 22% / engaged 38% / passive 32% — all capped below Priya's 92
const tierFor = (r) => r < 0.08 ? ['hot', 80 + Math.floor(rnd() * 11)]
  : r < 0.30 ? ['warm', 60 + Math.floor(rnd() * 20)]
  : r < 0.68 ? ['engaged', 35 + Math.floor(rnd() * 25)]
  : ['passive', 5 + Math.floor(rnd() * 30)];
for (const reg of crowdIds) {
  const [tier, score] = tierFor(rnd());
  scoreRows.push({
    event_id:        EVENT_ID,
    registration_id: reg.id,
    score,
    tier,
    breakdown: {
      points:            score * 3 + Math.floor(rnd() * 30),
      sessions_attended: Math.min(3, Math.floor(score / 30)),
      badges_earned:     score >= 70 ? 1 : 0,
    },
    calculated_at: now(),
  });
}
for (let ofs = 0; ofs < scoreRows.length; ofs += 200) {
  const { error: esErr } = await sb.from('engagement_scores').insert(scoreRows.slice(ofs, ofs + 200));
  if (esErr) throw new Error(`engagement insert @${ofs}: ${esErr.message}`);
}
console.log(`  ${scoreRows.length} engagement scores created`);

// ── reminder loop: settings + a realistic sent log ────────────────────────────
console.log('Creating reminder loop demo data...');
await sb.from('event_reminder_settings').insert({
  event_id:             EVENT_ID,
  whatsapp_enabled:     true,
  calls_enabled:        true,
  remind_day_before:    true,
  remind_event_morning: true,
  bolna_agent_id:       env.EVENTSYNC_REMINDER_AGENT_ID || null,
}); // safe;

// WhatsApp wave — yesterday 5 PM, everyone confirmed at that point (290 of 300)
const allRegIds = [...Object.values(regIds), ...crowdIds.map(r => r.id)];
const waWave = allRegIds.slice(0, 290).map((rid, i) => ({
  event_id:        EVENT_ID,
  registration_id: rid,
  channel:         'whatsapp',
  kind:            'day_before',
  status:          'delivered',
  detail:          { sid: `demo-wa-${i}`, http: 202 },
  created_at:      daysFromNow(-1, 17, Math.floor(i / 15)),
}));

// AI call wave — event morning, the 42 still-unconfirmed; outcomes logged
const CALL_OUTCOMES = [
  ...Array(27).fill(['completed', 'Confirmed — will attend', 38]),
  ...Array(6).fill(['completed', 'Unsure — will decide today', 52]),
  ...Array(6).fill(['no_answer', null, 0]),
  ...Array(3).fill(['completed', 'Callback requested', 41]),
];
const callTargets = [regIds.meena, ...shuffled(crowdIds.filter(r => r.status === 'checked_in')).slice(0, 41).map(r => r.id)];
const callWave = callTargets.map((rid, i) => {
  const [status, outcome, dur] = i === 0
    ? ['completed', 'Confirmed — will attend', 34]   // Meena — named in the narration
    : CALL_OUTCOMES[(i - 1) % CALL_OUTCOMES.length];
  return {
    event_id:        EVENT_ID,
    registration_id: rid,
    channel:         'ai_call',
    kind:            'event_morning',
    status,
    outcome,
    detail:          { execution_id: `demo-exec-${i}`, conversation_duration: dur },
    created_at:      daysFromNow(0, 9, (i * 43) % 40),
  };
});
// Priya — the promo's through-line character: went quiet, the AI called, she
// confirmed (and did walk in). Latest timestamp so she tops the reminder log.
callWave.push({
  event_id:        EVENT_ID,
  registration_id: regIds.priya,
  channel:         'ai_call',
  kind:            'event_morning',
  status:          'completed',
  outcome:         'Confirmed — will attend',
  detail:          { execution_id: 'demo-exec-priya', conversation_duration: 36 },
  created_at:      daysFromNow(0, 9, 52),
});

for (const chunk of [waWave, callWave]) {
  for (let ofs = 0; ofs < chunk.length; ofs += 200) {
    const { error: rErr } = await sb.from('event_reminders').insert(chunk.slice(ofs, ofs + 200));
    if (rErr) throw new Error(`event_reminders insert @${ofs}: ${rErr.message}`);
  }
}
console.log(`  ${waWave.length} WhatsApp + ${callWave.length} AI-call reminder rows`);

// ── meeting spots ─────────────────────────────────────────────────────────────
console.log('Creating meeting spots...');
await sb.from('meeting_spots').insert([
  { event_id: EVENT_ID, name: 'Networking Lounge A', location: 'Main entrance, Level 1', capacity: 8, is_active: true },
  { event_id: EVENT_ID, name: 'Networking Lounge B', location: 'Outdoor terrace, Level 2', capacity: 6, is_active: true },
  { event_id: EVENT_ID, name: 'Investor Corner',     location: 'Private booths, Level 3',  capacity: 4, is_active: true },
]); // safe;

// meeting slots (30-min blocks across lunch + afternoon)
const slotTimes = [
  [12, 0, 12, 30, 'Networking Lounge A'], [12, 30, 13, 0, 'Networking Lounge A'],
  [13, 0, 13, 30, 'Networking Lounge B'], [13, 30, 14, 0, 'Networking Lounge B'],
  [15, 0, 15, 30, 'Investor Corner'],     [15, 30, 16, 0, 'Investor Corner'],
];
for (const [sh, sm, eh, em, loc] of slotTimes) {
  await sb.from('meeting_slots').insert({
    event_id:     EVENT_ID,
    start_time:   daysFromNow(0, sh, sm),
    end_time:     daysFromNow(0, eh, em),
    location:     loc,
    is_available: true,
  }); // safe;
}

// ── meeting requests (networking) ─────────────────────────────────────────────
console.log('Creating meeting requests...');
await sb.from('meeting_requests').insert([
  {
    event_id:     EVENT_ID,
    requester_id: regIds.priya,
    target_id:    regIds.arjun,
    message:      'Hi Arjun! Loved your take on B2B SaaS at the panel. Would love to connect during lunch.',
    status:       'accepted',
    created_at:   now(),
  },
  {
    event_id:     EVENT_ID,
    requester_id: regIds.kavya,
    target_id:    regIds.priya,
    message:      'Priya, your questions during the Design talk were spot on! Coffee later?',
    status:       'pending',
    created_at:   now(),
  },
]); // safe;

// ── certificates: issue to first 5 checked-in ────────────────────────────────
console.log('Issuing certificates...');
const certKeys = ['priya', 'arjun', 'kavya', 'suresh', 'meena'];
for (let i = 0; i < certKeys.length; i++) {
  const key = certKeys[i];
  await sb.from('certificates').insert({
    event_id:           EVENT_ID,
    registration_id:    regIds[key],
    certificate_number: `CERT-PS2026-${String(i + 1).padStart(4, '0')}`,
    issued_at:          now(),
    pdf_url:            null,
  }); // safe;
}
console.log(`  5 certificates issued`);

// ── landing page ──────────────────────────────────────────────────────────────
console.log('Creating custom landing page...');
// NOTE: sections must be a real JSON array — the app checks Array.isArray()
// and treats a stringified array as an empty page.
await sb.from('landing_pages').insert({
  event_id:    EVENT_ID,
  page_type:   'builder',
  is_published: true,
  sections:    [
    { id: 'sec1', type: 'hero',     order: 0, config: { headline: 'Product Summit 2026', subheadline: 'India\'s biggest product conference. One day. Seven sessions. 300 minds.', ctaText: 'Register Now' }},
    { id: 'sec2', type: 'about',    order: 1, config: { title: 'About the Summit', content: 'Two tracks. Seven sessions. Zero fluff. Built for product people who want to go deep.' }},
    { id: 'sec3', type: 'speakers', order: 2, config: {} },
    { id: 'sec4', type: 'agenda',   order: 3, config: {} },
    { id: 'sec5', type: 'sponsors', order: 4, config: {} },
    { id: 'sec6', type: 'cta',      order: 5, config: { title: 'Ready to join?', ctaText: 'Register Now', ctaUrl: '#register' }},
  ],
}); // safe;

// ── past events (the Performance page's "how it adds up" story) ──────────────
// Four completed events earlier this year, each with registrations, event-level
// check_ins, and engagement tiers — so cross-event analytics have a real quarter
// of history behind them. Repeat attendee names across events are intentional.
console.log('Creating past events (performance history)...');
const PAST_EVENTS = [
  { title: 'SaaS Growth Conclave',       slug: 'saas-growth-conclave-2026',     monthsAgo: 5, day: 12, city: 'Mumbai',    venue: 'Jio World Centre',        mode: 'in_person', event_type: 'conference', regs: 218, attend: 152, spend: 1450000 },
  { title: 'Fintech Founders Roadshow',  slug: 'fintech-founders-roadshow-2026',monthsAgo: 3, day: 9,  city: 'New Delhi', venue: 'The Lalit',               mode: 'in_person', event_type: 'roadshow',   regs: 142, attend: 108, spend: 820000 },
  { title: 'D2C Brand Summit',           slug: 'd2c-brand-summit-2026',         monthsAgo: 2, day: 21, city: 'Bengaluru', venue: 'Sheraton Grand Brigade',  mode: 'in_person', event_type: 'trade_fair', regs: 176, attend: 121, spend: 960000 },
  { title: 'AI in Product — Virtual Day',slug: 'ai-in-product-virtual-2026',    monthsAgo: 1, day: 18, city: null,        venue: 'Online',                  mode: 'virtual',   event_type: 'webinar',    regs: 204, attend: 131, spend: 180000 },
];

const pastDate = (monthsAgo, day, h, m = 0) => {
  const dt = new Date();
  dt.setMonth(dt.getMonth() - monthsAgo);
  dt.setDate(day); dt.setHours(h, m, 0, 0);
  return dt;
};

for (const pe of PAST_EVENTS) {
  const start = pastDate(pe.monthsAgo, pe.day, 9);
  const end = pastDate(pe.monthsAgo, pe.day, 18);
  const { data: evRow, error: peErr } = await sb.from('events').insert({
    title: pe.title, slug: pe.slug,
    description: `${pe.title} — a TechFest India event.`,
    venue: pe.venue, address: pe.city ? `${pe.city}` : null, city: pe.city,
    start_date: start.toISOString(), end_date: end.toISOString(),
    registration_deadline: new Date(start.getTime() - 2 * 86400000).toISOString(),
    max_capacity: Math.ceil(pe.regs / 10) * 10 + 40,
    total_spend: pe.spend,
    mode: pe.mode, event_type: pe.event_type, status: 'published',
    created_by: userIds.rahul,
  }).select().single();
  if (peErr) throw new Error(`past event ${pe.slug}: ${peErr.message}`);

  const prefix = pe.slug.split('-').map(w => w[0]).join('').toUpperCase();
  const namesInEvent = new Set();
  const rows = [];
  for (let i = 0; i < pe.regs; i++) {
    let name;
    do { name = `${pick(FIRST)} ${pick(LAST)}`; } while (namesInEvent.has(name));
    namesInEvent.add(name);
    const [fn, ln] = name.split(' ');
    const company = pick(CROWD_COMPANIES);
    const attended = i < pe.attend;
    const regDaysBefore = 2 + Math.floor(rnd() * 28);
    rows.push({
      event_id: evRow.id, user_id: null,
      full_name: name,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@${company.toLowerCase().replace(/[^a-z]/g, '')}.in`,
      phone: `+91 9${String(100000000 + Math.floor(rnd() * 899999999)).slice(0, 9)}`,
      company, designation: pick(CROWD_ROLES),
      registration_number: `${prefix}-${String(i + 1).padStart(4, '0')}`,
      status: attended ? 'checked_in' : 'confirmed',
      registered_at: new Date(start.getTime() - regDaysBefore * 86400000).toISOString(),
      checked_in_at: attended ? new Date(start.getTime() + (30 + Math.floor(rnd() * 150)) * 60000).toISOString() : null,
      linkedin_url: rnd() < 0.5 ? 'https://linkedin.com' : null,
    });
  }
  const inserted = [];
  for (let ofs = 0; ofs < rows.length; ofs += 100) {
    const { data: batch, error: bErr } = await sb.from('registrations')
      .insert(rows.slice(ofs, ofs + 100)).select('id, status, checked_in_at');
    if (bErr) throw new Error(`past regs ${pe.slug} @${ofs}: ${bErr.message}`);
    inserted.push(...batch);
  }

  const ciRows = inserted.filter(r => r.status === 'checked_in').map(r => ({
    event_id: evRow.id, registration_id: r.id, session_id: null,
    check_in_time: r.checked_in_at, method: rnd() < 0.85 ? 'qr' : 'manual',
  }));
  for (let ofs = 0; ofs < ciRows.length; ofs += 500) {
    const { error: ciErr2 } = await sb.from('check_ins').insert(ciRows.slice(ofs, ofs + 500));
    if (ciErr2) throw new Error(`past check_ins ${pe.slug}: ${ciErr2.message}`);
  }

  const esRows = inserted.map((r) => {
    const attended = r.status === 'checked_in';
    // non-attendees can only be passive; attendees follow the usual tier mix
    const roll = rnd();
    const [tier, score] = !attended ? ['passive', 3 + Math.floor(rnd() * 12)]
      : roll < 0.09 ? ['hot', 80 + Math.floor(rnd() * 15)]
      : roll < 0.33 ? ['warm', 60 + Math.floor(rnd() * 20)]
      : roll < 0.75 ? ['engaged', 35 + Math.floor(rnd() * 25)]
      : ['passive', 10 + Math.floor(rnd() * 25)];
    return {
      event_id: evRow.id, registration_id: r.id, score, tier,
      breakdown: {
        points: score * 3 + Math.floor(rnd() * 30),
        sessions_attended: attended ? Math.min(3, Math.floor(score / 30)) : 0,
        badges_earned: score >= 70 ? 1 : 0,
      },
      calculated_at: end.toISOString(),
    };
  });
  for (let ofs = 0; ofs < esRows.length; ofs += 200) {
    const { error: esErr2 } = await sb.from('engagement_scores').insert(esRows.slice(ofs, ofs + 200));
    if (esErr2) throw new Error(`past scores ${pe.slug}: ${esErr2.message}`);
  }
  console.log(`  ${pe.title}: ${pe.regs} regs, ${pe.attend} attended`);
}

console.log('\n✓ TechFest India / Product Summit 2026 seeded successfully.');
console.log(`  Event ID: ${EVENT_ID}`);
console.log(`  Admin: rahul@techfest-demo.in / ${PASSWORD}`);
console.log(`  Attendee: priya@techfest-demo.in / ${PASSWORD}`);
console.log(`  Attendee2: arjun@techfest-demo.in / ${PASSWORD}`);
