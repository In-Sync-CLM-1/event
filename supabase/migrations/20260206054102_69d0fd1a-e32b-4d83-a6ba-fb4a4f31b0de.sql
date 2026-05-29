
-- Global Tech Summit 2026 - Large Scale Demo Event
WITH new_event AS (
  INSERT INTO public.events (title, slug, description, start_date, end_date, venue, city, address, status, max_capacity)
  VALUES (
    'Global Tech Summit 2026',
    'global-tech-summit-2026',
    'The premier technology conference bringing together industry leaders, innovators, and developers for a full day of keynotes, workshops, and networking. Featuring 4 parallel tracks with 30+ sessions across AI, Cloud, DevOps, Design, and more.',
    '2026-03-15T09:00:00+04:00',
    '2026-03-15T18:00:00+04:00',
    'Dubai World Trade Centre',
    'Dubai',
    'Trade Centre District, Sheikh Zayed Road, Dubai, UAE',
    'published',
    500
  )
  RETURNING id
),

-- 12 Speakers
speakers_insert AS (
  INSERT INTO public.speakers (event_id, name, title, company, bio, sort_order)
  SELECT e.id, s.name, s.title, s.company, s.bio, s.sort_order
  FROM new_event e,
  (VALUES
    ('Dr. Sarah Chen', 'Chief AI Officer', 'DeepMind', 'Pioneer in enterprise AI adoption with 15+ years in machine learning research.', 1),
    ('Marcus Williams', 'VP of Engineering', 'Cloudflare', 'Leading cloud-native architecture initiatives serving billions of requests daily.', 2),
    ('Priya Sharma', 'Head of Design', 'Figma', 'Award-winning UX leader who has shaped design systems used by millions.', 3),
    ('James O''Brien', 'CTO', 'HashiCorp', 'DevOps evangelist and infrastructure-as-code pioneer.', 4),
    ('Aisha Al-Rashid', 'CEO', 'CyberShield AI', 'Cybersecurity expert specializing in AI-driven threat detection.', 5),
    ('David Kim', 'Distinguished Engineer', 'Google', 'Core contributor to Kubernetes and serverless computing platforms.', 6),
    ('Elena Vasquez', 'Chief Product Officer', 'Stripe', 'Product strategist who scaled fintech products to 50+ countries.', 7),
    ('Dr. Raj Patel', 'Research Director', 'OpenAI', 'Leading researcher in large language models and AI safety.', 8),
    ('Nina Kowalski', 'VP of Growth', 'Notion', 'Growth hacking specialist who drove 10x user acquisition.', 9),
    ('Omar Hassan', 'Blockchain Lead', 'Ethereum Foundation', 'Smart contract architect and Web3 ecosystem builder.', 10),
    ('Lisa Zhang', 'MLOps Director', 'Databricks', 'Expert in production ML pipelines and data engineering at scale.', 11),
    ('Alex Turner', 'Founder & CEO', 'QuantumLeap', 'Quantum computing entrepreneur bridging research and industry.', 12)
  ) AS s(name, title, company, bio, sort_order)
  RETURNING id, name
),

