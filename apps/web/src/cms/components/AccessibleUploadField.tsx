"use client";

import {
  BulkUploadProvider,
  Button,
  UploadInput,
  useConfig,
  useDocumentDrawer,
  useField,
} from "@payloadcms/ui";
import type { UploadInputProps } from "@payloadcms/ui";
import type { UploadFieldClientProps } from "payload";
import { useCallback, useState } from "react";

function relationID(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string" && Number.isFinite(Number(value))) return Number(value);
  if (value && typeof value === "object") {
    if ("value" in value) return relationID((value as { value: unknown }).value);
    if ("id" in value) return relationID((value as { id: unknown }).id);
  }
  return undefined;
}

export function AccessibleUploadField({ field, path: pathFromProps, readOnly, validate }: UploadFieldClientProps) {
  const {
    admin: { allowCreate, className, description, isSortable } = {},
    hasMany,
    label,
    localized,
    maxRows,
    relationTo,
    required,
  } = field;
  const { config } = useConfig();
  const validateField = useCallback((value: unknown, options: Parameters<NonNullable<typeof validate>>[1]) => (
    typeof validate === "function" ? validate(value, { ...options, required }) : true
  ), [required, validate]);
  const {
    customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    disabled,
    filterOptions,
    path,
    setValue,
    showError,
    value,
  } = useField({ potentiallyStalePath: pathFromProps, validate: validateField as never });
  const collectionSlug = Array.isArray(relationTo) ? relationTo[0] : relationTo;
  const id = relationID(value);
  const [DocumentDrawer, , { openDrawer }] = useDocumentDrawer({ collectionSlug, id });
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshSelectedDocument = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);
  const fieldLabel = typeof label === "string" ? label.toLowerCase() : "image";
  const locked = Boolean(readOnly || disabled);

  return (
    <BulkUploadProvider drawerSlugPrefix={pathFromProps}>
      <UploadInput
        key={refreshKey}
        AfterInput={AfterInput}
        allowCreate={allowCreate !== false}
        api={config.routes.api}
        BeforeInput={BeforeInput}
        className={className}
        Description={Description}
        description={description}
        displayPreview={field.displayPreview}
        Error={Error}
        filterOptions={filterOptions}
        hasMany={hasMany}
        isSortable={isSortable}
        label={label}
        Label={Label}
        localized={localized}
        maxRows={maxRows}
        onChange={setValue}
        path={path}
        readOnly={id ? true : locked}
        relationTo={relationTo}
        required={required}
        serverURL={config.serverURL}
        showError={showError}
        value={value as UploadInputProps["value"]}
      />
      {id && !locked ? (
        <div className="accessible-upload-actions">
          <Button buttonStyle="secondary" margin={false} onClick={openDrawer} size="small">Edit {fieldLabel}</Button>
          <Button buttonStyle="secondary" margin={false} onClick={() => setValue(null)} size="small">Remove {fieldLabel}</Button>
          <DocumentDrawer onSave={refreshSelectedDocument} />
        </div>
      ) : null}
    </BulkUploadProvider>
  );
}
