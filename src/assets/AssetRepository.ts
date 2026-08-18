import Dexie, { type EntityTable } from "dexie";
import type {
  AssetReference,
  TransitionProject,
} from "../project/model/project";

interface StoredAsset {
  id: string;
  blob: Blob;
  updatedAt: string;
}
interface StoredDraft {
  id: string;
  project: TransitionProject;
  updatedAt: string;
}
export interface StoredTemplate {
  id: string;
  name: string;
  project: TransitionProject;
  updatedAt: string;
}
const database = new Dexie("transition-builder") as Dexie & {
  assets: EntityTable<StoredAsset, "id">;
  drafts: EntityTable<StoredDraft, "id">;
  templates: EntityTable<StoredTemplate, "id">;
};
database.version(1).stores({ assets: "id, updatedAt" });
database
  .version(2)
  .stores({ assets: "id, updatedAt", drafts: "id, updatedAt" });
database.version(3).stores({
  assets: "id, updatedAt",
  drafts: "id, updatedAt",
  templates: "id, name, updatedAt",
});

export type AssetLimit =
  "label-image" | "sequence-image" | "background-image" | "font";
const limits: Record<AssetLimit, number> = {
  "label-image": 2 * 1024 * 1024,
  "sequence-image": 1024 * 1024,
  "background-image": 5 * 1024 * 1024,
  font: 5 * 1024 * 1024,
};
const imageTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const fontExtensions = ["woff", "woff2", "ttf", "otf"];
export const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} МБ`
    : `${Math.ceil(bytes / 1024)} КБ`;
export function validateAsset(file: File, kind: AssetLimit) {
  const max = limits[kind];
  if (file.size > max)
    throw new Error(
      `Этот файл весит ${formatSize(file.size)}. Максимально допустимый размер — ${formatSize(max)}.`,
    );
  if (kind === "font") {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !fontExtensions.includes(ext))
      throw new Error("Поддерживаются шрифты WOFF, WOFF2, TTF и OTF.");
  } else if (!imageTypes.includes(file.type))
    throw new Error("Поддерживаются изображения PNG, JPG, GIF и WebP.");
}
export async function saveLocalAsset(
  file: File,
  kind: AssetLimit,
  assetKind: "image" | "font",
): Promise<AssetReference> {
  validateAsset(file, kind);
  const id = globalThis.crypto.randomUUID();
  await database.assets.put({
    id,
    blob: file,
    updatedAt: new Date().toISOString(),
  });
  return {
    id,
    kind: assetKind,
    source: "local",
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
  };
}
export async function getAssetBlob(id: string) {
  return (await database.assets.get(id))?.blob;
}
export async function putAssetBlob(id: string, blob: Blob) {
  await database.assets.put({ id, blob, updatedAt: new Date().toISOString() });
}
export async function saveDraft(project: TransitionProject) {
  await database.drafts.put({
    id: "current",
    project: structuredClone(project),
    updatedAt: new Date().toISOString(),
  });
}
export async function getDraft() {
  return (await database.drafts.get("current"))?.project;
}
export async function deleteDraft() {
  await database.drafts.delete("current");
}
export async function saveTemplate(name: string, project: TransitionProject) {
  const item: StoredTemplate = {
    id: globalThis.crypto.randomUUID(),
    name: name.trim(),
    project: structuredClone(project),
    updatedAt: new Date().toISOString(),
  };
  await database.templates.put(item);
  return item;
}
export async function listTemplates() {
  return database.templates.orderBy("updatedAt").reverse().toArray();
}
export async function deleteTemplate(id: string) {
  await database.templates.delete(id);
}
export function createUrlAsset(
  url: string,
  kind: "image" | "font",
): AssetReference {
  const parsed = new URL(url);
  return {
    id: globalThis.crypto.randomUUID(),
    kind,
    source: "url",
    name: parsed.pathname.split("/").pop() || "Удалённый ресурс",
    mimeType: "",
    size: null,
    url: parsed.toString(),
  };
}