-- Sessions: 9 time slots, 30 sessions total
sessions_insert AS (
  INSERT INTO public.sessions (event_id, title, description, start_time, end_time, track, location, max_capacity, sort_order)
  SELECT e.id, s.title, s.description, s.start_time, s.end_time, s.track, s.location, s.max_capacity, s.sort_order
  FROM new_event e,
  (VALUES
    -- 9:00-9:45 Keynote
    ('Opening Keynote: The Future is Now', 'A visionary opening exploring how AI, quantum computing, and Web3 are converging to reshape every industry.', '2026-03-15T09:00:00+04:00'::timestamptz, '2026-03-15T09:45:00+04:00'::timestamptz, 'Main Stage', 'Main Stage - Hall A', 500, 1),
    -- 10:00-10:45 (4 parallel)
    ('AI in Enterprise: From POC to Production', 'Practical strategies for deploying AI models at enterprise scale, including governance, monitoring, and ROI measurement.', '2026-03-15T10:00:00+04:00'::timestamptz, '2026-03-15T10:45:00+04:00'::timestamptz, 'Main Stage', 'Main Stage - Hall A', 200, 2),
    ('Cloud-Native Architecture Patterns', 'Deep dive into microservices, service mesh, and event-driven architectures for modern cloud applications.', '2026-03-15T10:00:00+04:00'::timestamptz, '2026-03-15T10:45:00+04:00'::timestamptz, 'Innovation Lab', 'Innovation Lab - Hall B', 100, 3),
    ('UX Design Workshop: Research to Reality', 'Hands-on workshop covering user research methods, prototyping, and usability testing best practices.', '2026-03-15T10:00:00+04:00'::timestamptz, '2026-03-15T10:45:00+04:00'::timestamptz, 'Workshop Room', 'Workshop Room - Hall C', 50, 4),
    ('Product Strategy for Hypergrowth', 'How to build and execute product strategies that drive exponential growth in competitive markets.', '2026-03-15T10:00:00+04:00'::timestamptz, '2026-03-15T10:45:00+04:00'::timestamptz, 'Networking Hall', 'Networking Hall - Hall D', 80, 5),
    -- 11:00-11:45 (4 parallel)
    ('The Future of Large Language Models', 'Exploring next-gen LLM architectures, multimodal capabilities, and the path to AGI.', '2026-03-15T11:00:00+04:00'::timestamptz, '2026-03-15T11:45:00+04:00'::timestamptz, 'Main Stage', 'Main Stage - Hall A', 200, 6),
    ('DevOps Best Practices in 2026', 'CI/CD pipelines, GitOps workflows, and infrastructure automation for high-velocity teams.', '2026-03-15T11:00:00+04:00'::timestamptz, '2026-03-15T11:45:00+04:00'::timestamptz, 'Innovation Lab', 'Innovation Lab - Hall B', 100, 7),
    ('Data Visualization Masterclass', 'Transform complex datasets into compelling visual stories using modern charting libraries and design principles.', '2026-03-15T11:00:00+04:00'::timestamptz, '2026-03-15T11:45:00+04:00'::timestamptz, 'Workshop Room', 'Workshop Room - Hall C', 50, 8),
    ('Growth Hacking: Viral Loops & Retention', 'Proven tactics for building viral growth loops and maximizing user retention in SaaS products.', '2026-03-15T11:00:00+04:00'::timestamptz, '2026-03-15T11:45:00+04:00'::timestamptz, 'Networking Hall', 'Networking Hall - Hall D', 80, 9),
    -- 12:00-12:30 Lunch Panel
    ('Lunch Break Panel: Tech Ethics Debate', 'An interactive panel discussing AI ethics, data privacy, and responsible innovation over lunch.', '2026-03-15T12:00:00+04:00'::timestamptz, '2026-03-15T12:30:00+04:00'::timestamptz, 'Main Stage', 'Main Stage - Hall A', 500, 10),
    -- 13:00-13:45 (4 parallel)
    ('Cybersecurity Trends: AI-Powered Defense', 'How AI is revolutionizing threat detection, incident response, and security operations centers.', '2026-03-15T13:00:00+04:00'::timestamptz, '2026-03-15T13:45:00+04:00'::timestamptz, 'Main Stage', 'Main Stage - Hall A', 200, 11),
    ('API Design Patterns & Best Practices', 'RESTful, GraphQL, and gRPC patterns for building scalable, developer-friendly APIs.', '2026-03-15T13:00:00+04:00'::timestamptz, '2026-03-15T13:45:00+04:00'::timestamptz, 'Innovation Lab', 'Innovation Lab - Hall B', 100, 12),
    ('Mobile Development Workshop', 'Cross-platform mobile development with React Native and Flutter: performance optimization and native integrations.', '2026-03-15T13:00:00+04:00'::timestamptz, '2026-03-15T13:45:00+04:00'::timestamptz, 'Workshop Room', 'Workshop Room - Hall C', 50, 13),
    ('Leadership in Tech: Building High-Performance Teams', 'Strategies for engineering leadership, team culture, and scaling organizations effectively.', '2026-03-15T13:00:00+04:00'::timestamptz, '2026-03-15T13:45:00+04:00'::timestamptz, 'Networking Hall', 'Networking Hall - Hall D', 80, 14),
    -- 14:00-14:45 (4 parallel)
    ('Edge Computing: Processing at the Periphery', 'Deploying compute closer to users with edge networks, CDN workers, and IoT edge processing.', '2026-03-15T14:00:00+04:00'::timestamptz, '2026-03-15T14:45:00+04:00'::timestamptz, 'Main Stage', 'Main Stage - Hall A', 200, 15),
    ('Serverless Deep Dive', 'Advanced serverless patterns: step functions, event sourcing, and cost optimization strategies.', '2026-03-15T14:00:00+04:00'::timestamptz, '2026-03-15T14:45:00+04:00'::timestamptz, 'Innovation Lab', 'Innovation Lab - Hall B', 100, 16),
    ('Agile at Scale: SAFe vs LeSS vs Spotify', 'Comparing scaling frameworks and finding the right approach for your organization.', '2026-03-15T14:00:00+04:00'::timestamptz, '2026-03-15T14:45:00+04:00'::timestamptz, 'Workshop Room', 'Workshop Room - Hall C', 50, 17),
    ('Marketing Tech Stack Deep Dive', 'Building a modern marketing technology stack: analytics, automation, and personalization at scale.', '2026-03-15T14:00:00+04:00'::timestamptz, '2026-03-15T14:45:00+04:00'::timestamptz, 'Networking Hall', 'Networking Hall - Hall D', 80, 18),
    -- 15:00-15:45 (4 parallel)
    ('Blockchain & Web3: Beyond the Hype', 'Real-world blockchain applications in supply chain, DeFi, and digital identity.', '2026-03-15T15:00:00+04:00'::timestamptz, '2026-03-15T15:45:00+04:00'::timestamptz, 'Main Stage', 'Main Stage - Hall A', 200, 19),
    ('MLOps: Production ML Pipelines', 'End-to-end ML lifecycle management: feature stores, model registries, and automated retraining.', '2026-03-15T15:00:00+04:00'::timestamptz, '2026-03-15T15:45:00+04:00'::timestamptz, 'Innovation Lab', 'Innovation Lab - Hall B', 100, 20),
    ('Design Systems: Building at Scale', 'Creating and maintaining design systems that serve dozens of products and hundreds of engineers.', '2026-03-15T15:00:00+04:00'::timestamptz, '2026-03-15T15:45:00+04:00'::timestamptz, 'Workshop Room', 'Workshop Room - Hall C', 50, 21),
    ('Investor Panel: Funding in 2026', 'VCs and angels discuss what they look for in tech startups, current trends, and pitch tips.', '2026-03-15T15:00:00+04:00'::timestamptz, '2026-03-15T15:45:00+04:00'::timestamptz, 'Networking Hall', 'Networking Hall - Hall D', 80, 22),
    -- 16:00-16:45 (4 parallel)
    ('Quantum Computing: Industry Applications', 'From drug discovery to financial modeling: practical quantum computing use cases emerging today.', '2026-03-15T16:00:00+04:00'::timestamptz, '2026-03-15T16:45:00+04:00'::timestamptz, 'Main Stage', 'Main Stage - Hall A', 200, 23),
    ('Open Source Strategy for Enterprises', 'Building successful open source programs: licensing, community building, and monetization.', '2026-03-15T16:00:00+04:00'::timestamptz, '2026-03-15T16:45:00+04:00'::timestamptz, 'Innovation Lab', 'Innovation Lab - Hall B', 100, 24),
    ('Testing Automation: Zero-Bug Culture', 'E2E testing, visual regression, and AI-assisted test generation for bulletproof releases.', '2026-03-15T16:00:00+04:00'::timestamptz, '2026-03-15T16:45:00+04:00'::timestamptz, 'Workshop Room', 'Workshop Room - Hall C', 50, 25),
    ('Startup Pitch Competition', 'Five handpicked startups pitch their innovations to a panel of investors and industry leaders.', '2026-03-15T16:00:00+04:00'::timestamptz, '2026-03-15T16:45:00+04:00'::timestamptz, 'Networking Hall', 'Networking Hall - Hall D', 80, 26),
    -- 17:00-17:30 Closing Keynote
    ('Closing Keynote: Building Tomorrow Together', 'A forward-looking keynote on collaboration, open innovation, and the technologies that will define the next decade.', '2026-03-15T17:00:00+04:00'::timestamptz, '2026-03-15T17:30:00+04:00'::timestamptz, 'Main Stage', 'Main Stage - Hall A', 500, 27)
  ) AS s(title, description, start_time, end_time, track, location, max_capacity, sort_order)
  RETURNING id, title
),

