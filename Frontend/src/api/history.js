import { authHeaders, getToken } from "./auth";

export async function fetchBattleList() {
  if (!getToken()) return [];

  const res = await fetch("/api/history", {
    headers: authHeaders()
  });

  return res.ok ? res.json() : [];
}

export async function fetchBattleTurns(battleId) {
  const res = await fetch(`/api/history/battle/${battleId}`, {
    headers: authHeaders()
  });

  return res.ok ? res.json() : null;
}

export async function deleteBattleById(battleId) {
  const res = await fetch(`/api/history/battle/${battleId}`, {
    method: "DELETE",
    headers: authHeaders()
  });

  return res.ok;
}
