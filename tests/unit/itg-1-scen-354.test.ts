import { calculatePriorityScoreForIssue, type IssuePriorityScoringInput, type IssuePriorityScore } from '../../src/logic/priority-scoring-engine';

describe('priority-scoring-engine', () => {
  // SCEN-354: [edge] 課題の発生頻度と影響度から優先度スコア（0～100）を計算し、優先度ランク（高・中・低）を判定して返す。 - 本日報告された課題キーワードが空のときという明示された境界条件で本日は新規課題報告がありません。過去のトレンドを参照してください
  test('should handle zero frequency and zero impact score by returning low priority', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      frequency: 0,
      impactScore: 0,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    const result: IssuePriorityScore = calculatePriorityScoreForIssue(input);

    expect(result.issueId).toBe('ISSUE-001');
    expect(result.priorityScore).toBe(0);
    expect(result.priorityRank).toBe('LOW');
    expect(result.colorCode).toBe('GREEN');
  });
});