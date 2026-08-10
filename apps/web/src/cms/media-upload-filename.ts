import type { Config, Plugin, RawPayloadComponent } from "payload";

export const VERCEL_BLOB_CLIENT_HANDLER =
  "@payloadcms/storage-vercel-blob/client#VercelBlobClientUploadHandler";
export const UNIQUE_VERCEL_BLOB_CLIENT_HANDLER =
  "/cms/components/UniqueVercelBlobClientUploadHandler#UniqueVercelBlobClientUploadHandler";

export function uniqueMediaUploadFilename(filename: string, suffix: string) {
  const basename = filename.replace(/^.*[\\/]/, "") || "image";
  const extensionIndex = basename.lastIndexOf(".");
  const extensionStem = extensionIndex > 0 ? basename.slice(0, extensionIndex) : "";
  const hasUsableExtension =
    extensionIndex > 0 &&
    extensionIndex < basename.length - 1 &&
    Boolean(extensionStem.replace(/^\.+|\.+$/g, ""));

  if (!hasUsableExtension) {
    const visibleBasename = basename.replace(/^\.+|\.+$/g, "") || "image";
    return `${visibleBasename}-${suffix}`;
  }

  return `${basename.slice(0, extensionIndex)}-${suffix}${basename.slice(extensionIndex)}`;
}

function isRawComponent(component: unknown): component is RawPayloadComponent {
  return Boolean(component && typeof component === "object" && "path" in component);
}

export function uniqueVercelBlobClientUploadPlugin(): Plugin {
  const plugin: Plugin = (config: Config) => {
    const providers = config.admin?.components?.providers;
    if (!providers?.length) return config;

    return {
      ...config,
      admin: {
        ...config.admin,
        components: {
          ...config.admin?.components,
          providers: providers.map((provider) =>
            isRawComponent(provider) && provider.path === VERCEL_BLOB_CLIENT_HANDLER
              ? { ...provider, path: UNIQUE_VERCEL_BLOB_CLIENT_HANDLER }
              : provider,
          ),
        },
      },
    };
  };

  plugin.order = 10;
  return plugin;
}
