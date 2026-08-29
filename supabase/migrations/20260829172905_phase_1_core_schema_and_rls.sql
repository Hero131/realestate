-- Phase 1: multi-tenant broker catalog schema + RLS

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_domain_hostname()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.hostname = lower(trim(NEW.hostname));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_child_broker_id_from_property()
RETURNS trigger
LANGUAGE plpgsql
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

CREATE TABLE public.brokers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  company_name text NOT NULL,
  phone text,
  whatsapp text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brokers_company_name_not_blank CHECK (length(trim(company_name)) > 0)
);

CREATE INDEX brokers_auth_user_id_idx ON public.brokers (auth_user_id);

CREATE TRIGGER brokers_set_updated_at
BEFORE UPDATE ON public.brokers
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES public.brokers (id) ON DELETE CASCADE,
  hostname text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT domains_hostname_not_blank CHECK (length(trim(hostname)) > 0),
  CONSTRAINT domains_hostname_unique UNIQUE (hostname)
);

CREATE INDEX domains_broker_id_idx ON public.domains (broker_id);
CREATE INDEX domains_hostname_idx ON public.domains (hostname);

CREATE TRIGGER domains_normalize_hostname
BEFORE INSERT OR UPDATE ON public.domains
FOR EACH ROW
EXECUTE FUNCTION public.normalize_domain_hostname();

CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES public.brokers (id) ON DELETE CASCADE,
  title text NOT NULL,
  price_min bigint,
  price_max bigint,
  location text NOT NULL,
  property_type text NOT NULL,
  size_sqft numeric(10, 2),
  size_label text,
  bedrooms smallint,
  parking smallint,
  bullet_facts text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT properties_title_not_blank CHECK (length(trim(title)) > 0),
  CONSTRAINT properties_location_not_blank CHECK (length(trim(location)) > 0),
  CONSTRAINT properties_property_type_valid CHECK (
    property_type IN ('apartment', 'house', 'villa', 'plot', 'commercial', 'other')
  ),
  CONSTRAINT properties_status_valid CHECK (
    status IN ('draft', 'published', 'unpublished')
  ),
  CONSTRAINT properties_price_range_valid CHECK (
    price_min IS NULL
    OR price_max IS NULL
    OR price_max >= price_min
  ),
  CONSTRAINT properties_bedrooms_non_negative CHECK (
    bedrooms IS NULL OR bedrooms >= 0
  ),
  CONSTRAINT properties_parking_non_negative CHECK (
    parking IS NULL OR parking >= 0
  )
);

CREATE INDEX properties_broker_id_idx ON public.properties (broker_id);
CREATE INDEX properties_broker_status_idx ON public.properties (broker_id, status);
CREATE INDEX properties_broker_type_idx ON public.properties (broker_id, property_type);
CREATE INDEX properties_broker_price_idx ON public.properties (broker_id, price_min, price_max);
CREATE INDEX properties_broker_location_idx ON public.properties (broker_id, location);
CREATE INDEX properties_published_broker_idx ON public.properties (broker_id)
  WHERE status = 'published';

CREATE TRIGGER properties_set_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties (id) ON DELETE CASCADE,
  broker_id uuid NOT NULL REFERENCES public.brokers (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  alt_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT property_images_storage_path_not_blank CHECK (length(trim(storage_path)) > 0),
  CONSTRAINT property_images_public_url_not_blank CHECK (length(trim(public_url)) > 0),
  CONSTRAINT property_images_sort_order_non_negative CHECK (sort_order >= 0)
);

CREATE INDEX property_images_property_id_idx ON public.property_images (property_id, sort_order);
CREATE INDEX property_images_broker_id_idx ON public.property_images (broker_id);

CREATE TRIGGER property_images_sync_broker_id
BEFORE INSERT OR UPDATE OF property_id ON public.property_images
FOR EACH ROW
EXECUTE FUNCTION public.sync_child_broker_id_from_property();

CREATE TABLE public.nearby_amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties (id) ON DELETE CASCADE,
  broker_id uuid NOT NULL REFERENCES public.brokers (id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  travel_time text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT nearby_amenities_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT nearby_amenities_travel_time_not_blank CHECK (length(trim(travel_time)) > 0),
  CONSTRAINT nearby_amenities_category_valid CHECK (
    category IN (
      'school',
      'college',
      'hospital',
      'metro',
      'train',
      'bus',
      'market',
      'park',
      'landmark',
      'other'
    )
  ),
  CONSTRAINT nearby_amenities_sort_order_non_negative CHECK (sort_order >= 0)
);

CREATE INDEX nearby_amenities_property_id_idx ON public.nearby_amenities (property_id, sort_order);
CREATE INDEX nearby_amenities_broker_id_idx ON public.nearby_amenities (broker_id);

