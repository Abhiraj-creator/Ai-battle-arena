export const generateBattleId = () => crypto.randomUUID();

export const formatDate = (dateStr) => {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const toMessage = (turn) => ({
  id: turn._id,
  problem: turn.problem,
  solution_1: turn.solution_1,
  solution_2: turn.solution_2,
  judge: turn.judge,
  isNew: false
});
