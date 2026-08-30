import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('朝会報告管理システム - 優先度スコア計算エンジン', () => {
  test('SCEN-353: 課題の発生頻度と影響度から優先度スコアを計算し、優先度ランクと色分けコードを返す', () => {
    // 入力値の準備
    const input = {
      issueId: 'ISSUE-001',
      frequency: 50,
      impactScore: 75,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    // テスト対象関数を呼び出す
    const result = calculatePriorityScoreForIssue(input);

    // 期待される優先度スコア：priorityScore = (frequency × frequencyWeight) + (impactScore × impactWeight)
    // = (50 × 0.4) + (75 × 0.6) = 20 + 45 = 65
    const expectedPriorityScore = 65;

    // 検証: issueId
    expect(result.issueId).toBe('ISSUE-001');

    // 検証: priorityScore（計算式から導出した具体値）
    expect(result.priorityScore).toBe(expectedPriorityScore);

    // 検証: priorityRank（スコア65は60～79の範囲のため 'MEDIUM'）
    expect(result.priorityRank).toBe('MEDIUM');

    // 検証: colorCode（MEDIUM ランクは 'YELLOW'）
    expect(result.colorCode).toBe('YELLOW');
  });
});