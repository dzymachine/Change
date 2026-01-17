-- ============================================
-- 1) Ensure donation_mode default is 'random'
-- ============================================
alter table public.profiles
alter column donation_mode set default 'random';


-- ============================================
-- 2) Function to auto-create profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (
    id,
    email,
    donation_mode
  )
  values (
    new.id,
    new.email,
    'random'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;


-- ============================================
-- 3) Trigger on auth.users
-- ============================================
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();
