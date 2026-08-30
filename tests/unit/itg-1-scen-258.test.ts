import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';
import type { IssuePriorityScoringInput, IssuePriorityScore } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  // SCEN-258: [normal] 課題の発生頻度と影響度から優先度スコア（0～100）を計算し、優先度ランク（高・中・低）を判定して返す。
  test('should calculate priority score with frequency 45 and impact score 75 using default weights', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      frequency: 45,
      impactScore: 75,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    const result: IssuePriorityScore = calculatePriorityScoreForIssue(input);

    expect(result.issueId).toBe('ISSUE-001');
    expect(result.priorityScore).toBe(63);
    expect(result.priorityRank).toBe('MEDIUM');
    expect(result.colorCode).toBe('YELLOW');
  });
});