import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  // SCEN-356: [edge] 課題の発生頻度と影響度から優先度スコア（0～100）を計算し、優先度ランク（高・中・低）を判定して返す。 - 優先度スコアが負の値になるときという明示された境界条件でスコアは0以上100以下に正規化されます
  test('should normalize negative priority score to 0 and determine rank as LOW with GREEN color', () => {
    const result = calculatePriorityScoreForIssue({
      issueId: 'issue-001',
      frequency: 5,
      impactScore: 10,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    });

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(0);
    expect(result.priorityRank).toBe('LOW');
    expect(result.colorCode).toBe('GREEN');
  });
});