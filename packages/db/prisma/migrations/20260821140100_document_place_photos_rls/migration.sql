-- מתקן את ה-RLS policy על documents אחרי ש-tripId הפך ל-nullable (מיגרציה
-- קודמת). is_trip_owner(null) תמיד false — בלי התיקון הזה, כל תמונת-מקום
-- (entityType='place', tripId=null) הייתה נחסמת לגמרי ע"י RLS.

create or replace function public.is_place_owner(p_place_id text)
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.places where id = p_place_id and "userId" = auth.uid()::text);
$$;

create or replace function public.is_document_owner(p_document_id text)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.documents d
    where d.id = p_document_id
      and (
        (d."tripId" is not null and public.is_trip_owner(d."tripId"))
        or (d."tripId" is null and d."entityType" = 'place' and public.is_place_owner(d."entityId"))
      )
  );
$$;

drop policy if exists "documents_all_own" on public.documents;
create policy "documents_all_own" on public.documents for all using (
  ("tripId" is not null and public.is_trip_owner("tripId"))
  or ("tripId" is null and "entityType" = 'place' and public.is_place_owner("entityId"))
) with check (
  ("tripId" is not null and public.is_trip_owner("tripId"))
  or ("tripId" is null and "entityType" = 'place' and public.is_place_owner("entityId"))
);
