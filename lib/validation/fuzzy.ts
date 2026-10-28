/** Jaro-Winkler similarity + phonetic normalisation tuned for Indian names (isomorphic). */

export function jaroWinkler(a: string, b: string, prefixScale = 0.1): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const matchDist = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
  const aM = new Array(a.length).fill(false);
  const bM = new Array(b.length).fill(false);
  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const lo = Math.max(0, i - matchDist);
    const hi = Math.min(i + matchDist + 1, b.length);
    for (let j = lo; j < hi; j++) {
      if (bM[j] || a[i] !== b[j]) continue;
      aM[i] = bM[j] = true;
      matches++;
      break;
    }
  }
  if (!matches) return 0;
  let t = 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aM[i]) continue;
    while (!bM[k]) k++;
    if (a[i] !== b[k]) t++;
    k++;
  }
  const jaro = (matches / a.length + matches / b.length + (matches - t / 2) / matches) / 3;
  let prefix = 0;
  for (let i = 0; i < Math.min(4, a.length, b.length) && a[i] === b[i]; i++) prefix++;
  return jaro + prefix * prefixScale * (1 - jaro);
}

const RULES: [RegExp, string][] = [
  [/[^a-z ]/g, ""],
  [/(th|dh)/g, "d"],
  [/(bh)/g, "b"],
  [/(ph|f)/g, "f"],
  [/(sh|ch|chh)/g, "s"],
  [/(kh|q|ck)/g, "k"],
  [/(gh)/g, "g"],
  [/(jh|z)/g, "j"],
  [/w/g, "v"],
  [/aa/g, "a"],
  [/(ee|ii)/g, "i"],
  [/(oo|uu)/g, "u"],
  [/y\b/g, "i"],
  [/h\b/g, ""],
  [/(.)\1+/g, "$1"],
];

/** "Subodh Patel" and "Suboth Patel" both normalise to "subod patel" */
export function phoneticNormalise(name: string): string {
  let s = (name || "").toLowerCase().normalize("NFKD").replace(/\s+/g, " ").trim();
  for (const [re, rep] of RULES) s = s.replace(re, rep);
  return s.replace(/\s+/g, " ").trim();
}

export function nameSimilarity(a: string, b: string): number {
  return jaroWinkler(phoneticNormalise(a), phoneticNormalise(b));
}
