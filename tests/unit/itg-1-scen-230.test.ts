import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';
import { type IssuePriorityScoringInput, type IssuePriorityScore } from '../../src/logic/priority-scoring-engine';

describe('朝会報告管理システム - 優先度スコア計算エンジン', () => {
  // SCEN-230: [normal] 課題の発生頻度と影響度から優先度スコア（0～100）を計算し、優先度ランク（高・中・低）を判定して返す。
  test('should calculate priority score with frequency=80, impactScore=60, returning rank HIGH and color RED', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      frequency: 80,
      impactScore: 60,
    };

    const result: IssuePriorityScore = calculatePriorityScoreForIssue(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(72);
    expect(result.priorityRank).toBe('HIGH');
    expect(result.colorCode).toBe('RED');
  });
});