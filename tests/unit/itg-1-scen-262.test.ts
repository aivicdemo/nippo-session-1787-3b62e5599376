import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';
import type { IssuePriorityScoringInput, IssuePriorityScore } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  // SCEN-262: [edge] 課題の発生頻度と影響度から優先度スコア（0～100）を計算し、優先度ランク（高・中・低）を判定して返す。 - 最大発生回数が0のときという明示された境界条件で発生頻度スコアを0に設定します
  test('should calculate priority score with zero frequency', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      frequency: 0,
      impactScore: 50,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    const result: IssuePriorityScore = calculatePriorityScoreForIssue(input);

    const expectedPriorityScore = (0 * 0.4) + (50 * 0.6);
    expect(result.issueId).toBe('ISSUE-001');
    expect(result.priorityScore).toBe(expectedPriorityScore);
    expect(result.priorityRank).toBe('LOW');
    expect(result.colorCode).toBe('GREEN');
  });
});