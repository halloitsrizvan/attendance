export function buildMenteeStandings(relations, leaderboard) {
  // Leaderboard lookups may repeat a student for multiple mentor relations.
  const ranked = new Map();
  for (const row of leaderboard) {
    const id = row?.student?._id?.toString();
    if (id && !ranked.has(id)) ranked.set(id, { ...row, globalRank: ranked.size + 1 });
  }
  const assigned = new Map();
  for (const relation of relations) {
    const student = relation?.menteeId;
    const id = student?._id?.toString();
    if (!id || assigned.has(id)) continue;
    const standing = ranked.get(id);
    assigned.set(id, {
      student,
      totalPoints: standing?.totalPoints ?? 0,
      achievementCount: standing?.achievementCount ?? 0,
      globalRank: standing?.globalRank ?? null,
    });
  }
  return [...assigned.values()].sort((a, b) => b.totalPoints - a.totalPoints || Number(a.student.ADNO || 0) - Number(b.student.ADNO || 0));
}