-- Link speakers to sessions
speaker_session_links AS (
  INSERT INTO public.session_speakers (session_id, speaker_id)
  SELECT s.id, sp.id
  FROM sessions_insert s, speakers_insert sp
  WHERE
    (s.title = 'Opening Keynote: The Future is Now' AND sp.name = 'Dr. Sarah Chen') OR
    (s.title = 'Opening Keynote: The Future is Now' AND sp.name = 'Alex Turner') OR
    (s.title = 'AI in Enterprise: From POC to Production' AND sp.name = 'Dr. Sarah Chen') OR
    (s.title = 'Cloud-Native Architecture Patterns' AND sp.name = 'Marcus Williams') OR
    (s.title = 'UX Design Workshop: Research to Reality' AND sp.name = 'Priya Sharma') OR
    (s.title = 'Product Strategy for Hypergrowth' AND sp.name = 'Elena Vasquez') OR
    (s.title = 'The Future of Large Language Models' AND sp.name = 'Dr. Raj Patel') OR
    (s.title = 'DevOps Best Practices in 2026' AND sp.name = 'James O''Brien') OR
    (s.title = 'Data Visualization Masterclass' AND sp.name = 'Priya Sharma') OR
    (s.title = 'Growth Hacking: Viral Loops & Retention' AND sp.name = 'Nina Kowalski') OR
    (s.title = 'Lunch Break Panel: Tech Ethics Debate' AND sp.name = 'Dr. Sarah Chen') OR
    (s.title = 'Lunch Break Panel: Tech Ethics Debate' AND sp.name = 'Dr. Raj Patel') OR
    (s.title = 'Lunch Break Panel: Tech Ethics Debate' AND sp.name = 'Aisha Al-Rashid') OR
    (s.title = 'Cybersecurity Trends: AI-Powered Defense' AND sp.name = 'Aisha Al-Rashid') OR
    (s.title = 'API Design Patterns & Best Practices' AND sp.name = 'David Kim') OR
    (s.title = 'Mobile Development Workshop' AND sp.name = 'Marcus Williams') OR
    (s.title = 'Leadership in Tech: Building High-Performance Teams' AND sp.name = 'Elena Vasquez') OR
    (s.title = 'Edge Computing: Processing at the Periphery' AND sp.name = 'David Kim') OR
    (s.title = 'Serverless Deep Dive' AND sp.name = 'James O''Brien') OR
    (s.title = 'Agile at Scale: SAFe vs LeSS vs Spotify' AND sp.name = 'Nina Kowalski') OR
    (s.title = 'Marketing Tech Stack Deep Dive' AND sp.name = 'Elena Vasquez') OR
    (s.title = 'Blockchain & Web3: Beyond the Hype' AND sp.name = 'Omar Hassan') OR
    (s.title = 'MLOps: Production ML Pipelines' AND sp.name = 'Lisa Zhang') OR
    (s.title = 'Design Systems: Building at Scale' AND sp.name = 'Priya Sharma') OR
    (s.title = 'Investor Panel: Funding in 2026' AND sp.name = 'Omar Hassan') OR
    (s.title = 'Investor Panel: Funding in 2026' AND sp.name = 'Alex Turner') OR
    (s.title = 'Quantum Computing: Industry Applications' AND sp.name = 'Alex Turner') OR
    (s.title = 'Open Source Strategy for Enterprises' AND sp.name = 'James O''Brien') OR
    (s.title = 'Testing Automation: Zero-Bug Culture' AND sp.name = 'Lisa Zhang') OR
    (s.title = 'Startup Pitch Competition' AND sp.name = 'Nina Kowalski') OR
    (s.title = 'Closing Keynote: Building Tomorrow Together' AND sp.name = 'Dr. Sarah Chen') OR
    (s.title = 'Closing Keynote: Building Tomorrow Together' AND sp.name = 'Omar Hassan')
  RETURNING id
),

