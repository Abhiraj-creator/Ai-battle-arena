import { authHeaders } from "./auth";

export function streamBattleTurn({ input, judgeProvider, battleId, turnIndex }) {
  return fetch("/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders()
    },
    body: JSON.stringify({
      input,
      judge_provider: judgeProvider,
      battleId,
      turnIndex
    })
  });
}
