import { getAssetBlob, putAssetBlob } from "../../assets/AssetRepository";
import type { TransitionProject } from "../model/project";
import { parseProject } from "../validation/validateProject";

interface ProjectFile extends TransitionProject {
  embeddedAssets?: Record<string, string>;
}

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

export async function serializeProject(project: TransitionProject) {
  const embeddedAssets: Record<string, string> = {};
  await Promise.all(
    project.assets
      .filter((asset) => asset.source === "local")
      .map(async (asset) => {
        const blob = await getAssetBlob(asset.id);
        if (!blob) throw new Error(`Не найден локальный файл «${asset.name}».`);
        embeddedAssets[asset.id] = await blobToDataUrl(blob);
      }),
  );
  const output: ProjectFile = {
    ...structuredClone(project),
    ...(Object.keys(embeddedAssets).length ? { embeddedAssets } : {}),
  };
  return JSON.stringify(output, null, 2);
}

export async function deserializeProject(json: string) {
  const raw = JSON.parse(json) as ProjectFile;
  const embeddedAssets = raw.embeddedAssets ?? {};
  delete raw.embeddedAssets;
  const project = parseProject(JSON.stringify(raw));
  for (const asset of project.assets.filter(
    (item) => item.source === "local",
  )) {
    const dataUrl = embeddedAssets[asset.id];
    if (!dataUrl)
      throw new Error(`В проекте отсутствует файл «${asset.name}».`);
    const blob = await (await fetch(dataUrl)).blob();
    await putAssetBlob(asset.id, blob);
  }
  return project;
}

export function projectFileName(name: string) {
  const safe = name
    .trim()
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-|-$/g, "");
  return `${safe || "transition"}.json`;
}
