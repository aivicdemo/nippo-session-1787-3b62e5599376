import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';
import type { IssuePriorityScoringInput } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine - calculatePriorityScoreForIssue', () => {
  // SCEN-251: チーム総人数が0の境界条件でエラーをスロー
  test('should throw error when teamSize is 0 (division by zero in impact score normalization)', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      frequency: 50,
      impactScore: 75,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    const teamSize = 0;

    expect(() => {
      calculatePriorityScoreForIssue(input, teamSize);
    }).toThrow(/チーム|影響度|スコア|範囲|データ|必須/i);
  });
});