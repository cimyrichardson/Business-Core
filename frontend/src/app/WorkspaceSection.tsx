"use client";

import WorkspaceShell from "./WorkspaceShell";

export default function WorkspaceSection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <WorkspaceShell>
      <section>
        <p className="workspace-section-kicker">Business Core</p>
        <h2 className="mt-2 text-3xl font-bold">{title}</h2>
        <p className="workspace-muted mt-2 max-w-2xl text-sm leading-6">
          {description}
        </p>
        <div className="workspace-card mt-7 p-6 shadow-sm sm:p-8">
          <p className="font-semibold">Fonksyon sa a ap vini byento.</p>
          <p className="workspace-muted mt-2 text-sm leading-6">
            Paj la pare. Done ak aksyon yo ap disponib lè API biznis la konekte.
          </p>
        </div>
      </section>
    </WorkspaceShell>
  );
}
