"use client";

import { useEffect } from "react";

const actions = [
  ["#field-portrait .upload-relationship-details__edit", "Edit portrait"],
  ["#field-portrait .upload-relationship-details__remove", "Remove portrait"],
  ["#field-coverImage .upload-relationship-details__edit", "Edit cover image"],
  ["#field-coverImage .upload-relationship-details__remove", "Remove cover image"],
] as const;

export function UploadAccessibility() {
  useEffect(() => {
    const apply = () => {
      for (const [selector, label] of actions) {
        document.querySelector<HTMLButtonElement>(selector)?.setAttribute("aria-label", label);
      }
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
