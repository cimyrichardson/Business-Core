-- Business Core initial schema for Supabase PostgreSQL.
-- Run once by pasting this file into the Supabase SQL Editor.
-- Business tables are accessed by FastAPI using its server-side DATABASE_URL.
-- No client-facing RLS policies are created.

CREATE TABLE IF NOT EXISTS public.profiles (
    user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    full_name varchar(120) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT profiles_full_name_not_blank CHECK (length(trim(full_name)) > 0)
);

CREATE TABLE IF NOT EXISTS public.businesses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(120) NOT NULL,
    created_by_user_id uuid UNIQUE REFERENCES auth.users (id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT businesses_name_not_blank CHECK (length(trim(name)) > 0)
);

CREATE TABLE IF NOT EXISTS public.business_members (
    business_id uuid NOT NULL
        REFERENCES public.businesses (id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    role varchar(20) NOT NULL DEFAULT 'owner',
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (business_id, user_id),
    CONSTRAINT business_members_role_supported
        CHECK (role IN ('owner', 'member'))
);

CREATE INDEX IF NOT EXISTS business_members_user_id_idx
    ON public.business_members (user_id);

CREATE TABLE IF NOT EXISTS public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid,
    name varchar(120) NOT NULL,
    description text,
    purchase_cost_htg bigint,
    unit_price_htg bigint NOT NULL,
    stock_quantity integer NOT NULL DEFAULT 0,
    min_stock_quantity integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT products_name_not_blank CHECK (length(trim(name)) > 0),
    CONSTRAINT products_purchase_cost_positive
        CHECK (purchase_cost_htg IS NULL OR purchase_cost_htg > 0),
    CONSTRAINT products_unit_price_positive CHECK (unit_price_htg > 0),
    CONSTRAINT products_stock_nonnegative CHECK (stock_quantity >= 0),
    CONSTRAINT products_min_stock_nonnegative CHECK (min_stock_quantity >= 0)
);

ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS business_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS products_business_id_id_uidx
    ON public.products (business_id, id);

CREATE TABLE IF NOT EXISTS public.sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid,
    product_id uuid NOT NULL,
    sold_at timestamptz NOT NULL DEFAULT now(),
    quantity integer NOT NULL,
    unit_price_htg bigint NOT NULL,
    total_htg bigint NOT NULL,
    payment_method varchar(40),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT sales_quantity_positive CHECK (quantity > 0),
    CONSTRAINT sales_unit_price_positive CHECK (unit_price_htg > 0),
    CONSTRAINT sales_total_positive CHECK (total_htg > 0),
    CONSTRAINT sales_total_matches_items
        CHECK (total_htg = quantity::bigint * unit_price_htg)
);

ALTER TABLE public.sales
    ADD COLUMN IF NOT EXISTS business_id uuid;

CREATE TABLE IF NOT EXISTS public.expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid,
    amount_htg bigint NOT NULL,
    category varchar(80) NOT NULL,
    spent_at timestamptz NOT NULL DEFAULT now(),
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT expenses_amount_positive CHECK (amount_htg > 0),
    CONSTRAINT expenses_category_not_blank CHECK (length(trim(category)) > 0)
);

ALTER TABLE public.expenses
    ADD COLUMN IF NOT EXISTS business_id uuid;

CREATE TABLE IF NOT EXISTS public.contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid,
    channel varchar(20) NOT NULL,
    external_id varchar(255) NOT NULL,
    name varchar(120),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT contacts_channel_supported
        CHECK (channel IN ('whatsapp', 'telegram')),
    CONSTRAINT contacts_external_id_not_blank
        CHECK (length(trim(external_id)) > 0)
);

ALTER TABLE public.contacts
    ADD COLUMN IF NOT EXISTS business_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS contacts_business_id_id_uidx
    ON public.contacts (business_id, id);

CREATE UNIQUE INDEX IF NOT EXISTS contacts_business_channel_external_id_uidx
    ON public.contacts (business_id, channel, external_id);

CREATE TABLE IF NOT EXISTS public.pending_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid,
    contact_id uuid NOT NULL REFERENCES public.contacts (id) ON DELETE CASCADE,
    action_type varchar(40) NOT NULL,
    payload jsonb NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'pending',
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    resolved_at timestamptz,
    CONSTRAINT pending_actions_supported_type
        CHECK (action_type IN ('create_sale')),
    CONSTRAINT pending_actions_payload_object
        CHECK (jsonb_typeof(payload) = 'object'),
    CONSTRAINT pending_actions_supported_status
        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired')),
    CONSTRAINT pending_actions_resolution_consistent
        CHECK (
            (status = 'pending' AND resolved_at IS NULL)
            OR (status <> 'pending' AND resolved_at IS NOT NULL)
        )
);

