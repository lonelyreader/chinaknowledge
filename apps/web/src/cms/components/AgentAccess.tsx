"use client";

import { Button, Gutter, toast } from "@payloadcms/ui";
import { useCallback, useEffect, useState } from "react";

type AccessData = {
  adapters: string[];
  connections: { client: string; id: number; lastUsedAt?: string | null; state: string }[];
  events: { id: number; occurredAt: string; result: string; tool: string }[];
};

const activityLabels: Record<string, string> = {
  account_context: "Account checked",
  capabilities_list: "Access checked",
  my_articles_list: "Articles viewed",
  article_get_working_copy: "Article opened",
  article_create_draft: "Draft created",
  article_save_draft: "Draft saved",
  article_preview: "Preview opened",
  article_prepare_publication: "Publication checked",
  article_commit_publication: "Publication changed",
  editorial_article_get: "Article reviewed",
  editorial_prepare_site_selection: "Site selection checked",
  editorial_commit_site_selection: "Site selection changed",
  authorization_approval: "Connection",
  connection_revoke: "Connection revoked",
  oauth_revoke: "Connection revoked",
};

function connectionState(value: string) {
  return value === "active" ? "Active" : "Ended";
}

function activityResult(value: string) {
  return ({ pending: "Working", success: "Done", denied: "Denied", conflict: "Changed", failed: "Failed" } as Record<string, string>)[value] ?? "Done";
}

export function AgentAccess() {
  const [data, setData] = useState<AccessData | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const load = useCallback(async () => {
    const response = await fetch("/api/agent/access", { cache: "no-store" });
    if (!response.ok) throw new Error("Agent access unavailable.");
    setData(await response.json() as AccessData);
  }, []);

  useEffect(() => {
    let active = true;
    async function initialLoad() {
      try {
        const response = await fetch("/api/agent/access", { cache: "no-store" });
        if (!response.ok) throw new Error("Agent access unavailable.");
        const next = await response.json() as AccessData;
        if (active) setData(next);
      } catch {
        toast.error("Agent access unavailable.");
      }
    }
    void initialLoad();
    return () => { active = false; };
  }, []);

  async function revoke(id: number) {
    setPending(id);
    try {
      const response = await fetch("/api/agent/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "revoke", id }) });
      if (!response.ok) throw new Error("Revoke failed.");
      await load();
      toast.success("Connection revoked");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Revoke failed.");
    } finally {
      setPending(null);
    }
  }

  if (!data) return <div className="collection-list"><Gutter className="collection-list__wrap"><section className="agent-access"><h1>Agent access</h1></section></Gutter></div>;
  return (
    <div className="collection-list">
      <Gutter className="collection-list__wrap">
        <section className="agent-access">
          <h1>Agent access</h1>
          <div className="agent-access__adapters">
            {data.adapters.map((adapter) => <a className="btn btn--style-secondary btn--size-small" download href={`/api/agent/access?download=${encodeURIComponent(adapter.toLowerCase())}`} key={adapter}>{adapter}</a>)}
          </div>
          <h3>Connections</h3>
          <ul className="agent-access__list">
            {data.connections.length === 0 ? <li><span>No connections</span></li> : null}
            {data.connections.map((connection) => <li key={connection.id}><span>{connection.client}</span><span>{connectionState(connection.state)}</span>{connection.state === "active" ? <Button buttonStyle="secondary" disabled={pending === connection.id} onClick={() => void revoke(connection.id)} size="small">Revoke</Button> : null}</li>)}
          </ul>
          <h3>Recent activity</h3>
          <ul className="agent-access__list">
            {data.events.length === 0 ? <li><span>No activity</span></li> : null}
            {data.events.map((event) => <li key={event.id}><span>{activityLabels[event.tool] ?? "Activity"}</span><span>{activityResult(event.result)}</span><time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleDateString()}</time></li>)}
          </ul>
        </section>
      </Gutter>
    </div>
  );
}
