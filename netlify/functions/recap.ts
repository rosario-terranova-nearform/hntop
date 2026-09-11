import { getRecap, setRecap } from "../lib/recapStore.js";

export default async () => {
  const key = "_scaffold-test";
  const value = { ok: true, writtenAt: new Date().toISOString() };

  await setRecap(key, value);
  const readBack = await getRecap(key);

  return Response.json({ scaffold: "ok", readBack });
};