ALTER TABLE public.pending_actions
    ADD COLUMN IF NOT EXISTS business_id uuid;

-- Create profiles and a first business for accounts that already exist.
INSERT INTO public.profiles (user_id, full_name)
SELECT
    users.id,
    COALESCE(
        NULLIF(trim(users.raw_user_meta_data ->> 'full_name'), ''),
        NULLIF(split_part(COALESCE(users.email, ''), '@', 1), ''),
        'Itilizatè'
    )
FROM auth.users AS users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.businesses (name, created_by_user_id)
SELECT
    COALESCE(
        NULLIF(trim(users.raw_user_meta_data ->> 'business_name'), ''),
        'Biznis mwen'
    ),
    users.id
FROM auth.users AS users
ON CONFLICT (created_by_user_id) DO NOTHING;

INSERT INTO public.business_members (business_id, user_id, role)
SELECT businesses.id, businesses.created_by_user_id, 'owner'
FROM public.businesses AS businesses
WHERE businesses.created_by_user_id IS NOT NULL
ON CONFLICT (business_id, user_id) DO NOTHING;

-- Preserve rows created by the original schema, which had no business_id.
DO $migration$
DECLARE
    legacy_business_id uuid;
BEGIN
    IF EXISTS (SELECT 1 FROM public.products WHERE business_id IS NULL)
       OR EXISTS (SELECT 1 FROM public.sales WHERE business_id IS NULL)
       OR EXISTS (SELECT 1 FROM public.expenses WHERE business_id IS NULL)
       OR EXISTS (SELECT 1 FROM public.contacts WHERE business_id IS NULL)
       OR EXISTS (SELECT 1 FROM public.pending_actions WHERE business_id IS NULL)
    THEN
        SELECT businesses.id
        INTO legacy_business_id
        FROM public.businesses AS businesses
        WHERE businesses.created_by_user_id IS NULL
          AND businesses.name = 'Boutik ki te deja anrejistre'
        ORDER BY businesses.created_at
        LIMIT 1;

        IF legacy_business_id IS NULL THEN
            INSERT INTO public.businesses (name)
            VALUES ('Boutik ki te deja anrejistre')
            RETURNING id INTO legacy_business_id;
        END IF;

        UPDATE public.products
        SET business_id = legacy_business_id
        WHERE business_id IS NULL;

        UPDATE public.sales
        SET business_id = COALESCE(
            sales.business_id,
            products.business_id,
            legacy_business_id
        )
        FROM public.products AS products
        WHERE sales.product_id = products.id
          AND sales.business_id IS NULL;

        UPDATE public.sales
        SET business_id = legacy_business_id
        WHERE business_id IS NULL;

        UPDATE public.expenses
        SET business_id = legacy_business_id
        WHERE business_id IS NULL;

        UPDATE public.contacts
        SET business_id = legacy_business_id
        WHERE business_id IS NULL;

        UPDATE public.pending_actions
        SET business_id = contacts.business_id
        FROM public.contacts AS contacts
        WHERE pending_actions.contact_id = contacts.id
          AND pending_actions.business_id IS NULL;

        UPDATE public.pending_actions
        SET business_id = legacy_business_id
        WHERE business_id IS NULL;
    END IF;
END;
$migration$;

ALTER TABLE public.products
    ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE public.sales
    ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE public.expenses
    ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE public.contacts
    ALTER COLUMN business_id SET NOT NULL;
ALTER TABLE public.pending_actions
    ALTER COLUMN business_id SET NOT NULL;

DO $constraints$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'products_business_id_fkey'
          AND conrelid = 'public.products'::regclass
    ) THEN
        ALTER TABLE public.products
            ADD CONSTRAINT products_business_id_fkey
            FOREIGN KEY (business_id)
            REFERENCES public.businesses (id)
            ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'sales_business_id_fkey'
          AND conrelid = 'public.sales'::regclass
    ) THEN
        ALTER TABLE public.sales
            ADD CONSTRAINT sales_business_id_fkey
            FOREIGN KEY (business_id)
            REFERENCES public.businesses (id)
            ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'sales_product_business_fkey'
          AND conrelid = 'public.sales'::regclass
    ) THEN
        ALTER TABLE public.sales
            ADD CONSTRAINT sales_product_business_fkey
            FOREIGN KEY (business_id, product_id)
            REFERENCES public.products (business_id, id)
            ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'expenses_business_id_fkey'
          AND conrelid = 'public.expenses'::regclass
    ) THEN
        ALTER TABLE public.expenses
            ADD CONSTRAINT expenses_business_id_fkey
            FOREIGN KEY (business_id)
            REFERENCES public.businesses (id)
            ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'contacts_business_id_fkey'
          AND conrelid = 'public.contacts'::regclass
    ) THEN
        ALTER TABLE public.contacts
            ADD CONSTRAINT contacts_business_id_fkey
            FOREIGN KEY (business_id)
            REFERENCES public.businesses (id)
            ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'pending_actions_contact_business_fkey'
          AND conrelid = 'public.pending_actions'::regclass
    ) THEN
        ALTER TABLE public.pending_actions
            ADD CONSTRAINT pending_actions_contact_business_fkey
            FOREIGN KEY (business_id, contact_id)
            REFERENCES public.contacts (business_id, id)
            ON DELETE CASCADE;
    END IF;
