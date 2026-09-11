import { getStore } from "@netlify/blobs";

function recapStore() {
  return getStore("recaps");
}

export async function getRecap(key: string): Promise<unknown | null> {
  return recapStore().get(key, { type: "json" });
}

export async function setRecap(key: string, value: unknown): Promise<void> {
  await recapStore().setJSON(key, value);
}
