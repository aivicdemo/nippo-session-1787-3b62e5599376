import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('朝会報告管理システム - 優先度スコア計算エンジン', () => {
  test('SCEN-056: 影響度スコアが範囲外（101）である場合、エラーメッセージが表示される', () => {
    const input = {
      issueId: 'ISSUE-001',
      frequency: 50,
      impactScore: 101,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    expect(() => calculatePriorityScoreForIssue(input)).toThrow(/影響度スコアは0～100の範囲で指定してください/);
  });
});