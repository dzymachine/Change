--Foreign Keys for user_charities
--alter table public.user_charities
--  add constraint user_charities_charity_id_fkey
--  foreign key (charity_id) references public.charities(id) on delete cascade;

--Foreign Keys for donations
--alter table public.donations
--  add constraint donations_charity_id_fkey
--  foreign key (charity_id) references public.charities(id);

--Foreign Keys for donations
--alter table public.donations
--  add constraint donations_transaction_id_fkey
--  foreign key (transaction_id) references public.transactions(id);
