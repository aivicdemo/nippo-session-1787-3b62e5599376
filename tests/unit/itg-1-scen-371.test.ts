import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  // SCEN-371: [edge] 課題の発生頻度と影響度から優先度スコア（0～100）を計算し、優先度ランク（高・中・低）を判定して返す。 - 過去7日間の報告回数が0のときという明示された境界条件で発生頻度スコアは0点として扱います
  test('should calculate priority score with zero frequency as edge case', () => {
    const input = {
      issueId: 'ISSUE-001',
      frequency: 0,
      impactScore: 50,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    const result = calculatePriorityScoreForIssue(input);

    expect(result.issueId).toBe('ISSUE-001');
    expect(result.priorityScore).toBe(30);
    expect(result.priorityRank).toBe('MEDIUM');
    expect(result.colorCode).toBe('YELLOW');
  });
});