import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';
import type { IssuePriorityScoringInput, IssuePriorityScore } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  // SCEN-332: [normal] 課題の発生頻度と影響度から優先度スコア（0～100）を計算し、優先度ランク（高・中・低）を判定して返す
  test('calculatePriorityScoreForIssue should calculate priority score with frequency 60 and impact score 80 returning HIGH rank with RED color code', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      frequency: 60,
      impactScore: 80,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    const result: IssuePriorityScore = calculatePriorityScoreForIssue(input);

    expect(result.issueId).toBe('ISSUE-001');
    expect(result.priorityScore).toBe(72);
    expect(result.priorityRank).toBe('HIGH');
    expect(result.colorCode).toBe('RED');
  });
});