CREATE TRIGGER nearby_amenities_sync_broker_id
BEFORE INSERT OR UPDATE OF property_id ON public.nearby_amenities
FOR EACH ROW
EXECUTE FUNCTION public.sync_child_broker_id_from_property();

CREATE OR REPLACE FUNCTION public.current_broker_id()
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

CREATE OR REPLACE FUNCTION public.is_published_property(p_property_id uuid)
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

ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nearby_amenities ENABLE ROW LEVEL SECURITY;

CREATE POLICY brokers_select_own
ON public.brokers
FOR SELECT
TO authenticated
USING (auth_user_id = (SELECT auth.uid()));

CREATE POLICY brokers_insert_own
ON public.brokers
FOR INSERT
TO authenticated
WITH CHECK (auth_user_id = (SELECT auth.uid()));

CREATE POLICY brokers_update_own
ON public.brokers
FOR UPDATE
TO authenticated
USING (auth_user_id = (SELECT auth.uid()))
WITH CHECK (auth_user_id = (SELECT auth.uid()));

CREATE POLICY brokers_select_public_profile
ON public.brokers
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.domains d
    WHERE d.broker_id = brokers.id
  )
);

CREATE POLICY domains_select_public
ON public.domains
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY domains_select_own
ON public.domains
FOR SELECT
TO authenticated
USING (broker_id = (SELECT public.current_broker_id()));

CREATE POLICY domains_insert_own
ON public.domains
FOR INSERT
TO authenticated
WITH CHECK (broker_id = (SELECT public.current_broker_id()));

CREATE POLICY domains_update_own
ON public.domains
FOR UPDATE
TO authenticated
USING (broker_id = (SELECT public.current_broker_id()))
WITH CHECK (broker_id = (SELECT public.current_broker_id()));

CREATE POLICY domains_delete_own
ON public.domains
FOR DELETE
TO authenticated
USING (broker_id = (SELECT public.current_broker_id()));

CREATE POLICY properties_select_own
ON public.properties
FOR SELECT
TO authenticated
USING (broker_id = (SELECT public.current_broker_id()));

CREATE POLICY properties_insert_own
ON public.properties
FOR INSERT
TO authenticated
WITH CHECK (broker_id = (SELECT public.current_broker_id()));

CREATE POLICY properties_update_own
ON public.properties
FOR UPDATE
TO authenticated
USING (broker_id = (SELECT public.current_broker_id()))
WITH CHECK (broker_id = (SELECT public.current_broker_id()));

CREATE POLICY properties_delete_own
ON public.properties
FOR DELETE
TO authenticated
USING (broker_id = (SELECT public.current_broker_id()));

CREATE POLICY properties_select_published_public
ON public.properties
FOR SELECT
TO anon, authenticated
USING (status = 'published');

CREATE POLICY property_images_select_own
ON public.property_images
FOR SELECT
TO authenticated
USING (broker_id = (SELECT public.current_broker_id()));

CREATE POLICY property_images_insert_own
ON public.property_images
FOR INSERT
TO authenticated
WITH CHECK (
  broker_id = (SELECT public.current_broker_id())
  AND EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_id
      AND p.broker_id = (SELECT public.current_broker_id())
  )
);

CREATE POLICY property_images_update_own
ON public.property_images
FOR UPDATE
TO authenticated
USING (broker_id = (SELECT public.current_broker_id()))
WITH CHECK (
  broker_id = (SELECT public.current_broker_id())
  AND EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_id
      AND p.broker_id = (SELECT public.current_broker_id())
  )
);

CREATE POLICY property_images_delete_own
ON public.property_images
FOR DELETE
TO authenticated
USING (broker_id = (SELECT public.current_broker_id()));

CREATE POLICY property_images_select_published_public
ON public.property_images
FOR SELECT
TO anon, authenticated
USING (public.is_published_property(property_id));

CREATE POLICY nearby_amenities_select_own
ON public.nearby_amenities
FOR SELECT
TO authenticated
USING (broker_id = (SELECT public.current_broker_id()));

CREATE POLICY nearby_amenities_insert_own
ON public.nearby_amenities
FOR INSERT
TO authenticated
WITH CHECK (
  broker_id = (SELECT public.current_broker_id())
  AND EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_id
      AND p.broker_id = (SELECT public.current_broker_id())
  )
);

CREATE POLICY nearby_amenities_update_own
ON public.nearby_amenities
FOR UPDATE
TO authenticated
USING (broker_id = (SELECT public.current_broker_id()))
WITH CHECK (
  broker_id = (SELECT public.current_broker_id())
  AND EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_id
      AND p.broker_id = (SELECT public.current_broker_id())
  )
);

CREATE POLICY nearby_amenities_delete_own
ON public.nearby_amenities
FOR DELETE
TO authenticated
USING (broker_id = (SELECT public.current_broker_id()));

CREATE POLICY nearby_amenities_select_published_public
ON public.nearby_amenities
FOR SELECT
TO anon, authenticated
USING (public.is_published_property(property_id));