-- 3 Meeting Spots
spots_insert AS (
  INSERT INTO public.meeting_spots (event_id, name, location, capacity, is_active)
  SELECT e.id, s.name, s.location, s.capacity, true
  FROM new_event e,
  (VALUES
    ('VIP Lounge', 'Level 2 - VIP Area', 4),
    ('Networking Corner', 'Ground Floor - Near Registration', 2),
    ('Exhibitor Hall Meeting Point', 'Exhibition Hall - Pod 3', 6)
  ) AS s(name, location, capacity)
  RETURNING id, name
),

-- 20 Meeting Slots spread across the day
slots_insert AS (
  INSERT INTO public.meeting_slots (event_id, start_time, end_time, location, is_available)
  SELECT e.id, s.start_time, s.end_time, s.location, true
  FROM new_event e,
  (VALUES
    ('2026-03-15T10:00:00+04:00'::timestamptz, '2026-03-15T10:30:00+04:00'::timestamptz, 'VIP Lounge'),
    ('2026-03-15T10:30:00+04:00'::timestamptz, '2026-03-15T11:00:00+04:00'::timestamptz, 'VIP Lounge'),
    ('2026-03-15T11:00:00+04:00'::timestamptz, '2026-03-15T11:30:00+04:00'::timestamptz, 'Networking Corner'),
    ('2026-03-15T11:30:00+04:00'::timestamptz, '2026-03-15T12:00:00+04:00'::timestamptz, 'Networking Corner'),
    ('2026-03-15T12:00:00+04:00'::timestamptz, '2026-03-15T12:30:00+04:00'::timestamptz, 'Exhibitor Hall Meeting Point'),
    ('2026-03-15T12:30:00+04:00'::timestamptz, '2026-03-15T13:00:00+04:00'::timestamptz, 'Exhibitor Hall Meeting Point'),
    ('2026-03-15T13:00:00+04:00'::timestamptz, '2026-03-15T13:30:00+04:00'::timestamptz, 'VIP Lounge'),
    ('2026-03-15T13:30:00+04:00'::timestamptz, '2026-03-15T14:00:00+04:00'::timestamptz, 'VIP Lounge'),
    ('2026-03-15T14:00:00+04:00'::timestamptz, '2026-03-15T14:30:00+04:00'::timestamptz, 'Networking Corner'),
    ('2026-03-15T14:30:00+04:00'::timestamptz, '2026-03-15T15:00:00+04:00'::timestamptz, 'Networking Corner'),
    ('2026-03-15T15:00:00+04:00'::timestamptz, '2026-03-15T15:30:00+04:00'::timestamptz, 'VIP Lounge'),
    ('2026-03-15T15:30:00+04:00'::timestamptz, '2026-03-15T16:00:00+04:00'::timestamptz, 'VIP Lounge'),
    ('2026-03-15T16:00:00+04:00'::timestamptz, '2026-03-15T16:30:00+04:00'::timestamptz, 'Exhibitor Hall Meeting Point'),
    ('2026-03-15T16:30:00+04:00'::timestamptz, '2026-03-15T17:00:00+04:00'::timestamptz, 'Exhibitor Hall Meeting Point'),
    ('2026-03-15T10:00:00+04:00'::timestamptz, '2026-03-15T10:30:00+04:00'::timestamptz, 'Networking Corner'),
    ('2026-03-15T11:00:00+04:00'::timestamptz, '2026-03-15T11:30:00+04:00'::timestamptz, 'VIP Lounge'),
    ('2026-03-15T13:00:00+04:00'::timestamptz, '2026-03-15T13:30:00+04:00'::timestamptz, 'Exhibitor Hall Meeting Point'),
    ('2026-03-15T14:00:00+04:00'::timestamptz, '2026-03-15T14:30:00+04:00'::timestamptz, 'VIP Lounge'),
    ('2026-03-15T15:00:00+04:00'::timestamptz, '2026-03-15T15:30:00+04:00'::timestamptz, 'Exhibitor Hall Meeting Point'),
    ('2026-03-15T16:00:00+04:00'::timestamptz, '2026-03-15T16:30:00+04:00'::timestamptz, 'VIP Lounge')
  ) AS s(start_time, end_time, location)
  RETURNING id
)

SELECT 
  (SELECT count(*) FROM sessions_insert) AS sessions_created,
  (SELECT count(*) FROM speakers_insert) AS speakers_created,
  (SELECT count(*) FROM speaker_session_links) AS speaker_links_created,
  (SELECT count(*) FROM spots_insert) AS spots_created,
  (SELECT count(*) FROM slots_insert) AS slots_created;
