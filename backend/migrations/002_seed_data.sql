-- 002_seed_data.sql : demo data for CivicEvents+
-- PREREQUISITE: sign up admin@user.com and test@user.com through the frontend first
-- (passwords are bcrypt-hashed by the API, so users are not seeded here), and make the admin:
--   UPDATE users SET role='admin' WHERE email='admin@user.com';
-- Safe to run more than once: it does nothing if the demo events already exist.
-- Announcements and promos are NOT seeded because audio_url / video_url are NOT NULL and need real
-- uploaded files. Create those from the admin screens (or Postman) so the files exist on disk.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM events WHERE title = 'Umuganda Community Clean-Up') THEN
    RAISE NOTICE 'Seed data already present, skipping.';
    RETURN;
  END IF;

  -- Events: 4 upcoming, 1 past (for feedback), 1 draft (published = false, admin-only)
  INSERT INTO events (title, description, location, starts_at, ends_at, published) VALUES
   ('Umuganda Community Clean-Up', 'Monthly community work day. Bring gloves and water; tools are provided. All neighbours are welcome.', 'Kimironko Sector Grounds, Gasabo', '2026-11-28 08:00+02', '2026-11-28 11:00+02', true),
   ('Kigali Street Food Festival', 'Taste local and international dishes from over 30 vendors, with live music and family activities.', 'Car Free Zone, Kigali', '2026-12-12 12:00+02', '2026-12-12 21:00+02', true),
   ('City Open Data Workshop', 'Learn how to explore and visualise public city data. Beginners welcome. Bring a laptop.', 'Kigali Public Library', '2026-12-18 14:00+02', '2026-12-18 17:00+02', true),
   ('Youth Digital Skills Fair', 'Hands-on stations for coding, design and online safety, run by local tech volunteers.', 'Kigali Convention Centre', '2027-01-16 09:00+02', '2027-01-16 16:00+02', true),
   ('Neighbourhood Health Check Day', 'Free blood pressure, glucose and eye screening with local clinics.', 'Nyarugenge Health Centre', '2026-11-07 09:00+02', '2026-11-07 15:00+02', true),
   ('Mayor''s Town Hall (draft)', 'Open question session with city leadership. Not yet announced.', 'City Hall, Kigali', '2027-02-06 15:00+02', '2027-02-06 17:00+02', false);

  -- Registrations for the normal user
  INSERT INTO event_registrations (user_id, event_id)
  SELECT u.id, e.id FROM users u, events e
  WHERE u.email = 'test@user.com'
    AND e.title IN ('Umuganda Community Clean-Up', 'Kigali Street Food Festival', 'Neighbourhood Health Check Day')
  ON CONFLICT (user_id, event_id) DO NOTHING;

  -- Feedback on the past event (one per user per event)
  INSERT INTO event_feedback (user_id, event_id, rating, comment)
  SELECT u.id, e.id, 5, 'Well organised and the staff were friendly. The queue moved quickly.'
  FROM users u, events e
  WHERE u.email = 'test@user.com' AND e.title = 'Neighbourhood Health Check Day'
  ON CONFLICT (user_id, event_id) DO NOTHING;

  -- Broadcast notifications (recipient_id NULL) linked to events through metadata.event_id
  INSERT INTO notifications (title, message, type, recipient_id, metadata, created_by)
  SELECT 'New event: ' || e.title, 'Registration is open. Location: ' || e.location || '.', 'event', NULL,
         jsonb_build_object('event_id', e.id), (SELECT id FROM users WHERE email = 'admin@user.com')
  FROM events e
  WHERE e.title IN ('Kigali Street Food Festival', 'City Open Data Workshop', 'Youth Digital Skills Fair');

  INSERT INTO notifications (title, message, type, recipient_id, metadata, created_by)
  VALUES ('Welcome to CivicEvents+', 'Browse events, listen to announcements and watch promos from your city.', 'system', NULL, '{}',
          (SELECT id FROM users WHERE email = 'admin@user.com'));

  -- Targeted notification (only this user sees it)
  INSERT INTO notifications (title, message, type, recipient_id, metadata, created_by)
  SELECT 'Registration confirmed', 'You are registered for ' || e.title || '.', 'event', u.id,
         jsonb_build_object('event_id', e.id), (SELECT id FROM users WHERE email = 'admin@user.com')
  FROM users u, events e
  WHERE u.email = 'test@user.com' AND e.title = 'Umuganda Community Clean-Up';
END $$;