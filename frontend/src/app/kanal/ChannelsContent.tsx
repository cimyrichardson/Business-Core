"use client";

import { useCallback, useEffect, useState } from "react";

import {
  createChannelLink,
  getChannelLinks,
  revokeChannelLink,
  type ChannelKey,
  type ChannelLink,
  type ChannelLinkCode,
} from "@/lib/business-api";
import { formatBusinessDateTime } from "@/lib/business-format";
import WorkspaceShell from "../WorkspaceShell";

const channelLabels: Record<ChannelKey, string> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
};

export default function ChannelsContent() {
  const [links, setLinks] = useState<ChannelLink[]>([]);
  const [linkCode, setLinkCode] = useState<ChannelLinkCode | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<ChannelKey | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback((signal?: AbortSignal) => {
    return getChannelLinks(signal).then(setLinks);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void reload(controller.signal)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Nou pa ka chaje koneksyon chanèl yo.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [reload, reloadKey]);

  async function connect(channel: ChannelKey) {
    setError("");
    setLinkCode(null);
    setIsSaving(channel);
    try {
      const result = await createChannelLink(channel);
      setLinkCode(result);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Nou pa ka kreye kòd koneksyon an.",
      );
    } finally {
      setIsSaving(null);
    }
  }

  async function disconnect(channel: ChannelKey) {
    setError("");
    setLinkCode(null);
    setIsSaving(channel);
    try {
      await revokeChannelLink(channel);
      setReloadKey((key) => key + 1);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Nou pa ka dekonekte chanèl sa a.",
      );
    } finally {
      setIsSaving(null);
    }
  }

  const activeLinks = new Map(
    links.map((link) => [link.channel, link] as const),
  );

  return (
    <WorkspaceShell>
      <section>
        <p className="workspace-section-kicker">Business Core</p>
        <h2 className="mt-2 text-3xl font-bold">Mesaj ak rapò</h2>
        <p className="workspace-muted mt-2 max-w-2xl text-sm leading-6">
          Konekte WhatsApp oswa Telegram pou pale ak biznis ou.
        </p>

        {error && (
          <div className="workspace-api-error mt-5" role="alert">
            {error}
          </div>
        )}

        {linkCode && (
          <div className="workspace-api-success mt-5" role="status">
            <p className="font-semibold">
              Kòd koneksyon {channelLabels[linkCode.channel]}
            </p>
            <code className="mt-2 block break-all rounded-lg bg-white/70 p-3 text-base font-bold tracking-wide">
              /link {linkCode.code}
            </code>
            <p className="mt-2">
              Voye kòmand sa a bay bot {channelLabels[linkCode.channel]} la
              anvan {formatBusinessDateTime(linkCode.expires_at)}. Pa pataje
              kòd la ak lòt moun. Apre koneksyon an, rafrechi paj sa a pou wè
              estati a.
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-2" aria-busy={isLoading}>
          {(["whatsapp", "telegram"] as const).map((channel) => {
            const link = activeLinks.get(channel);
            return (
              <article
                key={channel}
                className="workspace-card p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold">
                      {channelLabels[channel]}
                    </h3>
                    <p className="workspace-muted mt-1 text-sm">
                      {isLoading
                        ? "Ap verifye koneksyon an..."
                        : link?.connected
                          ? "Kont sa a konekte ak biznis ou."
                          : "Konekte bot la pou voye kòmand ak mesaj vokal."}
                    </p>
                    {link?.name && (
                      <p className="mt-2 text-sm font-medium">{link.name}</p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      link?.connected
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {link?.connected ? "Konekte" : "Pa konekte"}
                  </span>
                </div>

                <div className="mt-5">
                  {link?.connected ? (
                    <button
                      type="button"
                      className="workspace-secondary-button"
                      disabled={isSaving !== null}
                      onClick={() => void disconnect(channel)}
                    >
                      {isSaving === channel ? "Ap dekonekte..." : "Dekonekte"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="workspace-primary-button"
                      disabled={isSaving !== null || isLoading}
                      onClick={() => void connect(channel)}
                    >
                      {isSaving === channel
                        ? "Ap kreye kòd la..."
                        : `Konekte ${channelLabels[channel]}`}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </WorkspaceShell>
  );
}
