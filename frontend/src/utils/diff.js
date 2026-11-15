/**
 * Word-level visual diff algorithm using Longest Common Subsequence (LCS).
 * Returns array of { type: 'added' | 'removed' | 'common', value: string }
 */
export function computeWordDiff(oldText = '', newText = '') {
  if (!oldText && !newText) return [];
  if (!oldText) return [{ type: 'added', value: newText }];
  if (!newText) return [{ type: 'removed', value: oldText }];

  // Tokenize by words and spaces/punctuation
  const tokenize = (str) => str.match(/\S+|\s+/g) || [];
  const words1 = tokenize(oldText);
  const words2 = tokenize(newText);

  const m = words1.length;
  const n = words2.length;

  // Optimize for identical texts
  if (oldText === newText) {
    return [{ type: 'common', value: oldText }];
  }

  // Dynamic programming table for LCS
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (words1[i - 1] === words2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to assemble diff tokens
  const rawDiff = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && words1[i - 1] === words2[j - 1]) {
      rawDiff.unshift({ type: 'common', value: words1[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawDiff.unshift({ type: 'added', value: words2[j - 1] });
      j--;
    } else if (i > 0) {
      rawDiff.unshift({ type: 'removed', value: words1[i - 1] });
      i--;
    }
  }

  // Group consecutive tokens of same type
  const grouped = [];
  for (const token of rawDiff) {
    if (grouped.length > 0 && grouped[grouped.length - 1].type === token.type) {
      grouped[grouped.length - 1].value += token.value;
    } else {
      grouped.push({ type: token.type, value: token.value });
    }
  }

  return grouped;
}
