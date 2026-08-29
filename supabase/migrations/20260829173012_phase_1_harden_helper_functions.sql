-- Harden helper functions: private schema + fixed search_path on triggers

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;

CREATE OR REPLACE FUNCTION private.current_broker_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.brokers
  WHERE auth_user_id = (SELECT auth.uid())
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.is_published_property(p_property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.properties
    WHERE id = p_property_id
      AND status = 'published'
  );
$$;

REVOKE ALL ON FUNCTION private.current_broker_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_published_property(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_domain_hostname()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.hostname = lower(trim(NEW.hostname));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_child_broker_id_from_property()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_broker_id uuid;
BEGIN
  SELECT broker_id
  INTO v_broker_id
  FROM public.properties
  WHERE id = NEW.property_id;

  IF v_broker_id IS NULL THEN
    RAISE EXCEPTION 'Property % does not exist', NEW.property_id;
  END IF;

  NEW.broker_id = v_broker_id;
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS domains_select_own ON public.domains;
DROP POLICY IF EXISTS domains_insert_own ON public.domains;
DROP POLICY IF EXISTS domains_update_own ON public.domains;
DROP POLICY IF EXISTS domains_delete_own ON public.domains;

DROP POLICY IF EXISTS properties_select_own ON public.properties;
DROP POLICY IF EXISTS properties_insert_own ON public.properties;
DROP POLICY IF EXISTS properties_update_own ON public.properties;
DROP POLICY IF EXISTS properties_delete_own ON public.properties;

DROP POLICY IF EXISTS property_images_select_own ON public.property_images;
DROP POLICY IF EXISTS property_images_insert_own ON public.property_images;
DROP POLICY IF EXISTS property_images_update_own ON public.property_images;
DROP POLICY IF EXISTS property_images_delete_own ON public.property_images;
DROP POLICY IF EXISTS property_images_select_published_public ON public.property_images;

DROP POLICY IF EXISTS nearby_amenities_select_own ON public.nearby_amenities;
DROP POLICY IF EXISTS nearby_amenities_insert_own ON public.nearby_amenities;
DROP POLICY IF EXISTS nearby_amenities_update_own ON public.nearby_amenities;
DROP POLICY IF EXISTS nearby_amenities_delete_own ON public.nearby_amenities;
DROP POLICY IF EXISTS nearby_amenities_select_published_public ON public.nearby_amenities;

DROP FUNCTION IF EXISTS public.current_broker_id();
DROP FUNCTION IF EXISTS public.is_published_property(uuid);

CREATE POLICY domains_select_own
ON public.domains
FOR SELECT
TO authenticated
USING (broker_id = (SELECT private.current_broker_id()));

CREATE POLICY domains_insert_own
ON public.domains
FOR INSERT
TO authenticated
WITH CHECK (broker_id = (SELECT private.current_broker_id()));

CREATE POLICY domains_update_own
ON public.domains
FOR UPDATE
TO authenticated
USING (broker_id = (SELECT private.current_broker_id()))
WITH CHECK (broker_id = (SELECT private.current_broker_id()));

CREATE POLICY domains_delete_own
ON public.domains
FOR DELETE
TO authenticated
USING (broker_id = (SELECT private.current_broker_id()));

CREATE POLICY properties_select_own
ON public.properties
FOR SELECT
TO authenticated
USING (broker_id = (SELECT private.current_broker_id()));

CREATE POLICY properties_insert_own
ON public.properties
FOR INSERT
TO authenticated
WITH CHECK (broker_id = (SELECT private.current_broker_id()));

CREATE POLICY properties_update_own
ON public.properties
FOR UPDATE
TO authenticated
USING (broker_id = (SELECT private.current_broker_id()))
WITH CHECK (broker_id = (SELECT private.current_broker_id()));

CREATE POLICY properties_delete_own
ON public.properties
FOR DELETE
TO authenticated
USING (broker_id = (SELECT private.current_broker_id()));

CREATE POLICY property_images_select_own
ON public.property_images
FOR SELECT
TO authenticated
USING (broker_id = (SELECT private.current_broker_id()));

CREATE POLICY property_images_insert_own
ON public.property_images
FOR INSERT
TO authenticated
WITH CHECK (
  broker_id = (SELECT private.current_broker_id())
  AND EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_id
      AND p.broker_id = (SELECT private.current_broker_id())
  )
);

CREATE POLICY property_images_update_own
ON public.property_images
FOR UPDATE
TO authenticated
USING (broker_id = (SELECT private.current_broker_id()))
WITH CHECK (
  broker_id = (SELECT private.current_broker_id())
  AND EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_id
      AND p.broker_id = (SELECT private.current_broker_id())
  )
);

CREATE POLICY property_images_delete_own
ON public.property_images
FOR DELETE
TO authenticated
USING (broker_id = (SELECT private.current_broker_id()));

CREATE POLICY property_images_select_published_public
ON public.property_images
FOR SELECT
TO anon, authenticated
USING (private.is_published_property(property_id));

CREATE POLICY nearby_amenities_select_own
ON public.nearby_amenities
FOR SELECT
TO authenticated
USING (broker_id = (SELECT private.current_broker_id()));

CREATE POLICY nearby_amenities_insert_own
ON public.nearby_amenities
FOR INSERT
TO authenticated
WITH CHECK (
  broker_id = (SELECT private.current_broker_id())
  AND EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_id
      AND p.broker_id = (SELECT private.current_broker_id())
  )
);

CREATE POLICY nearby_amenities_update_own
ON public.nearby_amenities
FOR UPDATE
TO authenticated
USING (broker_id = (SELECT private.current_broker_id()))
WITH CHECK (
  broker_id = (SELECT private.current_broker_id())
  AND EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_id
      AND p.broker_id = (SELECT private.current_broker_id())
  )
);

CREATE POLICY nearby_amenities_delete_own
ON public.nearby_amenities
FOR DELETE
TO authenticated
USING (broker_id = (SELECT private.current_broker_id()));

CREATE POLICY nearby_amenities_select_published_public
ON public.nearby_amenities
FOR SELECT
TO anon, authenticated
USING (private.is_published_property(property_id));
