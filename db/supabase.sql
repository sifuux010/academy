-- =====================================================================
--  KINEDOK ACADÉMIE — DDL PostgreSQL / Supabase
--  ---------------------------------------------------------------------
--  Équivalent SQL de db/schema.prisma, avec les politiques de sécurité
--  au niveau ligne (RLS) adaptées à Supabase.
--
--  Ordre d'exécution :
--    1. extensions et types
--    2. tables de référence (taxonomies)
--    3. utilisateurs et profils
--    4. contenus
--    5. activité des membres
--    6. index de recherche
--    7. RLS
-- =====================================================================

-- 1. Extensions et types -----------------------------------------------

create extension if not exists "uuid-ossp";
create extension if not exists unaccent;
create extension if not exists pg_trgm;

create type role_t          as enum ('STUDENT','PHYSIOTHERAPIST','INSTRUCTOR','CONTENT_EDITOR','ADMIN','SUPER_ADMIN');
create type profile_type_t   as enum ('STUDENT','PHYSIOTHERAPIST');
create type user_status_t    as enum ('active','suspended','pending');
create type access_t         as enum ('free','premium');
create type level_t          as enum ('etudiant','debutant','intermediaire','avance','expert');
create type difficulty_t     as enum ('facile','modere','difficile');
create type lesson_type_t    as enum ('video','pdf','text','quiz');
create type tool_type_t      as enum ('test','questionnaire','score','bilan');
create type locale_t         as enum ('fr','en','ar');

-- 2. Taxonomies --------------------------------------------------------

create table body_regions (
  id    text primary key,          -- rachis, epaule, genou…
  sort  int  not null default 0
);

create table specialties (
  id    text primary key,          -- musculosquelettique, sport…
  sort  int  not null default 0
);

create table resource_categories (
  id    text primary key,          -- revue, article, protocole…
  sort  int  not null default 0
);

create table tags (
  id   uuid primary key default uuid_generate_v4(),
  slug text unique not null
);

-- 3. Utilisateurs ------------------------------------------------------
--  Avec Supabase Auth, auth.users porte l'identité et le mot de passe ;
--  public.profiles porte les données métier. La colonne id référence
--  auth.users(id).

create table profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text unique not null,
  first_name     text not null,
  last_name      text not null,
  phone          text,
  country        text,
  city           text,
  profile_type   profile_type_t not null,
  role           role_t not null default 'PHYSIOTHERAPIST',
  status         user_status_t not null default 'active',
  locale         locale_t not null default 'fr',
  avatar_url     text,
  bio            text,
  premium        boolean not null default false,
  newsletter     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  last_login_at  timestamptz
);
create index profiles_role_status_idx on profiles (role, status);

create table physiotherapist_profiles (
  user_id          uuid primary key references profiles(id) on delete cascade,
  prof_status      text,
  workplace        text,
  experience_years int,
  license_number   text,
  website          text,
  linkedin         text,
  expertise        text[] not null default '{}',
  languages        text[] not null default '{}'
);

create table student_profiles (
  user_id         uuid primary key references profiles(id) on delete cascade,
  university      text,
  academic_year   text,
  graduation_year int,
  interests       text[] not null default '{}',
  languages       text[] not null default '{}'
);

create table user_settings (
  user_id             uuid primary key references profiles(id) on delete cascade,
  notif_new_resources boolean not null default true,
  notif_new_courses   boolean not null default true,
  notif_webinars      boolean not null default true,
  notif_newsletter    boolean not null default false,
  notif_product       boolean not null default true,
  public_profile      boolean not null default false,
  show_email          boolean not null default false,
  allow_analytics     boolean not null default true
);

create table authors (
  id         uuid primary key default uuid_generate_v4(),
  slug       text unique not null,
  user_id    uuid references profiles(id) on delete set null,
  first_name text not null,
  last_name  text not null,
  title      text,
  bio        text,
  country    text,
  city       text,
  avatar_url text,
  expertise  text[] not null default '{}'
);

