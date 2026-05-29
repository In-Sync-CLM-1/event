
-- Demo Data Seeding Script (Fixed)
-- Uses unique registration numbers with UUID-based prefixes

DO $$
DECLARE
  event_ids UUID[] := ARRAY[]::UUID[];
  new_event_id UUID;
  event_counter INT := 0;
  
  first_names TEXT[] := ARRAY['James', 'Emma', 'Michael', 'Sophia', 'William', 'Olivia', 'Alexander', 'Isabella', 'Daniel', 'Mia', 'David', 'Charlotte', 'Joseph', 'Amelia', 'Andrew', 'Harper', 'Ryan', 'Evelyn', 'Nathan', 'Abigail', 'Christopher', 'Emily', 'Matthew', 'Elizabeth', 'Joshua', 'Sofia', 'Ethan', 'Avery', 'Benjamin', 'Ella', 'Lucas', 'Scarlett', 'Henry', 'Victoria', 'Sebastian', 'Madison', 'Jack', 'Luna', 'Owen', 'Grace', 'Priya', 'Raj', 'Ananya', 'Vikram', 'Chen', 'Wei', 'Yuki', 'Hiroshi', 'Kim', 'Jin'];
  
  last_names TEXT[] := ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Hall', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Patel', 'Kumar', 'Singh', 'Shah', 'Chen', 'Wang', 'Li', 'Zhang', 'Kim', 'Park', 'Tanaka', 'Suzuki', 'Yamamoto', 'Nakamura', 'Mueller', 'Schmidt', 'Fischer', 'Weber', 'Schneider', 'Meyer'];
  
  companies TEXT[] := ARRAY['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Uber', 'Airbnb', 'Stripe', 'Shopify', 'Salesforce', 'Adobe', 'Oracle', 'IBM', 'Intel', 'Cisco', 'VMware', 'Snowflake', 'Databricks', 'Confluent', 'HashiCorp', 'GitLab', 'Atlassian', 'Slack', 'Zoom', 'Notion', 'Figma', 'Canva', 'Airtable', 'Monday.com', 'Asana', 'Dropbox', 'Box', 'Twilio', 'SendGrid', 'Plaid', 'Square', 'PayPal', 'Robinhood', 'Coinbase', 'TechStart AI', 'CloudScale Inc', 'DataFlow Labs', 'SecureNet Pro', 'DesignHub Co', 'InnovateTech', 'FutureStack', 'AgileWorks', 'DevOps Masters', 'AI Ventures'];
  
  titles TEXT[] := ARRAY['Software Engineer', 'Senior Engineer', 'Staff Engineer', 'Principal Engineer', 'Engineering Manager', 'Director of Engineering', 'VP of Engineering', 'CTO', 'Product Manager', 'Senior Product Manager', 'Director of Product', 'VP of Product', 'CPO', 'Data Scientist', 'ML Engineer', 'DevOps Engineer', 'SRE', 'Security Engineer', 'UX Designer', 'UI Designer', 'Product Designer', 'Design Lead', 'Head of Design', 'Solutions Architect', 'Cloud Architect', 'Technical Lead', 'Founder', 'Co-Founder', 'CEO', 'COO'];
  
  event_configs JSONB[] := ARRAY[
    '{"title": "AI Innovation Conference 2026", "slug": "ai-innovation-2026", "description": "Explore the latest advancements in artificial intelligence and machine learning.", "venue": "San Francisco Convention Center", "city": "San Francisco", "days_offset": -15}'::JSONB,
    '{"title": "Cloud Architecture Summit", "slug": "cloud-architecture-summit", "description": "Deep dive into cloud-native architectures, Kubernetes, and serverless.", "venue": "Seattle Tech Hub", "city": "Seattle", "days_offset": 7}'::JSONB,
    '{"title": "Product Leadership Forum", "slug": "product-leadership-forum", "description": "For product managers and leaders looking to build world-class products.", "venue": "New York Marriott Marquis", "city": "New York", "days_offset": 21}'::JSONB,
    '{"title": "Design Systems Conference", "slug": "design-systems-conf", "description": "The premier event for design system practitioners.", "venue": "Austin Convention Center", "city": "Austin", "days_offset": -7}'::JSONB,
    '{"title": "Startup Founders Meetup", "slug": "startup-founders-meetup", "description": "Connect with fellow founders and learn from entrepreneurs.", "venue": "LA Tech Campus", "city": "Los Angeles", "days_offset": 35}'::JSONB,
    '{"title": "Data Engineering Week", "slug": "data-engineering-week", "description": "A week-long deep dive into data pipelines and streaming.", "venue": "Chicago Tech Center", "city": "Chicago", "days_offset": -21}'::JSONB,
    '{"title": "Security & Privacy Summit", "slug": "security-privacy-summit", "description": "Cybersecurity professionals discuss zero-trust and threat detection.", "venue": "Denver Convention Center", "city": "Denver", "days_offset": 14}'::JSONB,
    '{"title": "Mobile Dev Con 2026", "slug": "mobile-dev-con-2026", "description": "iOS, Android, React Native, Flutter - all mobile tracks covered.", "venue": "Boston Hynes Center", "city": "Boston", "days_offset": 45}'::JSONB
  ];
  
  config JSONB;
  i INT;
  j INT;
  k INT;
  speaker_id UUID;
  session_id UUID;
  reg_id UUID;
  spot_id UUID;
  slot_id UUID;
  badge_id UUID;
  content_id UUID;
  reward_id UUID;
  random_status TEXT;
  reg_count INT;
  speaker_ids UUID[];
  session_ids UUID[];
  registration_ids UUID[];
  badge_ids UUID[];
  content_ids UUID[];
  reward_ids UUID[];
  activity_types TEXT[] := ARRAY['check_in', 'session_attendance', 'content_view', 'meeting_completed', 'badge_earned', 'referral', 'survey_completed', 'social_share'];
  tiers TEXT[] := ARRAY['platinum', 'gold', 'silver', 'bronze'];
  sponsor_names TEXT[] := ARRAY['TechCorp', 'InnovateLabs', 'CloudFirst', 'DataDriven', 'SecureStack', 'DesignPro', 'CodeMasters', 'AIForward', 'DevTools Inc', 'ScaleSoft'];
  reg_prefix TEXT;
  
