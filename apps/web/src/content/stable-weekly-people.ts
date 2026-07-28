function weeklyScore(week: number, slug: string) {
  return Array.from(`${week}:${slug}`).reduce(
    (value, character) => ((value * 31) + character.charCodeAt(0)) >>> 0,
    7,
  );
}

function currentUTCWeek(now: Date) {
  const mondayEpoch = Date.UTC(1970, 0, 5);
  return Math.floor((now.getTime() - mondayEpoch) / 604_800_000);
}

export function stableWeeklyPeople<
  T extends { slug: string; spotlightExcluded?: boolean; spotlightPinnedUntil?: string | null },
>(items: T[], count: number, now = new Date()) {
  const week = currentUTCWeek(now);
  const eligible = items.filter((item) => !item.spotlightExcluded);
  const pinned = eligible
    .filter((item) => item.spotlightPinnedUntil && new Date(item.spotlightPinnedUntil).getTime() > now.getTime())
    .sort((left, right) => (right.spotlightPinnedUntil ?? "").localeCompare(left.spotlightPinnedUntil ?? ""))
    .slice(0, 1);
  const pinnedSlugs = new Set(pinned.map((item) => item.slug));
  const rotationPool = eligible.filter((item) => !pinnedSlugs.has(item.slug));
  const rotationCount = Math.max(0, count - pinned.length);
  const stablePool = [...rotationPool]
    .sort((left, right) => weeklyScore(0, left.slug) - weeklyScore(0, right.slug));
  const weeklyCohort = stablePool.filter((_, index) => index % 2 === Math.abs(week) % 2);
  const candidates = rotationPool.length >= rotationCount * 2 && weeklyCohort.length >= rotationCount
    ? weeklyCohort
    : rotationPool;
  const rotated = [...candidates]
    .sort((left, right) => weeklyScore(week, left.slug) - weeklyScore(week, right.slug));
  return [...pinned, ...rotated.slice(0, rotationCount)];
}
