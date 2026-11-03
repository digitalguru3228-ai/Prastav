# Prastav Supabase authentication setup

## 1. Environment variables

Create a file named `.env.local` in the project root (same folder as `package.json`):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

Use the project's Supabase URL and its publishable key (or legacy anon key). Never use a `service_role` or secret key in this browser application. `.env.local` is ignored by Git and is intentionally not included in this ZIP.

Restart Vite after editing the file.

## 2. Required profiles table and trigger

If you already created the `public.profiles` table and trigger using the project setup instructions, do not create duplicates. Check that the trigger copies `full_name` and `department` from auth user metadata and always assigns the initial role `employee`.

For a fresh project, run this SQL in Supabase SQL Editor:

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null default 'employee'
    check (role in ('employee', 'approver', 'admin')),
  department text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

grant select on public.profiles to authenticated;
revoke insert, update, delete on public.profiles from anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, role, department)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'New User'),
    new.email,
    'employee',
    nullif(new.raw_user_meta_data ->> 'department', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

The trigger creates the profile row when Supabase Auth creates a user. Do not add a client-side policy that lets users update their own `role`.

## 3. Email confirmation

If Supabase email confirmation is enabled, registration sends a confirmation email. The user must confirm it before password login. For local testing, configure the Supabase Auth URL settings to allow `http://localhost:5173/**` as a redirect URL if your confirmation flow needs it.

## 4. First admin / approver

Every public registration is assigned `employee`. Assign `approver` or `admin` only through a trusted administrator process or Supabase SQL Editor after verifying the user. Example for a known user's email:

```sql
update public.profiles
set role = 'admin'
where email = 'the-verified-admin@example.com';
```

Do not expose the Supabase service-role key in frontend code. In a production deployment, role assignment should be performed by a secure server-side admin process.

## 5. Run locally

```powershell
npm install
npm run dev
```

Open `http://localhost:5173/register`, create an employee account, confirm the email if required, then sign in at `/login`.

## Scope of this ZIP

This update integrates Supabase authentication, profile loading, login/logout, and client-side role-based route gating. Proposal records, approvals, admin analytics, user directory, and audit history remain sample/demo data and are NOT yet persisted to Supabase. Production authorization must also be enforced by database RLS policies for every business table; frontend route checks alone are not a security boundary.