-- 4. Contenus ----------------------------------------------------------

create table pathologies (
  id            uuid primary key default uuid_generate_v4(),
  slug          text unique not null,
  name          text not null,
  summary       text not null,
  epidemiology  text,
  presentation  text[] not null default '{}',
  red_flags     text[] not null default '{}',
  management    text[] not null default '{}',
  key_facts     text[] not null default '{}',
  evidence      text,
  aliases       text[] not null default '{}',
  region_id     text not null references body_regions(id),
  specialty_id  text not null references specialties(id),
  published     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index pathologies_region_specialty_idx on pathologies (region_id, specialty_id);

create table resources (
  id             uuid primary key default uuid_generate_v4(),
  slug           text unique not null,
  title          text not null,
  subtitle       text,
  description    text not null,
  abstract       text,
  key_points     text[] not null default '{}',
  refs           text[] not null default '{}',
  category_id    text not null references resource_categories(id),
  author_id      uuid references authors(id) on delete set null,
  region_id      text references body_regions(id),
  specialty_id   text references specialties(id),
  level          level_t not null default 'intermediaire',
  language       locale_t not null default 'fr',
  access         access_t not null default 'free',
  file_url       text,
  file_format    text default 'pdf',
  file_size_kb   int,
  pages          int,
  views          int not null default 0,
  download_count int not null default 0,
  published      boolean not null default false,
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index resources_published_idx on resources (published, published_at desc);
create index resources_facets_idx on resources (category_id, region_id, specialty_id, level);

create table resource_pathologies (
  resource_id  uuid references resources(id) on delete cascade,
  pathology_id uuid references pathologies(id) on delete cascade,
  primary key (resource_id, pathology_id)
);

create table resource_tags (
  resource_id uuid references resources(id) on delete cascade,
  tag_id      uuid references tags(id) on delete cascade,
  primary key (resource_id, tag_id)
);

create table courses (
  id             uuid primary key default uuid_generate_v4(),
  slug           text unique not null,
  title          text not null,
  subtitle       text,
  description    text not null,
  objectives     text[] not null default '{}',
  audience       text,
  prerequisites  text[] not null default '{}',
  instructor_id  uuid references authors(id) on delete set null,
  region_id      text references body_regions(id),
  specialty_id   text references specialties(id),
  level          level_t not null default 'intermediaire',
  language       locale_t not null default 'fr',
  access         access_t not null default 'free',
  cover_url      text,
  duration_min   int not null default 0,
  certificate    boolean not null default true,
  rating_avg     numeric(2,1) not null default 0,
  rating_count   int not null default 0,
  enrolled_count int not null default 0,
  published      boolean not null default false,
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table course_pathologies (
  course_id    uuid references courses(id) on delete cascade,
  pathology_id uuid references pathologies(id) on delete cascade,
  primary key (course_id, pathology_id)
);

create table course_modules (
  id        uuid primary key default uuid_generate_v4(),
  course_id uuid not null references courses(id) on delete cascade,
  title     text not null,
  position  int not null default 0
);
create index course_modules_order_idx on course_modules (course_id, position);

create table lessons (
  id           uuid primary key default uuid_generate_v4(),
  module_id    uuid not null references course_modules(id) on delete cascade,
  title        text not null,
  type         lesson_type_t not null,
  duration_min int not null default 0,
  position     int not null default 0,
  content      text,
  video_url    text,
  resource_id  uuid references resources(id) on delete set null
);
create index lessons_order_idx on lessons (module_id, position);

create table quizzes (
  id         uuid primary key default uuid_generate_v4(),
  lesson_id  uuid unique not null references lessons(id) on delete cascade,
  pass_score int not null default 0
);

create table quiz_questions (
  id       uuid primary key default uuid_generate_v4(),
  quiz_id  uuid not null references quizzes(id) on delete cascade,
  prompt   text not null,
  position int not null default 0
);

create table quiz_answers (
  id          uuid primary key default uuid_generate_v4(),
  question_id uuid not null references quiz_questions(id) on delete cascade,
  label       text not null,
  is_correct  boolean not null default false,
  position    int not null default 0
);

create table webinars (
  id               uuid primary key default uuid_generate_v4(),
  slug             text unique not null,
  title            text not null,
  subtitle         text,
  description      text not null,
  agenda           text[] not null default '{}',
  speaker_id       uuid references authors(id) on delete set null,
  region_id        text references body_regions(id),
  specialty_id     text references specialties(id),
  starts_at        timestamptz not null,
  duration_min     int not null default 60,
  live_url         text,
  replay_url       text,
  access           access_t not null default 'free',
  certificate      boolean not null default true,
  registered_count int not null default 0,
  published        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index webinars_schedule_idx on webinars (published, starts_at);

create table webinar_pathologies (
  webinar_id   uuid references webinars(id) on delete cascade,
  pathology_id uuid references pathologies(id) on delete cascade,
  primary key (webinar_id, pathology_id)
);

create table clinical_tools (
  id                uuid primary key default uuid_generate_v4(),
  slug              text unique not null,
  name              text not null,
  subtitle          text,
  description       text not null,
  type              tool_type_t not null,
  purpose           text not null,
  indications       text[] not null default '{}',
  contraindications text[] not null default '{}',
  equipment         text[] not null default '{}',
  procedure         text[] not null default '{}',
  scoring           text,
  interpretation    text[] not null default '{}',
  psychometrics     text,
  refs              text[] not null default '{}',
  region_id         text references body_regions(id),
  specialty_id      text references specialties(id),
  access            access_t not null default 'free',
  file_url          text,
  file_format       text default 'pdf',
  file_size_kb      int,
  download_count    int not null default 0,
  published         boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index clinical_tools_facets_idx on clinical_tools (type, region_id, published);

create table tool_pathologies (
  tool_id      uuid references clinical_tools(id) on delete cascade,
  pathology_id uuid references pathologies(id) on delete cascade,
  primary key (tool_id, pathology_id)
);

create table exercises (
  id             uuid primary key default uuid_generate_v4(),
  slug           text unique not null,
  name           text not null,
  goal           text not null,
  region_id      text not null references body_regions(id),
  objective      text not null,
  difficulty     difficulty_t not null default 'facile',
  target_muscles text[] not null default '{}',
  equipment      text[] not null default '{}',
  steps          text[] not null default '{}',
  sets           text,
  reps           text,
  hold           text,
  frequency      text,
  progression    text,
  regression     text,
  precautions    text[] not null default '{}',
  video_url      text,
  image_url      text,
  refs           text[] not null default '{}',
  published      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index exercises_facets_idx on exercises (region_id, objective, difficulty);

create table exercise_pathologies (
  exercise_id  uuid references exercises(id) on delete cascade,
  pathology_id uuid references pathologies(id) on delete cascade,
  primary key (exercise_id, pathology_id)
);

create table exercise_tags (
  exercise_id uuid references exercises(id) on delete cascade,
  tag_id      uuid references tags(id) on delete cascade,
  primary key (exercise_id, tag_id)
);

create table translations (
  id           uuid primary key default uuid_generate_v4(),
  locale       locale_t not null,
  field        text not null,             -- title | subtitle | description | summary
  value        text not null,
  resource_id  uuid references resources(id) on delete cascade,
  course_id    uuid references courses(id) on delete cascade,
  webinar_id   uuid references webinars(id) on delete cascade,
  tool_id      uuid references clinical_tools(id) on delete cascade,
  exercise_id  uuid references exercises(id) on delete cascade,
  pathology_id uuid references pathologies(id) on delete cascade
);

-- 5. Activité des membres ---------------------------------------------

create table favorites (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  resource_id uuid references resources(id) on delete cascade,
  course_id   uuid references courses(id) on delete cascade,
  webinar_id  uuid references webinars(id) on delete cascade,
  tool_id     uuid references clinical_tools(id) on delete cascade,
  exercise_id uuid references exercises(id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint favorite_one_target check (
    ((resource_id is not null)::int + (course_id is not null)::int +
     (webinar_id is not null)::int + (tool_id is not null)::int +
     (exercise_id is not null)::int) = 1
  )
);
create index favorites_user_idx on favorites (user_id, created_at desc);
-- Unicité réelle : index partiels (NULL est distinct de NULL en SQL)
create unique index favorites_user_resource_uq on favorites (user_id, resource_id) where resource_id is not null;
create unique index favorites_user_course_uq   on favorites (user_id, course_id)   where course_id is not null;
create unique index favorites_user_webinar_uq  on favorites (user_id, webinar_id)  where webinar_id is not null;
create unique index favorites_user_tool_uq     on favorites (user_id, tool_id)     where tool_id is not null;
create unique index favorites_user_exercise_uq on favorites (user_id, exercise_id) where exercise_id is not null;

create table downloads (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  resource_id uuid references resources(id) on delete set null,
  tool_id     uuid references clinical_tools(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index downloads_user_idx on downloads (user_id, created_at desc);

create table resource_views (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references profiles(id) on delete set null,
  resource_id uuid not null references resources(id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index resource_views_idx on resource_views (resource_id, created_at desc);

create table enrollments (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references profiles(id) on delete cascade,
  course_id    uuid not null references courses(id) on delete cascade,
  created_at   timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, course_id)
);

create table lesson_progress (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references profiles(id) on delete cascade,
  lesson_id    uuid not null references lessons(id) on delete cascade,
  completed_at timestamptz,
  unique (user_id, lesson_id)
);

create table quiz_attempts (
  id         uuid primary key default uuid_generate_v4(),
  quiz_id    uuid not null references quizzes(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  score      int not null,
  total      int not null,
  passed     boolean not null,
  created_at timestamptz not null default now()
);

create table webinar_registrations (
  id          uuid primary key default uuid_generate_v4(),
  webinar_id  uuid not null references webinars(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  attended_at timestamptz,
  reminded_24 boolean not null default false,
  reminded_1  boolean not null default false,
  unique (webinar_id, user_id)
);

create table certificates (
  id        uuid primary key default uuid_generate_v4(),
  user_id   uuid not null references profiles(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  reference text unique not null,
  issued_at timestamptz not null default now(),
  pdf_url   text,
  unique (user_id, course_id)
);

create table reviews (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  course_id  uuid not null references courses(id) on delete cascade,
  rating     int not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table search_history (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  query      text not null,
  results    int not null default 0,
  created_at timestamptz not null default now()
);

create table notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  kind       text not null,
  title      text not null,
  body       text,
  url        text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create table analytics_events (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  user_id    uuid references profiles(id) on delete set null,
  locale     locale_t,
  payload    jsonb,
  created_at timestamptz not null default now()
);
create index analytics_events_idx on analytics_events (name, created_at desc);

-- Monétisation (préparation, non activée)
create table plans (
  id        uuid primary key default uuid_generate_v4(),
  slug      text unique not null,
  name      text not null,
  price_dzd int not null default 0,
  interval  text not null default 'month',
  features  text[] not null default '{}',
  active    boolean not null default false
);

create table subscriptions (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  plan_id    uuid not null references plans(id),
  status     text not null default 'inactive',
  started_at timestamptz not null default now(),
  ends_at    timestamptz,
  promo_code text
);

-- 6. Recherche plein texte --------------------------------------------

alter table resources add column search_fr tsvector
  generated always as (
    setweight(to_tsvector('french', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(subtitle, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(description, '')), 'C') ||
    setweight(to_tsvector('french', coalesce(abstract, '')), 'D')
  ) stored;
create index resources_search_fr_idx on resources using gin (search_fr);

alter table clinical_tools add column search_fr tsvector
  generated always as (
    setweight(to_tsvector('french', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(subtitle, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(description, '')), 'C') ||
    setweight(to_tsvector('french', coalesce(purpose, '')), 'D')
  ) stored;
create index clinical_tools_search_fr_idx on clinical_tools using gin (search_fr);

-- Les alias de pathologies doivent participer à la recherche : c'est ce qui
-- fait correspondre « tendinopathie rotulienne » à « tendinopathie patellaire ».
alter table pathologies add column search_fr tsvector
  generated always as (
    setweight(to_tsvector('french', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('french', array_to_string(aliases, ' ')), 'A') ||
    setweight(to_tsvector('french', coalesce(summary, '')), 'C')
  ) stored;
create index pathologies_search_fr_idx on pathologies using gin (search_fr);

-- 7. Sécurité au niveau ligne (RLS) -----------------------------------

-- Fonction utilitaire : rôle du membre courant
create or replace function current_role_level() returns int
language sql stable security definer as $$
  select case (select role from profiles where id = auth.uid())
    when 'SUPER_ADMIN'    then 50
    when 'ADMIN'          then 40
    when 'CONTENT_EDITOR' then 30
    when 'INSTRUCTOR'     then 20
    else 10 end;
$$;

-- Contenus : lecture publique des éléments publiés, écriture aux éditeurs
alter table resources      enable row level security;
alter table courses        enable row level security;
alter table webinars       enable row level security;
alter table clinical_tools enable row level security;
alter table exercises      enable row level security;
alter table pathologies    enable row level security;

create policy resources_read_published on resources
  for select using (published or current_role_level() >= 30);
create policy resources_write_editors on resources
  for all using (current_role_level() >= 30) with check (current_role_level() >= 30);

create policy courses_read_published on courses
  for select using (published or current_role_level() >= 30);
create policy courses_write_editors on courses
  for all using (current_role_level() >= 30) with check (current_role_level() >= 30);

create policy webinars_read_published on webinars
  for select using (published or current_role_level() >= 30);
create policy webinars_write_editors on webinars
  for all using (current_role_level() >= 30) with check (current_role_level() >= 30);

create policy tools_read_published on clinical_tools
  for select using (published or current_role_level() >= 30);
create policy tools_write_editors on clinical_tools
  for all using (current_role_level() >= 30) with check (current_role_level() >= 30);

create policy exercises_read_published on exercises
  for select using (published or current_role_level() >= 30);
create policy exercises_write_editors on exercises
  for all using (current_role_level() >= 30) with check (current_role_level() >= 30);

create policy pathologies_read_published on pathologies
  for select using (published or current_role_level() >= 30);
create policy pathologies_write_editors on pathologies
  for all using (current_role_level() >= 30) with check (current_role_level() >= 30);

-- Réponses de quiz : jamais lisibles par le client
alter table quiz_answers enable row level security;
create policy quiz_answers_editors_only on quiz_answers
  for select using (current_role_level() >= 30);

-- Profils : chacun le sien ; les administrateurs voient tout
alter table profiles enable row level security;
create policy profiles_self_read on profiles
  for select using (id = auth.uid() or public_profile_visible(id) or current_role_level() >= 40);
create policy profiles_self_update on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all on profiles
  for all using (current_role_level() >= 40) with check (current_role_level() >= 40);

create or replace function public_profile_visible(target uuid) returns boolean
language sql stable security definer as $$
  select coalesce((select public_profile from user_settings where user_id = target), false);
$$;

-- Activité : strictement personnelle
do $$
declare t text;
begin
  foreach t in array array[
    'favorites','downloads','enrollments','lesson_progress','quiz_attempts',
    'webinar_registrations','certificates','search_history','notifications',
    'user_settings','physiotherapist_profiles','student_profiles'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I_owner on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t, t);
  end loop;
end $$;

-- Note : `user_settings`, `physiotherapist_profiles` et `student_profiles`
-- utilisent `user_id` comme clé primaire ; la politique ci-dessus s'applique
-- donc telle quelle.
