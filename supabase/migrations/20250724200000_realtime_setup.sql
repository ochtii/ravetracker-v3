-- Enable realtime for existing tables
-- This migration ensures that realtime subscriptions work properly

-- First, enable realtime for the tables we want to subscribe to
-- (Run this in your Supabase dashboard SQL editor)

-- Enable realtime for profiles table (already exists)
alter publication supabase_realtime add table profiles;

-- Enable realtime for events table (if it exists)
-- alter publication supabase_realtime add table events;

-- For now, we'll create a basic notifications table structure for testing
-- This can be expanded later when the full invite system is implemented

create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text,
  type text default 'info',
  read boolean default false,
  data jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Create policies for notifications
create policy "Users can view their own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can update their own notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- Admins can insert notifications for any user
create policy "Admins can insert notifications" on public.notifications
  for insert with check (
    exists(
      select 1 from public.profiles 
      where id = auth.uid() and is_organizer = true
    )
  );

-- Enable realtime for notifications
alter publication supabase_realtime add table notifications;

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger handle_notifications_updated_at
  before update on public.notifications
  for each row
  execute function public.handle_updated_at();

-- Create indexes for better performance
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);
create index if not exists notifications_read_idx on public.notifications(read);
