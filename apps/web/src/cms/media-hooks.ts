import type { CollectionAfterChangeHook } from "payload";

function copyBuffer(buffer: Buffer) {
  return Buffer.from(Uint8Array.from(buffer));
}

export const normalizeUploadBuffers: CollectionAfterChangeHook = ({ doc, req }) => {
  if (req.file?.data) {
    req.file.data = copyBuffer(req.file.data);
  }

  if (req.payloadUploadSizes) {
    for (const [name, buffer] of Object.entries(req.payloadUploadSizes)) {
      req.payloadUploadSizes[name] = copyBuffer(buffer);
    }
  }

  return doc;
};
