BEGIN;

CREATE TABLE IF NOT EXISTS public.channel_link_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL
        REFERENCES public.businesses (id) ON DELETE CASCADE,
    channel varchar(20) NOT NULL,
    token_hash varchar(64) NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    consumed_at timestamptz,
    CONSTRAINT channel_link_tokens_channel_supported
        CHECK (channel IN ('whatsapp', 'telegram')),
    CONSTRAINT channel_link_tokens_hash_length
        CHECK (length(token_hash) = 64)
);

CREATE INDEX IF NOT EXISTS channel_link_tokens_business_expiry_idx
    ON public.channel_link_tokens (business_id, channel, expires_at)
    WHERE consumed_at IS NULL;

CREATE TABLE IF NOT EXISTS public.channel_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    channel varchar(20) NOT NULL,
    external_message_id varchar(255) NOT NULL,
    contact_id uuid
        REFERENCES public.contacts (id) ON DELETE SET NULL,
    status varchar(20) NOT NULL,
    received_at timestamptz NOT NULL DEFAULT now(),
    processed_at timestamptz,
    CONSTRAINT channel_messages_channel_supported
        CHECK (channel IN ('whatsapp', 'telegram')),
    CONSTRAINT channel_messages_status_supported
        CHECK (status IN ('processing', 'processed', 'failed')),
    CONSTRAINT channel_messages_external_id_not_blank
        CHECK (length(trim(external_message_id)) > 0),
    CONSTRAINT channel_messages_channel_external_id_uidx
        UNIQUE (channel, external_message_id)
);

CREATE INDEX IF NOT EXISTS channel_messages_received_idx
    ON public.channel_messages (received_at);

CREATE UNIQUE INDEX IF NOT EXISTS contacts_channel_external_id_active_uidx
    ON public.contacts (channel, external_id)
    WHERE is_active;

ALTER TABLE public.channel_link_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_messages ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
    public.channel_link_tokens,
    public.channel_messages
FROM anon, authenticated;

COMMIT;
