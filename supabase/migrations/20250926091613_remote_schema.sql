create type "public"."tag_type" as enum ('concept', 'capability', 'blooms_taxonomy');

create table "public"."achievement_standard" (
    "id" uuid not null default gen_random_uuid(),
    "curriculum_id" uuid not null,
    "description" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."achievement_standard" enable row level security;

create table "public"."classes" (
    "id" uuid not null default gen_random_uuid(),
    "class_name" text not null,
    "year_level" text not null,
    "subject" text not null,
    "term" text not null,
    "start_date" date not null,
    "end_date" date not null,
    "teacher_id" uuid not null,
    "school_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "curriculum_id" uuid
);


alter table "public"."classes" enable row level security;

create table "public"."content_item" (
    "id" uuid not null default gen_random_uuid(),
    "strand_id" uuid not null,
    "code" text not null,
    "description" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "display_code" text
);


alter table "public"."content_item" enable row level security;

create table "public"."content_item_tag" (
    "content_item_id" uuid not null,
    "tag_id" uuid not null
);


alter table "public"."content_item_tag" enable row level security;

create table "public"."curriculum" (
    "id" uuid not null default gen_random_uuid(),
    "authority" text not null,
    "learning_area" text not null,
    "year_band" text not null,
    "version" text not null,
    "year_level_description" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."curriculum" enable row level security;

create table "public"."dashboard_layouts" (
    "id" uuid not null default gen_random_uuid(),
    "teacher_id" uuid not null,
    "class_id" uuid not null,
    "name" text not null default 'Default Layout'::text,
    "is_default" boolean not null default true,
    "layout_config" jsonb not null default '[]'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."dashboard_layouts" enable row level security;

create table "public"."dashboard_widgets" (
    "id" uuid not null default gen_random_uuid(),
    "layout_id" uuid not null,
    "widget_type" text not null,
    "title" text not null,
    "data_source" text not null,
    "filters" jsonb not null default '{}'::jsonb,
    "position" jsonb not null default '{}'::jsonb,
    "config" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."dashboard_widgets" enable row level security;

create table "public"."enrolments" (
    "class_id" uuid not null,
    "student_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."enrolments" enable row level security;

create table "public"."question_results" (
    "id" uuid not null default gen_random_uuid(),
    "question_id" uuid not null,
    "student_id" uuid not null,
    "raw_score" numeric,
    "percent_score" numeric,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."question_results" enable row level security;

create table "public"."questions" (
    "id" uuid not null default gen_random_uuid(),
    "task_id" uuid not null,
    "number" integer not null,
    "question" text,
    "max_score" numeric,
    "question_type" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "content_item" text,
    "general_capabilities" text[],
    "blooms_taxonomy" text
);


alter table "public"."questions" enable row level security;

create table "public"."results" (
    "id" uuid not null default gen_random_uuid(),
    "student_id" uuid not null,
    "task_id" uuid not null,
    "raw_score" numeric(10,2),
    "percent_score" numeric(5,2),
    "normalised_percent" numeric(5,2),
    "feedback" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."results" enable row level security;

create table "public"."schools" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "domain" text,
    "logo_url" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."schools" enable row level security;

create table "public"."strand" (
    "id" uuid not null default gen_random_uuid(),
    "curriculum_id" uuid not null,
    "name" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."strand" enable row level security;

create table "public"."student_responses" (
    "id" uuid not null default gen_random_uuid(),
    "task_id" uuid,
    "student_id" uuid,
    "confidence_rating" integer,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."student_responses" enable row level security;

create table "public"."students" (
    "id" uuid not null default gen_random_uuid(),
    "class_id" uuid not null,
    "student_id" text not null,
    "first_name" text not null,
    "last_name" text not null,
    "email" text,
    "year_level" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."students" enable row level security;

create table "public"."tag" (
    "id" uuid not null default gen_random_uuid(),
    "type" tag_type not null,
    "name" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."tag" enable row level security;

create table "public"."tasks" (
    "id" uuid not null default gen_random_uuid(),
    "class_id" uuid not null,
    "name" text not null,
    "task_type" text,
    "weight_percent" numeric(5,2),
    "due_date" date,
    "max_score" numeric(10,2),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "description" text,
    "assessment_format" text,
    "blooms_taxonomy" text,
    "key_skill" text,
    "content_item_id" uuid,
    "is_legacy" boolean default false
);


alter table "public"."tasks" enable row level security;

create table "public"."users" (
    "id" uuid not null,
    "email" text not null,
    "name" text,
    "role" text not null default 'TEACHER'::text,
    "school_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."users" enable row level security;

CREATE UNIQUE INDEX achievement_standard_curriculum_uniq ON public.achievement_standard USING btree (curriculum_id);

CREATE UNIQUE INDEX achievement_standard_pkey ON public.achievement_standard USING btree (id);

CREATE UNIQUE INDEX classes_pkey ON public.classes USING btree (id);

CREATE UNIQUE INDEX content_item_no_exact_dupes ON public.content_item USING btree (strand_id, display_code, description);

CREATE UNIQUE INDEX content_item_pkey ON public.content_item USING btree (id);

CREATE UNIQUE INDEX content_item_tag_pkey ON public.content_item_tag USING btree (content_item_id, tag_id);

CREATE UNIQUE INDEX curriculum_pkey ON public.curriculum USING btree (id);

CREATE UNIQUE INDEX curriculum_uniq ON public.curriculum USING btree (authority, learning_area, year_band, version);

CREATE UNIQUE INDEX dashboard_layouts_pkey ON public.dashboard_layouts USING btree (id);

CREATE UNIQUE INDEX dashboard_widgets_pkey ON public.dashboard_widgets USING btree (id);

CREATE UNIQUE INDEX enrolments_pkey ON public.enrolments USING btree (class_id, student_id);

CREATE INDEX idx_achievement_standard_curriculum_id ON public.achievement_standard USING btree (curriculum_id);

CREATE INDEX idx_classes_curriculum_id ON public.classes USING btree (curriculum_id);

CREATE INDEX idx_classes_school_id ON public.classes USING btree (school_id);

CREATE INDEX idx_classes_teacher_id ON public.classes USING btree (teacher_id);

CREATE INDEX idx_content_item_code ON public.content_item USING btree (code);

CREATE INDEX idx_content_item_display_code ON public.content_item USING btree (display_code);

CREATE INDEX idx_content_item_strand_id ON public.content_item USING btree (strand_id);

CREATE INDEX idx_content_item_tag_content_item_id ON public.content_item_tag USING btree (content_item_id);

CREATE INDEX idx_content_item_tag_tag_id ON public.content_item_tag USING btree (tag_id);

CREATE INDEX idx_curriculum_learning_area_year_band ON public.curriculum USING btree (learning_area, year_band);

CREATE INDEX idx_dashboard_layouts_teacher_class ON public.dashboard_layouts USING btree (teacher_id, class_id);

CREATE INDEX idx_dashboard_widgets_layout ON public.dashboard_widgets USING btree (layout_id);

CREATE INDEX idx_question_results_question_id ON public.question_results USING btree (question_id);

CREATE INDEX idx_question_results_student_id ON public.question_results USING btree (student_id);

CREATE INDEX idx_questions_task_id ON public.questions USING btree (task_id);

CREATE INDEX idx_strand_curriculum_id ON public.strand USING btree (curriculum_id);

CREATE INDEX idx_tag_type ON public.tag USING btree (type);

CREATE UNIQUE INDEX question_results_pkey ON public.question_results USING btree (id);

CREATE UNIQUE INDEX question_results_question_id_student_id_key ON public.question_results USING btree (question_id, student_id);

CREATE UNIQUE INDEX questions_pkey ON public.questions USING btree (id);

CREATE UNIQUE INDEX results_pkey ON public.results USING btree (id);

CREATE UNIQUE INDEX results_student_id_task_id_key ON public.results USING btree (student_id, task_id);

CREATE UNIQUE INDEX schools_pkey ON public.schools USING btree (id);

CREATE UNIQUE INDEX strand_pkey ON public.strand USING btree (id);

CREATE UNIQUE INDEX strand_uniq ON public.strand USING btree (curriculum_id, name);

CREATE UNIQUE INDEX student_responses_pkey ON public.student_responses USING btree (id);

CREATE UNIQUE INDEX student_responses_task_id_student_id_key ON public.student_responses USING btree (task_id, student_id);

CREATE UNIQUE INDEX students_class_id_student_id_key ON public.students USING btree (class_id, student_id);

CREATE UNIQUE INDEX students_pkey ON public.students USING btree (id);

CREATE UNIQUE INDEX tag_pkey ON public.tag USING btree (id);

CREATE UNIQUE INDEX tag_type_name_uniq ON public.tag USING btree (type, name);

CREATE UNIQUE INDEX tasks_pkey ON public.tasks USING btree (id);

CREATE UNIQUE INDEX uq_question_results_student ON public.question_results USING btree (question_id, student_id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."achievement_standard" add constraint "achievement_standard_pkey" PRIMARY KEY using index "achievement_standard_pkey";

alter table "public"."classes" add constraint "classes_pkey" PRIMARY KEY using index "classes_pkey";

alter table "public"."content_item" add constraint "content_item_pkey" PRIMARY KEY using index "content_item_pkey";

alter table "public"."content_item_tag" add constraint "content_item_tag_pkey" PRIMARY KEY using index "content_item_tag_pkey";

alter table "public"."curriculum" add constraint "curriculum_pkey" PRIMARY KEY using index "curriculum_pkey";

alter table "public"."dashboard_layouts" add constraint "dashboard_layouts_pkey" PRIMARY KEY using index "dashboard_layouts_pkey";

alter table "public"."dashboard_widgets" add constraint "dashboard_widgets_pkey" PRIMARY KEY using index "dashboard_widgets_pkey";

alter table "public"."enrolments" add constraint "enrolments_pkey" PRIMARY KEY using index "enrolments_pkey";

alter table "public"."question_results" add constraint "question_results_pkey" PRIMARY KEY using index "question_results_pkey";

alter table "public"."questions" add constraint "questions_pkey" PRIMARY KEY using index "questions_pkey";

alter table "public"."results" add constraint "results_pkey" PRIMARY KEY using index "results_pkey";

alter table "public"."schools" add constraint "schools_pkey" PRIMARY KEY using index "schools_pkey";

alter table "public"."strand" add constraint "strand_pkey" PRIMARY KEY using index "strand_pkey";

alter table "public"."student_responses" add constraint "student_responses_pkey" PRIMARY KEY using index "student_responses_pkey";

alter table "public"."students" add constraint "students_pkey" PRIMARY KEY using index "students_pkey";

alter table "public"."tag" add constraint "tag_pkey" PRIMARY KEY using index "tag_pkey";

alter table "public"."tasks" add constraint "tasks_pkey" PRIMARY KEY using index "tasks_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."achievement_standard" add constraint "achievement_standard_curriculum_id_fkey" FOREIGN KEY (curriculum_id) REFERENCES curriculum(id) ON DELETE CASCADE not valid;

alter table "public"."achievement_standard" validate constraint "achievement_standard_curriculum_id_fkey";

alter table "public"."achievement_standard" add constraint "achievement_standard_curriculum_uniq" UNIQUE using index "achievement_standard_curriculum_uniq";

alter table "public"."classes" add constraint "classes_curriculum_id_fkey" FOREIGN KEY (curriculum_id) REFERENCES curriculum(id) ON DELETE SET NULL not valid;

alter table "public"."classes" validate constraint "classes_curriculum_id_fkey";

alter table "public"."classes" add constraint "classes_dates_check" CHECK ((end_date > start_date)) not valid;

alter table "public"."classes" validate constraint "classes_dates_check";

alter table "public"."content_item" add constraint "content_item_no_exact_dupes" UNIQUE using index "content_item_no_exact_dupes";

alter table "public"."content_item" add constraint "content_item_strand_id_fkey" FOREIGN KEY (strand_id) REFERENCES strand(id) ON DELETE CASCADE not valid;

alter table "public"."content_item" validate constraint "content_item_strand_id_fkey";

alter table "public"."content_item_tag" add constraint "content_item_tag_content_item_id_fkey" FOREIGN KEY (content_item_id) REFERENCES content_item(id) ON DELETE CASCADE not valid;

alter table "public"."content_item_tag" validate constraint "content_item_tag_content_item_id_fkey";

alter table "public"."content_item_tag" add constraint "content_item_tag_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE not valid;

alter table "public"."content_item_tag" validate constraint "content_item_tag_tag_id_fkey";

alter table "public"."curriculum" add constraint "curriculum_uniq" UNIQUE using index "curriculum_uniq";

alter table "public"."dashboard_layouts" add constraint "fk_dashboard_layouts_class" FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE not valid;

alter table "public"."dashboard_layouts" validate constraint "fk_dashboard_layouts_class";

alter table "public"."dashboard_layouts" add constraint "fk_dashboard_layouts_teacher" FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."dashboard_layouts" validate constraint "fk_dashboard_layouts_teacher";

alter table "public"."dashboard_widgets" add constraint "dashboard_widgets_widget_type_check" CHECK ((widget_type = ANY (ARRAY['kpi'::text, 'line_chart'::text, 'bar_chart'::text, 'pie_chart'::text, 'heatmap'::text, 'markdown'::text]))) not valid;

alter table "public"."dashboard_widgets" validate constraint "dashboard_widgets_widget_type_check";

alter table "public"."dashboard_widgets" add constraint "fk_dashboard_widgets_layout" FOREIGN KEY (layout_id) REFERENCES dashboard_layouts(id) ON DELETE CASCADE not valid;

alter table "public"."dashboard_widgets" validate constraint "fk_dashboard_widgets_layout";

alter table "public"."question_results" add constraint "fk_question_results_question" FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE not valid;

alter table "public"."question_results" validate constraint "fk_question_results_question";

alter table "public"."question_results" add constraint "question_results_question_id_fkey" FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE not valid;

alter table "public"."question_results" validate constraint "question_results_question_id_fkey";

alter table "public"."question_results" add constraint "question_results_question_id_student_id_key" UNIQUE using index "question_results_question_id_student_id_key";

alter table "public"."question_results" add constraint "question_results_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE not valid;

alter table "public"."question_results" validate constraint "question_results_student_id_fkey";

alter table "public"."question_results" add constraint "uq_question_results_student" UNIQUE using index "uq_question_results_student";

alter table "public"."questions" add constraint "questions_task_id_fkey" FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE not valid;

alter table "public"."questions" validate constraint "questions_task_id_fkey";

alter table "public"."results" add constraint "results_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE not valid;

alter table "public"."results" validate constraint "results_student_id_fkey";

alter table "public"."results" add constraint "results_student_id_task_id_key" UNIQUE using index "results_student_id_task_id_key";

alter table "public"."results" add constraint "results_task_id_fkey" FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE not valid;

alter table "public"."results" validate constraint "results_task_id_fkey";

alter table "public"."strand" add constraint "strand_curriculum_id_fkey" FOREIGN KEY (curriculum_id) REFERENCES curriculum(id) ON DELETE CASCADE not valid;

alter table "public"."strand" validate constraint "strand_curriculum_id_fkey";

alter table "public"."strand" add constraint "strand_uniq" UNIQUE using index "strand_uniq";

alter table "public"."student_responses" add constraint "student_responses_confidence_rating_check" CHECK (((confidence_rating >= 1) AND (confidence_rating <= 10))) not valid;

alter table "public"."student_responses" validate constraint "student_responses_confidence_rating_check";

alter table "public"."student_responses" add constraint "student_responses_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE not valid;

alter table "public"."student_responses" validate constraint "student_responses_student_id_fkey";

alter table "public"."student_responses" add constraint "student_responses_task_id_fkey" FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE not valid;

alter table "public"."student_responses" validate constraint "student_responses_task_id_fkey";

alter table "public"."student_responses" add constraint "student_responses_task_id_student_id_key" UNIQUE using index "student_responses_task_id_student_id_key";

alter table "public"."students" add constraint "students_class_id_fkey" FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE not valid;

alter table "public"."students" validate constraint "students_class_id_fkey";

alter table "public"."students" add constraint "students_class_id_student_id_key" UNIQUE using index "students_class_id_student_id_key";

alter table "public"."tag" add constraint "tag_type_name_uniq" UNIQUE using index "tag_type_name_uniq";

alter table "public"."tasks" add constraint "tasks_class_id_fkey" FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE not valid;

alter table "public"."tasks" validate constraint "tasks_class_id_fkey";

alter table "public"."tasks" add constraint "tasks_content_item_id_fkey" FOREIGN KEY (content_item_id) REFERENCES content_item(id) not valid;

alter table "public"."tasks" validate constraint "tasks_content_item_id_fkey";

alter table "public"."tasks" add constraint "tasks_task_type_check" CHECK ((task_type = ANY (ARRAY['Diagnostic'::text, 'Formative'::text, 'Summative'::text]))) not valid;

alter table "public"."tasks" validate constraint "tasks_task_type_check";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."users" add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_id_fkey";

alter table "public"."users" add constraint "users_role_check" CHECK ((role = ANY (ARRAY['ADMIN'::text, 'HOLA'::text, 'TEACHER'::text]))) not valid;

alter table "public"."users" validate constraint "users_role_check";

alter table "public"."users" add constraint "users_school_id_fkey" FOREIGN KEY (school_id) REFERENCES schools(id) not valid;

alter table "public"."users" validate constraint "users_school_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  demo_school_id UUID;
BEGIN
  -- Get Demo College school ID
  SELECT id INTO demo_school_id FROM public.schools WHERE name = 'Demo College' LIMIT 1;
  
  -- Insert user profile
  INSERT INTO public.users (id, email, name, role, school_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'TEACHER',
    demo_school_id
  );
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

create policy "Users can view achievement standard data"
on "public"."achievement_standard"
as permissive
for select
to public
using ((auth.uid() IS NOT NULL));


create policy "Teachers can create their own classes"
on "public"."classes"
as permissive
for insert
to public
with check ((teacher_id = auth.uid()));


create policy "Teachers can delete their own classes"
on "public"."classes"
as permissive
for delete
to public
using ((teacher_id = auth.uid()));


create policy "Teachers can update their own classes"
on "public"."classes"
as permissive
for update
to public
using ((teacher_id = auth.uid()));


create policy "Teachers can view their own classes"
on "public"."classes"
as permissive
for select
to public
using ((teacher_id = auth.uid()));


create policy "Users can view content item data"
on "public"."content_item"
as permissive
for select
to public
using ((auth.uid() IS NOT NULL));


create policy "Users can view content item tag data"
on "public"."content_item_tag"
as permissive
for select
to public
using ((auth.uid() IS NOT NULL));


create policy "Users can view curriculum data"
on "public"."curriculum"
as permissive
for select
to public
using ((auth.uid() IS NOT NULL));


create policy "Teachers can create their own dashboard layouts"
on "public"."dashboard_layouts"
as permissive
for insert
to public
with check ((teacher_id = auth.uid()));


create policy "Teachers can delete their own dashboard layouts"
on "public"."dashboard_layouts"
as permissive
for delete
to public
using ((teacher_id = auth.uid()));


create policy "Teachers can update their own dashboard layouts"
on "public"."dashboard_layouts"
as permissive
for update
to public
using ((teacher_id = auth.uid()));


create policy "Teachers can view their own dashboard layouts"
on "public"."dashboard_layouts"
as permissive
for select
to public
using ((teacher_id = auth.uid()));


create policy "Teachers can create widgets in their layouts"
on "public"."dashboard_widgets"
as permissive
for insert
to public
with check ((layout_id IN ( SELECT dashboard_layouts.id
   FROM dashboard_layouts
  WHERE (dashboard_layouts.teacher_id = auth.uid()))));


create policy "Teachers can delete widgets in their layouts"
on "public"."dashboard_widgets"
as permissive
for delete
to public
using ((layout_id IN ( SELECT dashboard_layouts.id
   FROM dashboard_layouts
  WHERE (dashboard_layouts.teacher_id = auth.uid()))));


create policy "Teachers can update widgets in their layouts"
on "public"."dashboard_widgets"
as permissive
for update
to public
using ((layout_id IN ( SELECT dashboard_layouts.id
   FROM dashboard_layouts
  WHERE (dashboard_layouts.teacher_id = auth.uid()))));


create policy "Teachers can view widgets in their layouts"
on "public"."dashboard_widgets"
as permissive
for select
to public
using ((layout_id IN ( SELECT dashboard_layouts.id
   FROM dashboard_layouts
  WHERE (dashboard_layouts.teacher_id = auth.uid()))));


create policy "Teachers can create enrolments in their classes"
on "public"."enrolments"
as permissive
for insert
to public
with check ((class_id IN ( SELECT c.id
   FROM classes c
  WHERE (c.teacher_id = auth.uid()))));


create policy "Teachers can delete enrolments in their classes"
on "public"."enrolments"
as permissive
for delete
to public
using ((class_id IN ( SELECT c.id
   FROM classes c
  WHERE (c.teacher_id = auth.uid()))));


create policy "Teachers can update enrolments in their classes"
on "public"."enrolments"
as permissive
for update
to public
using ((class_id IN ( SELECT c.id
   FROM classes c
  WHERE (c.teacher_id = auth.uid()))));


create policy "Teachers can view enrolments in their classes"
on "public"."enrolments"
as permissive
for select
to public
using ((class_id IN ( SELECT c.id
   FROM classes c
  WHERE (c.teacher_id = auth.uid()))));


create policy "Teachers can create question results in their classes"
on "public"."question_results"
as permissive
for insert
to public
with check ((student_id IN ( SELECT s.id
   FROM (students s
     JOIN classes c ON ((s.class_id = c.id)))
  WHERE (c.teacher_id = auth.uid()))));


create policy "Teachers can delete question results in their classes"
on "public"."question_results"
as permissive
for delete
to public
using ((student_id IN ( SELECT s.id
   FROM (students s
     JOIN classes c ON ((s.class_id = c.id)))
  WHERE (c.teacher_id = auth.uid()))));


create policy "Teachers can update question results in their classes"
on "public"."question_results"
as permissive
for update
to public
using ((student_id IN ( SELECT s.id
   FROM (students s
     JOIN classes c ON ((s.class_id = c.id)))
  WHERE (c.teacher_id = auth.uid()))));


create policy "Teachers can view question results in their classes"
on "public"."question_results"
as permissive
for select
to public
using ((student_id IN ( SELECT s.id
   FROM (students s
     JOIN classes c ON ((s.class_id = c.id)))
  WHERE (c.teacher_id = auth.uid()))));


create policy "Teachers can create questions in their classes"
on "public"."questions"
as permissive
for insert
to public
with check ((task_id IN ( SELECT t.id
   FROM (tasks t
     JOIN classes c ON ((t.class_id = c.id)))
  WHERE (c.teacher_id = auth.uid()))));


create policy "Teachers can delete questions in their classes"
on "public"."questions"
as permissive
for delete
to public
using ((task_id IN ( SELECT t.id
   FROM (tasks t
     JOIN classes c ON ((t.class_id = c.id)))
  WHERE (c.teacher_id = auth.uid()))));


create policy "Teachers can update questions in their classes"
on "public"."questions"
as permissive
for update
to public
using ((task_id IN ( SELECT t.id
   FROM (tasks t
     JOIN classes c ON ((t.class_id = c.id)))
  WHERE (c.teacher_id = auth.uid()))));


create policy "Teachers can view questions in their classes"
on "public"."questions"
as permissive
for select
to public
using ((task_id IN ( SELECT t.id
   FROM (tasks t
     JOIN classes c ON ((t.class_id = c.id)))
  WHERE (c.teacher_id = auth.uid()))));


create policy "Teachers can create results in their classes"
on "public"."results"
as permissive
for insert
to public
with check ((student_id IN ( SELECT s.id
   FROM (students s
     JOIN classes c ON ((s.class_id = c.id)))
  WHERE (c.teacher_id = auth.uid()))));


create policy "Teachers can delete results in their classes"
on "public"."results"
as permissive
for delete
to public
using ((student_id IN ( SELECT s.id
   FROM (students s
     JOIN classes c ON ((s.class_id = c.id)))
  WHERE (c.teacher_id = auth.uid()))));


create policy "Teachers can update results in their classes"
on "public"."results"
as permissive
for update
to public
using ((student_id IN ( SELECT s.id
   FROM (students s
     JOIN classes c ON ((s.class_id = c.id)))
  WHERE (c.teacher_id = auth.uid()))));


create policy "Teachers can view results in their classes"
on "public"."results"
as permissive
for select
to public
using ((student_id IN ( SELECT s.id
   FROM (students s
     JOIN classes c ON ((s.class_id = c.id)))
  WHERE (c.teacher_id = auth.uid()))));


create policy "Admins and HOLA can update their school logo"
on "public"."schools"
as permissive
for update
to public
using ((id IN ( SELECT users.school_id
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['ADMIN'::text, 'HOLA'::text]))))))
with check ((id IN ( SELECT users.school_id
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['ADMIN'::text, 'HOLA'::text]))))));


create policy "Users can view their own school"
on "public"."schools"
as permissive
for select
to public
using ((id IN ( SELECT users.school_id
   FROM users
  WHERE (users.id = auth.uid()))));


create policy "Users can view strand data"
on "public"."strand"
as permissive
for select
to public
using ((auth.uid() IS NOT NULL));


create policy "Public users can create student responses"
on "public"."student_responses"
as permissive
for insert
to anon
with check (true);


create policy "Teachers can create responses in their classes"
on "public"."student_responses"
as permissive
for insert
to public
with check ((task_id IN ( SELECT t.id
   FROM (tasks t
     JOIN classes c ON ((t.class_id = c.id)))
  WHERE (c.teacher_id = auth.uid()))));


create policy "Teachers can delete responses in their classes"
on "public"."student_responses"
as permissive
for delete
to public
using ((task_id IN ( SELECT t.id
   FROM (tasks t
     JOIN classes c ON ((t.class_id = c.id)))
  WHERE (c.teacher_id = auth.uid()))));


create policy "Teachers can update responses in their classes"
on "public"."student_responses"
as permissive
for update
to public
using ((task_id IN ( SELECT t.id
   FROM (tasks t
     JOIN classes c ON ((t.class_id = c.id)))
  WHERE (c.teacher_id = auth.uid()))));


create policy "Teachers can view responses in their classes"
on "public"."student_responses"
as permissive
for select
to public
using ((task_id IN ( SELECT t.id
   FROM (tasks t
     JOIN classes c ON ((t.class_id = c.id)))
  WHERE (c.teacher_id = auth.uid()))));


create policy "Public users can view students for validation"
on "public"."students"
as permissive
for select
to anon
using (true);


create policy "Teachers can create students in their classes"
on "public"."students"
as permissive
for insert
to public
with check ((class_id IN ( SELECT classes.id
   FROM classes
  WHERE (classes.teacher_id = auth.uid()))));


create policy "Teachers can delete students in their classes"
on "public"."students"
as permissive
for delete
to public
using ((class_id IN ( SELECT classes.id
   FROM classes
  WHERE (classes.teacher_id = auth.uid()))));


create policy "Teachers can update students in their classes"
on "public"."students"
as permissive
for update
to public
using ((class_id IN ( SELECT classes.id
   FROM classes
  WHERE (classes.teacher_id = auth.uid()))));


create policy "Teachers can view students in their classes"
on "public"."students"
as permissive
for select
to public
using ((class_id IN ( SELECT classes.id
   FROM classes
  WHERE (classes.teacher_id = auth.uid()))));


create policy "Users can view tag data"
on "public"."tag"
as permissive
for select
to public
using ((auth.uid() IS NOT NULL));


create policy "Public users can view tasks for assessments"
on "public"."tasks"
as permissive
for select
to anon
using (true);


create policy "Teachers can create tasks in their classes"
on "public"."tasks"
as permissive
for insert
to public
with check ((class_id IN ( SELECT classes.id
   FROM classes
  WHERE (classes.teacher_id = auth.uid()))));


create policy "Teachers can delete tasks in their classes"
on "public"."tasks"
as permissive
for delete
to public
using ((class_id IN ( SELECT classes.id
   FROM classes
  WHERE (classes.teacher_id = auth.uid()))));


create policy "Teachers can update tasks in their classes"
on "public"."tasks"
as permissive
for update
to public
using ((class_id IN ( SELECT classes.id
   FROM classes
  WHERE (classes.teacher_id = auth.uid()))));


create policy "Teachers can view tasks in their classes"
on "public"."tasks"
as permissive
for select
to public
using ((class_id IN ( SELECT classes.id
   FROM classes
  WHERE (classes.teacher_id = auth.uid()))));


create policy "Users can update their own profile"
on "public"."users"
as permissive
for update
to public
using ((id = auth.uid()))
with check ((id = auth.uid()));


create policy "Users can view their own profile"
on "public"."users"
as permissive
for select
to public
using ((id = auth.uid()));


CREATE TRIGGER update_achievement_standard_updated_at BEFORE UPDATE ON public.achievement_standard FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_item_updated_at BEFORE UPDATE ON public.content_item FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_curriculum_updated_at BEFORE UPDATE ON public.curriculum FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_layouts_updated_at BEFORE UPDATE ON public.dashboard_layouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_widgets_updated_at BEFORE UPDATE ON public.dashboard_widgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrolments_updated_at BEFORE UPDATE ON public.enrolments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_question_results_updated_at BEFORE UPDATE ON public.question_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_results_updated_at BEFORE UPDATE ON public.results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strand_updated_at BEFORE UPDATE ON public.strand FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_responses_updated_at BEFORE UPDATE ON public.student_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tag_updated_at BEFORE UPDATE ON public.tag FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();


  create policy "Admins and HOLA can update school logos"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'school-logos'::text) AND (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['ADMIN'::text, 'HOLA'::text])))))))
with check (((bucket_id = 'school-logos'::text) AND (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['ADMIN'::text, 'HOLA'::text])))))));



  create policy "Admins and HOLA can upload school logos"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'school-logos'::text) AND (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['ADMIN'::text, 'HOLA'::text])))))));



  create policy "School logos are publicly accessible"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'school-logos'::text));



