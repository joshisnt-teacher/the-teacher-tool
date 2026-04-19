-- Resources table: stores teacher lesson resources (websites, videos, maps, etc.)
create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  teacher_id uuid not null references users(id) on delete cascade,
  title text not null,
  url text not null,
  description text,
  category text not null,
  access_notes text,
  how_to_use text,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_resources_school_id on resources(school_id);
create index if not exists idx_resources_teacher_id on resources(teacher_id);

alter table resources enable row level security;

create policy "Teachers can view resources in their school"
  on resources for select
  using (school_id in (
    select school_id from users where id = auth.uid()
  ));

create policy "Teachers can create resources"
  on resources for insert
  with check (teacher_id = auth.uid());

create policy "Teachers can update their own resources"
  on resources for update
  using (teacher_id = auth.uid());

create policy "Teachers can delete their own resources"
  on resources for delete
  using (teacher_id = auth.uid());

-- Auto-update updated_at on change
create or replace function update_resources_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger resources_updated_at
  before update on resources
  for each row
  execute function update_resources_updated_at();

-- class_resources: links a resource to a class so it appears in the Classroom view
create table if not exists class_resources (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  resource_id uuid not null references resources(id) on delete cascade,
  teacher_id uuid not null references users(id) on delete cascade,
  status text not null default 'created' check (status in ('created', 'active', 'closed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(class_id, resource_id)
);

create index if not exists idx_class_resources_class_id on class_resources(class_id);
create index if not exists idx_class_resources_resource_id on class_resources(resource_id);

alter table class_resources enable row level security;

create policy "Teachers can view class_resources for their classes"
  on class_resources for select
  using (class_id in (
    select id from classes where teacher_id = auth.uid()
  ));

create policy "Teachers can create class_resources"
  on class_resources for insert
  with check (teacher_id = auth.uid());

create policy "Teachers can update their own class_resources"
  on class_resources for update
  using (teacher_id = auth.uid());

create policy "Teachers can delete their own class_resources"
  on class_resources for delete
  using (teacher_id = auth.uid());