END;
$constraints$;

CREATE INDEX IF NOT EXISTS products_business_name_idx
    ON public.products (business_id, name);

CREATE INDEX IF NOT EXISTS products_business_low_stock_idx
    ON public.products (business_id, stock_quantity, name)
    WHERE is_active;

CREATE INDEX IF NOT EXISTS sales_business_sold_at_idx
    ON public.sales (business_id, sold_at DESC);

CREATE INDEX IF NOT EXISTS sales_business_product_sold_at_idx
    ON public.sales (business_id, product_id, sold_at DESC);

CREATE INDEX IF NOT EXISTS expenses_business_spent_at_idx
    ON public.expenses (business_id, spent_at DESC);

CREATE INDEX IF NOT EXISTS expenses_business_category_spent_at_idx
    ON public.expenses (business_id, category, spent_at DESC);

CREATE INDEX IF NOT EXISTS contacts_business_active_channel_idx
    ON public.contacts (business_id, channel)
    WHERE is_active;

CREATE INDEX IF NOT EXISTS pending_actions_business_status_expiry_idx
    ON public.pending_actions (business_id, status, expires_at);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS businesses_set_updated_at ON public.businesses;
CREATE TRIGGER businesses_set_updated_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;
CREATE TRIGGER products_set_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS contacts_set_updated_at ON public.contacts;
CREATE TRIGGER contacts_set_updated_at
    BEFORE UPDATE ON public.contacts
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.decrement_stock_for_sale()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    current_stock integer;
    product_is_active boolean;
BEGIN
    UPDATE public.products
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id
      AND business_id = NEW.business_id
      AND is_active
      AND stock_quantity >= NEW.quantity
    RETURNING stock_quantity INTO current_stock;

    IF FOUND THEN
        RETURN NEW;
    END IF;

    SELECT products.stock_quantity, products.is_active
    INTO current_stock, product_is_active
    FROM public.products AS products
    WHERE products.id = NEW.product_id
      AND products.business_id = NEW.business_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product does not exist in this business'
            USING ERRCODE = '23503';
    ELSIF NOT product_is_active THEN
        RAISE EXCEPTION 'Product is inactive'
            USING ERRCODE = '23514';
    ELSE
        RAISE EXCEPTION 'Insufficient stock'
            USING ERRCODE = '23514';
    END IF;
END;
$function$;

DROP TRIGGER IF EXISTS sales_decrement_stock ON public.sales;
CREATE TRIGGER sales_decrement_stock
    BEFORE INSERT ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_for_sale();

CREATE OR REPLACE FUNCTION public.create_business_for_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    profile_name text;
    business_name text;
    new_business_id uuid;
BEGIN
    profile_name := COALESCE(
        NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''),
        NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
        'Itilizatè'
    );
    business_name := COALESCE(
        NULLIF(trim(NEW.raw_user_meta_data ->> 'business_name'), ''),
        'Biznis mwen'
    );

    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, profile_name)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.businesses (name, created_by_user_id)
    VALUES (business_name, NEW.id)
    ON CONFLICT (created_by_user_id) DO NOTHING
    RETURNING id INTO new_business_id;

    IF new_business_id IS NULL THEN
        SELECT businesses.id
        INTO new_business_id
        FROM public.businesses AS businesses
        WHERE businesses.created_by_user_id = NEW.id;
    END IF;

    INSERT INTO public.business_members (business_id, user_id, role)
    VALUES (new_business_id, NEW.id, 'owner')
    ON CONFLICT (business_id, user_id) DO NOTHING;

    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS business_core_on_auth_user_created ON auth.users;
CREATE TRIGGER business_core_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.create_business_for_new_auth_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_actions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
    public.profiles,
    public.businesses,
    public.business_members,
    public.products,
    public.sales,
    public.expenses,
    public.contacts,
    public.pending_actions
FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.set_updated_at()
    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_stock_for_sale()
    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_business_for_new_auth_user()
    FROM PUBLIC, anon, authenticated;
