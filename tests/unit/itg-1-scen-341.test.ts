import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  // SCEN-341: [normal] 課題の発生頻度と影響度から優先度スコア（0～100）を計算し、優先度ランク（高・中・低）を判定して返す。
  test('should calculate priority score 86 with HIGH rank and RED color for issue with frequency 80 and impactScore 90', () => {
    const result = calculatePriorityScoreForIssue({
      issueId: 'ISSUE-001',
      frequency: 80,
      impactScore: 90,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    });

    expect(result.issueId).toBe('ISSUE-001');
    expect(result.priorityScore).toBe(86);
    expect(result.priorityRank).toBe('HIGH');
    expect(result.colorCode).toBe('RED');
  });
});