BEGIN
  FOREACH config IN ARRAY event_configs LOOP
    event_counter := event_counter + 1;
    reg_prefix := 'E' || event_counter || '-';
    
    INSERT INTO events (slug, title, description, venue, city, start_date, end_date, registration_deadline, max_capacity, status, address)
    VALUES (
      config->>'slug',
      config->>'title',
      config->>'description',
      config->>'venue',
      config->>'city',
      NOW() + ((config->>'days_offset')::INT || ' days')::INTERVAL,
      NOW() + ((config->>'days_offset')::INT + 2 || ' days')::INTERVAL,
      NOW() + ((config->>'days_offset')::INT - 7 || ' days')::INTERVAL,
      500, 'published', '123 Tech Boulevard'
    )
    RETURNING id INTO new_event_id;
    
    event_ids := array_append(event_ids, new_event_id);
    
    -- Create 6-8 speakers
    speaker_ids := ARRAY[]::UUID[];
    FOR j IN 1..6 + floor(random() * 3)::INT LOOP
      INSERT INTO speakers (event_id, name, title, company, bio, photo_url, social_links, sort_order)
      VALUES (
        new_event_id,
        first_names[1 + floor(random() * 50)::INT] || ' ' || last_names[1 + floor(random() * 50)::INT],
        titles[1 + floor(random() * 30)::INT],
        companies[1 + floor(random() * 50)::INT],
        'Industry expert with 10+ years of experience. Passionate about innovation and mentoring.',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=' || gen_random_uuid(),
        jsonb_build_object('linkedin', 'https://linkedin.com/in/speaker' || j, 'twitter', 'https://twitter.com/speaker' || j),
        j
      )
      RETURNING id INTO speaker_id;
      speaker_ids := array_append(speaker_ids, speaker_id);
    END LOOP;
    
    -- Create 10-12 sessions
    session_ids := ARRAY[]::UUID[];
    FOR j IN 1..10 + floor(random() * 3)::INT LOOP
      INSERT INTO sessions (event_id, title, description, start_time, end_time, location, track, max_capacity, sort_order)
      VALUES (
        new_event_id,
        CASE j WHEN 1 THEN 'Opening Keynote' WHEN 2 THEN 'Workshop: Hands-on' WHEN 3 THEN 'Panel Discussion'
               WHEN 4 THEN 'Deep Dive: Architecture' WHEN 5 THEN 'Lightning Talks' WHEN 6 THEN 'Networking Break'
               WHEN 7 THEN 'Case Study Session' WHEN 8 THEN 'Fireside Chat' WHEN 9 THEN 'Interactive Workshop'
               WHEN 10 THEN 'Closing Keynote' ELSE 'Bonus Session ' || j END,
        'Interactive session with Q&A.',
        NOW() + ((config->>'days_offset')::INT || ' days')::INTERVAL + (j || ' hours')::INTERVAL,
        NOW() + ((config->>'days_offset')::INT || ' days')::INTERVAL + ((j + 1) || ' hours')::INTERVAL,
        CASE floor(random() * 4)::INT WHEN 0 THEN 'Main Hall A' WHEN 1 THEN 'Workshop Room B' WHEN 2 THEN 'Breakout C' ELSE 'Innovation Lab' END,
        CASE floor(random() * 3)::INT WHEN 0 THEN 'Technical' WHEN 1 THEN 'Business' ELSE 'Design' END,
        100 + floor(random() * 200)::INT,
        j
      )
      RETURNING id INTO session_id;
      session_ids := array_append(session_ids, session_id);
      
      IF array_length(speaker_ids, 1) > 0 THEN
        BEGIN
          INSERT INTO session_speakers (session_id, speaker_id)
          VALUES (session_id, speaker_ids[1 + floor(random() * array_length(speaker_ids, 1))::INT])
          ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
      END IF;
    END LOOP;
    
    -- Create 60-80 registrations with unique numbers
    registration_ids := ARRAY[]::UUID[];
    reg_count := 60 + floor(random() * 21)::INT;
    FOR j IN 1..reg_count LOOP
      IF j <= reg_count * 0.25 THEN random_status := 'checked_in';
      ELSIF j <= reg_count * 0.85 THEN random_status := 'confirmed';
      ELSIF j <= reg_count * 0.95 THEN random_status := 'pending';
      ELSIF j <= reg_count * 0.98 THEN random_status := 'waitlisted';
      ELSE random_status := 'cancelled';
      END IF;
      
      INSERT INTO registrations (event_id, registration_number, email, full_name, phone, company, designation, linkedin_url, status, qr_code, registered_at, confirmed_at, checked_in_at)
      VALUES (
        new_event_id,
        reg_prefix || LPAD(j::TEXT, 4, '0'),
        lower(first_names[1 + floor(random() * 50)::INT]) || '.' || lower(last_names[1 + floor(random() * 50)::INT]) || floor(random() * 1000)::INT || '@' || 
        CASE floor(random() * 5)::INT WHEN 0 THEN 'gmail.com' WHEN 1 THEN 'outlook.com' WHEN 2 THEN 'company.com' WHEN 3 THEN 'tech.io' ELSE 'startup.co' END,
        first_names[1 + floor(random() * 50)::INT] || ' ' || last_names[1 + floor(random() * 50)::INT],
        '+1-555-' || LPAD(floor(random() * 10000)::TEXT, 4, '0'),
        companies[1 + floor(random() * 50)::INT],
        titles[1 + floor(random() * 30)::INT],
        CASE WHEN random() > 0.7 THEN 'https://linkedin.com/in/user' || j ELSE NULL END,
        random_status::registration_status,
        gen_random_uuid()::TEXT,
        NOW() - (floor(random() * 30) || ' days')::INTERVAL,
        CASE WHEN random_status IN ('confirmed', 'checked_in') THEN NOW() - (floor(random() * 20) || ' days')::INTERVAL ELSE NULL END,
        CASE WHEN random_status = 'checked_in' THEN NOW() + ((config->>'days_offset')::INT || ' days')::INTERVAL ELSE NULL END
      )
      RETURNING id INTO reg_id;
      registration_ids := array_append(registration_ids, reg_id);
      
      IF random_status = 'checked_in' THEN
        INSERT INTO check_ins (registration_id, event_id, check_in_time, method)
        VALUES (reg_id, new_event_id, NOW() + ((config->>'days_offset')::INT || ' days')::INTERVAL + (floor(random() * 4) || ' hours')::INTERVAL,
                CASE floor(random() * 3)::INT WHEN 0 THEN 'qr_scan' WHEN 1 THEN 'manual' ELSE 'self_checkin' END);
        
        IF random() > 0.4 AND array_length(session_ids, 1) > 0 THEN
          FOR k IN 1..1 + floor(random() * 3)::INT LOOP
            BEGIN
              INSERT INTO check_ins (registration_id, event_id, session_id, check_in_time, method)
              VALUES (reg_id, new_event_id, session_ids[1 + floor(random() * array_length(session_ids, 1))::INT],
                      NOW() + ((config->>'days_offset')::INT || ' days')::INTERVAL + ((k + 8) || ' hours')::INTERVAL, 'qr_scan')
              ON CONFLICT DO NOTHING;
            EXCEPTION WHEN OTHERS THEN NULL;
            END;
          END LOOP;
        END IF;
      END IF;
    END LOOP;
    
    -- Create meeting spots and slots
    FOR j IN 1..4 + floor(random() * 3)::INT LOOP
      INSERT INTO meeting_spots (event_id, name, location, capacity, is_active)
      VALUES (new_event_id, CASE j WHEN 1 THEN 'Networking Lounge A' WHEN 2 THEN 'Meeting Booth B' WHEN 3 THEN 'Executive Suite C' WHEN 4 THEN 'Coffee Corner D' ELSE 'Quick Connect ' || j END,
              'Level ' || j, 2 + floor(random() * 4)::INT, true)
      RETURNING id INTO spot_id;
      
      FOR k IN 1..12 + floor(random() * 4)::INT LOOP
        INSERT INTO meeting_slots (event_id, start_time, end_time, location, is_available)
        VALUES (new_event_id,
                NOW() + ((config->>'days_offset')::INT || ' days')::INTERVAL + ((9 + (k-1) * 0.5) || ' hours')::INTERVAL,
                NOW() + ((config->>'days_offset')::INT || ' days')::INTERVAL + ((9.5 + (k-1) * 0.5) || ' hours')::INTERVAL,
                'Booth ' || chr(64 + j), random() > 0.3);
      END LOOP;
    END LOOP;
    
    -- Create meeting bookings
    IF array_length(registration_ids, 1) > 10 THEN
      FOR j IN 1..10 + floor(random() * 6)::INT LOOP
        BEGIN
          INSERT INTO meeting_bookings (event_id, requester_registration_id, target_registration_id, spot_id, scheduled_start, duration_minutes, status, message, outcome_rating, follow_up_required)
          VALUES (new_event_id,
                  registration_ids[1 + floor(random() * (array_length(registration_ids, 1) / 2))::INT],
                  registration_ids[(array_length(registration_ids, 1) / 2) + floor(random() * (array_length(registration_ids, 1) / 2))::INT],
                  spot_id,
                  NOW() + ((config->>'days_offset')::INT || ' days')::INTERVAL + ((10 + floor(random() * 6)) || ' hours')::INTERVAL,
                  CASE floor(random() * 3)::INT WHEN 0 THEN 15 WHEN 1 THEN 30 ELSE 45 END,
                  CASE floor(random() * 4)::INT WHEN 0 THEN 'pending' WHEN 1 THEN 'confirmed' WHEN 2 THEN 'completed' ELSE 'cancelled' END,
                  'Looking forward to connecting!',
                  CASE WHEN random() > 0.5 THEN 3 + floor(random() * 3)::INT ELSE NULL END,
                  random() > 0.7)
          ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
      END LOOP;
    END IF;
    
    -- Create badges
    badge_ids := ARRAY[]::UUID[];
    FOR j IN 1..4 + floor(random() * 2)::INT LOOP
      INSERT INTO badges (event_id, name, description, icon_url, points_value, sort_order)
      VALUES (new_event_id,
              CASE j WHEN 1 THEN 'Early Bird' WHEN 2 THEN 'Networking Pro' WHEN 3 THEN 'Session Champion' WHEN 4 THEN 'Content Explorer' ELSE 'Super Attendee' END,
              CASE j WHEN 1 THEN 'Registered early' WHEN 2 THEN 'Connected with 5+ attendees' WHEN 3 THEN 'Attended 3+ sessions' WHEN 4 THEN 'Viewed 10+ items' ELSE 'All milestones' END,
              'https://api.dicebear.com/7.x/shapes/svg?seed=badge' || j || event_counter, 50 * j, j)
      RETURNING id INTO badge_id;
      badge_ids := array_append(badge_ids, badge_id);
    END LOOP;
    
    -- Award badges
    IF array_length(registration_ids, 1) > 0 AND array_length(badge_ids, 1) > 0 THEN
      FOR j IN 1..25 + floor(random() * 15)::INT LOOP
        BEGIN
          INSERT INTO badge_awards (badge_id, registration_id, awarded_at)
          VALUES (badge_ids[1 + floor(random() * array_length(badge_ids, 1))::INT],
                  registration_ids[1 + floor(random() * array_length(registration_ids, 1))::INT],
                  NOW() - (floor(random() * 10) || ' days')::INTERVAL)
          ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
      END LOOP;
    END IF;
    
    -- Create points log
    IF array_length(registration_ids, 1) > 0 THEN
      FOR j IN 1..100 + floor(random() * 50)::INT LOOP
        BEGIN
          INSERT INTO points_log (event_id, registration_id, activity_type, points, description, awarded_at)
          VALUES (new_event_id, registration_ids[1 + floor(random() * array_length(registration_ids, 1))::INT],
                  activity_types[1 + floor(random() * 8)::INT], 10 + floor(random() * 50)::INT,
                  'Points earned for participation', NOW() - (floor(random() * 14) || ' days')::INTERVAL);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
      END LOOP;
    END IF;
    
    -- Create engagement scores
    IF array_length(registration_ids, 1) > 0 THEN
      FOR j IN 1..array_length(registration_ids, 1) LOOP
        IF random() > 0.2 THEN
          BEGIN
            INSERT INTO engagement_scores (event_id, registration_id, score, tier, breakdown)
            VALUES (new_event_id, registration_ids[j], floor(random() * 100)::INT,
                    CASE WHEN random() < 0.15 THEN 'hot' WHEN random() < 0.35 THEN 'warm' WHEN random() < 0.65 THEN 'engaged' ELSE 'passive' END,
                    jsonb_build_object('sessions', floor(random() * 40)::INT, 'networking', floor(random() * 30)::INT, 'content', floor(random() * 20)::INT))
            ON CONFLICT DO NOTHING;
          EXCEPTION WHEN OTHERS THEN NULL;
          END;
        END IF;
      END LOOP;
    END IF;
    
    -- Create content library
    content_ids := ARRAY[]::UUID[];
    FOR j IN 1..6 + floor(random() * 4)::INT LOOP
      INSERT INTO content_library (event_id, title, description, type, url, is_gated, sort_order)
      VALUES (new_event_id,
              CASE j WHEN 1 THEN 'Keynote Slides' WHEN 2 THEN 'Workshop Materials' WHEN 3 THEN 'Panel Recording' WHEN 4 THEN 'Whitepaper' WHEN 5 THEN 'Speaker Interviews' ELSE 'Resource ' || j END,
              'Exclusive content from the event.',
              CASE floor(random() * 4)::INT WHEN 0 THEN 'pdf' WHEN 1 THEN 'video' WHEN 2 THEN 'slides' ELSE 'document' END,
              'https://example.com/content/' || gen_random_uuid(), random() > 0.4, j)
      RETURNING id INTO content_id;
      content_ids := array_append(content_ids, content_id);
    END LOOP;
    
    -- Create content views
    IF array_length(registration_ids, 1) > 0 AND array_length(content_ids, 1) > 0 THEN
      FOR j IN 1..60 + floor(random() * 40)::INT LOOP
        BEGIN
          INSERT INTO content_views (content_id, registration_id, duration_seconds, viewed_at)
          VALUES (content_ids[1 + floor(random() * array_length(content_ids, 1))::INT],
                  registration_ids[1 + floor(random() * array_length(registration_ids, 1))::INT],
                  60 + floor(random() * 600)::INT, NOW() - (floor(random() * 14) || ' days')::INTERVAL);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
      END LOOP;
    END IF;
    
    -- Create sponsors
    FOR j IN 1..4 + floor(random() * 3)::INT LOOP
      INSERT INTO sponsors (event_id, name, logo_url, website_url, tier, sort_order)
      VALUES (new_event_id, sponsor_names[1 + floor(random() * 10)::INT] || ' ' || event_counter || j,
              'https://api.dicebear.com/7.x/identicon/svg?seed=sponsor' || event_counter || j,
              'https://sponsor' || j || '.example.com', tiers[LEAST(j, 4)], j);
    END LOOP;
    
    -- Create rewards
    reward_ids := ARRAY[]::UUID[];
    FOR j IN 1..3 + floor(random() * 3)::INT LOOP
      INSERT INTO rewards (event_id, name, description, points_required, quantity, is_active, sort_order)
      VALUES (new_event_id,
              CASE j WHEN 1 THEN 'Event T-Shirt' WHEN 2 THEN 'Swag Bag' WHEN 3 THEN 'VIP Dinner' WHEN 4 THEN 'Recording Access' ELSE 'Gift ' || j END,
              'Exclusive reward for engaged attendees!', 100 * j, 20 + floor(random() * 30)::INT, true, j)
      RETURNING id INTO reward_id;
      reward_ids := array_append(reward_ids, reward_id);
    END LOOP;
    
    -- Create reward claims
    IF array_length(registration_ids, 1) > 0 AND array_length(reward_ids, 1) > 0 THEN
      FOR j IN 1..10 + floor(random() * 8)::INT LOOP
        BEGIN
          INSERT INTO reward_claims (reward_id, registration_id, fulfilled, fulfilled_at)
          VALUES (reward_ids[1 + floor(random() * array_length(reward_ids, 1))::INT],
                  registration_ids[1 + floor(random() * array_length(registration_ids, 1))::INT],
                  random() > 0.3, CASE WHEN random() > 0.4 THEN NOW() - (floor(random() * 7) || ' days')::INTERVAL ELSE NULL END)
          ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
      END LOOP;
    END IF;
    
  END LOOP;
  
  RAISE NOTICE 'Demo data seeding completed! Created % events.', array_length(event_ids, 1);
END $$;
