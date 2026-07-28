"use client";

import { useRowLabel } from "@payloadcms/ui";

type LinkRow = {
  label?: string;
  type?: string;
  url?: string;
};

export function ProfileLinkRowLabel() {
  const { data, rowNumber } = useRowLabel<LinkRow>();
  const label = data.label || data.type?.replaceAll("_", " ") || `Link ${(rowNumber ?? 0) + 1}`;
  const previewable = data.url?.startsWith("https://") || data.url?.startsWith("http://") || data.url?.startsWith("mailto:");

  return (
    <span className="profile-link-row">
      <span>{label}</span>
      {previewable ? (
        <a href={data.url} onClick={(event) => event.stopPropagation()} rel="noreferrer" target="_blank">Open</a>
      ) : null}
    </span>
  );
}
