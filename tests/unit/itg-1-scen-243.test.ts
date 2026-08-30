import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('朝会報告管理システム - 優先度スコア計算', () => {
  // SCEN-243: [edge] 課題の発生頻度と影響度から優先度スコア（0～100）を計算し、優先度ランク（高・中・低）を判定して返す。 - 経過日数が負の数のときという明示された境界条件で経過日数は0以上である必要があります。0日として処理します
  test('経過日数が負の数のとき、0日として処理して優先度スコアを計算する', () => {
    const input = {
      issueId: 'ISSUE-001',
      frequency: 50,
      impactScore: 75,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      elapsedDays: -5,
    };

    const result = calculatePriorityScoreForIssue(input);

    const expectedPriorityScore = 50 * 0.4 + 75 * 0.6;
    expect(result.issueId).toBe('ISSUE-001');
    expect(result.priorityScore).toBe(expectedPriorityScore);
    expect(result.priorityRank).toBe('MEDIUM');
    expect(result.colorCode).toBe('YELLOW');
  });
});