-- ============================================================================
-- DailyOS — demo / seed data
--
-- Rows must belong to a real auth user. This script inserts a set of realistic
-- demo items for the MOST RECENTLY CREATED user in your project.
--
-- 1. Sign up in the app first (so an auth user exists).
-- 2. Run this in the Supabase SQL editor.
--
-- Re-running clears the previous demo rows (tagged in processing_logs) before
-- inserting fresh ones.
-- ============================================================================

do $$
declare
  uid uuid;
  flight_id uuid := gen_random_uuid();
  receipt_id uuid := gen_random_uuid();
  warranty_id uuid := gen_random_uuid();
  school_id uuid := gen_random_uuid();
begin
  select id into uid from auth.users order by created_at desc limit 1;
  if uid is null then
    raise notice 'No auth users found. Sign up in the app first, then re-run.';
    return;
  end if;

  -- Clean previous demo rows for this user.
  delete from public.inbox_items where user_id = uid and title like '[Demo]%';
  delete from public.extracted_tasks where user_id = uid
    and inbox_item_id is null and description = 'Demo seed';
  delete from public.calendar_events where user_id = uid
    and inbox_item_id is null and description = 'Demo seed';

  -- ----- 1. Flight booking (approved) -------------------------------------
  insert into public.inbox_items (id, user_id, title, input_type, original_text,
    status, item_type, summary, raw_ai_json)
  values (flight_id, uid, '[Demo] Flight to Lisbon', 'text',
    'TAP Air Portugal booking confirmation. Ref TP8842K. London Gatwick (LGW) to Lisbon (LIS) on 12 July 2026, departing 09:40, arriving 12:15. Passenger: Alex Jain. Seat 14C.',
    'approved', 'travel',
    'TAP flight from London Gatwick to Lisbon on 12 Jul, departing 09:40. Booking ref TP8842K.',
    jsonb_build_object(
      'item_type','travel',
      'summary','TAP flight from London Gatwick to Lisbon on 12 Jul, departing 09:40.',
      'vault_category','travel',
      'entities', jsonb_build_object('people', jsonb_build_array('Alex Jain'),
        'companies', jsonb_build_array('TAP Air Portugal'),
        'places', jsonb_build_array('London Gatwick','Lisbon'),
        'prices', jsonb_build_array(),
        'reference_numbers', jsonb_build_array('TP8842K')),
      'key_dates', jsonb_build_array(jsonb_build_object('date','2026-07-12','time','09:40','description','Departure from LGW'))
    ));

  insert into public.calendar_events (user_id, inbox_item_id, title, description, start_time, location)
  values (uid, flight_id, 'Flight to Lisbon (TP8842K)', 'Seat 14C',
    '2026-07-12 09:40:00+01', 'London Gatwick (LGW)');

  insert into public.extracted_tasks (user_id, inbox_item_id, title, due_date, priority, status)
  values (uid, flight_id, 'Check in for TAP flight to Lisbon', '2026-07-11', 'high', 'pending');

  insert into public.vault_items (user_id, inbox_item_id, category, title, summary)
  values (uid, flight_id, 'travel', '[Demo] Flight to Lisbon',
    'TAP flight from London Gatwick to Lisbon on 12 Jul, departing 09:40.');

  -- ----- 2. Receipt (approved) --------------------------------------------
  insert into public.inbox_items (id, user_id, title, input_type, original_text,
    status, item_type, summary, raw_ai_json)
  values (receipt_id, uid, '[Demo] Currys receipt — Dyson V11', 'text',
    'Currys PC World. Receipt #9921-AB. Dyson V11 Absolute vacuum, £429.00. Paid by Visa ending 4412 on 03 June 2026. 30-day returns.',
    'approved', 'receipt',
    'Bought a Dyson V11 Absolute from Currys for £429.00 on 3 Jun. 30-day return window.',
    jsonb_build_object('item_type','receipt','summary','Bought a Dyson V11 Absolute from Currys for £429.00.',
      'vault_category','purchases',
      'entities', jsonb_build_object('people', jsonb_build_array(),
        'companies', jsonb_build_array('Currys PC World'),
        'places', jsonb_build_array(), 'prices', jsonb_build_array('£429.00'),
        'reference_numbers', jsonb_build_array('9921-AB')),
      'key_dates', jsonb_build_array()));

  insert into public.vault_items (user_id, inbox_item_id, category, title, summary)
  values (uid, receipt_id, 'purchases', '[Demo] Currys receipt — Dyson V11',
    'Bought a Dyson V11 Absolute from Currys for £429.00 on 3 Jun.');

  -- ----- 3. Warranty (needs review) ---------------------------------------
  insert into public.inbox_items (id, user_id, title, input_type, original_text,
    status, item_type, summary, raw_ai_json)
  values (warranty_id, uid, '[Demo] Boiler warranty', 'text',
    'Worcester Bosch Greenstar boiler. 10-year guarantee registered 15 May 2024. Annual service required to keep guarantee valid. Policy GB-554210.',
    'review', 'warranty',
    'Worcester Bosch boiler with a 10-year guarantee. Needs an annual service to stay valid.',
    jsonb_build_object('item_type','warranty','summary','Worcester Bosch boiler with a 10-year guarantee. Annual service required.',
      'vault_category','home',
      'entities', jsonb_build_object('people', jsonb_build_array(),
        'companies', jsonb_build_array('Worcester Bosch'),
        'places', jsonb_build_array(), 'prices', jsonb_build_array(),
        'reference_numbers', jsonb_build_array('GB-554210')),
      'key_dates', jsonb_build_array(jsonb_build_object('date','2024-05-15','time',null,'description','Guarantee registered')),
      'suggested_tasks', jsonb_build_array(jsonb_build_object('title','Book annual boiler service','description','Keeps the 10-year guarantee valid','due_date','2026-05-01','priority','medium')),
      'suggested_calendar_events', jsonb_build_array()));

  -- ----- 4. School letter (needs review) ----------------------------------
  insert into public.inbox_items (id, user_id, title, input_type, original_text,
    status, item_type, summary, raw_ai_json)
  values (school_id, uid, '[Demo] School parents evening', 'text',
    'Oakfield Primary School. Parents evening on Thursday 9 July 2026, 16:00-18:30. Please book a slot via the school portal by 2 July. Bring your child''s reading record.',
    'review', 'school',
    'Oakfield Primary parents evening on 9 Jul, 16:00. Book a slot by 2 Jul.',
    jsonb_build_object('item_type','school','summary','Oakfield Primary parents evening on 9 Jul, 16:00. Book a slot by 2 Jul.',
      'vault_category','school',
      'entities', jsonb_build_object('people', jsonb_build_array(),
        'companies', jsonb_build_array('Oakfield Primary School'),
        'places', jsonb_build_array(), 'prices', jsonb_build_array(),
        'reference_numbers', jsonb_build_array()),
      'key_dates', jsonb_build_array(jsonb_build_object('date','2026-07-09','time','16:00','description','Parents evening')),
      'suggested_tasks', jsonb_build_array(jsonb_build_object('title','Book parents evening slot','description','Via the school portal','due_date','2026-07-02','priority','high')),
      'suggested_calendar_events', jsonb_build_array(jsonb_build_object('title','Parents evening — Oakfield Primary','description',null,'start_time','2026-07-09T16:00:00','end_time','2026-07-09T18:30:00','location','Oakfield Primary School'))));

  -- ----- A couple of standalone tasks/events for a lived-in feel ----------
  insert into public.extracted_tasks (user_id, title, description, due_date, priority, status)
  values
    (uid, 'Renew car insurance', 'Demo seed', current_date + 3, 'high', 'pending'),
    (uid, 'Cancel free trial before it renews', 'Demo seed', current_date, 'medium', 'pending'),
    (uid, 'Send passport photos for renewal', 'Demo seed', current_date - 1, 'low', 'pending');

  insert into public.calendar_events (user_id, title, description, start_time, location)
  values
    (uid, 'Dentist check-up', 'Demo seed', (current_date + 2)::timestamp + time '10:30', 'Bright Smiles Dental'),
    (uid, 'Council tax direct debit', 'Demo seed', (current_date + 5)::timestamp + time '09:00', null);

  raise notice 'Seeded demo data for user %', uid;
end $$;
