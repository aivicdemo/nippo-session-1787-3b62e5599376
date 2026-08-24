import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  test('SCEN-631: 優先度スコア計算対象の課題が0件のとき、空の優先度別課題一覧を返す', () => {
    const emptyIssues: any[] = [];

    const result = calculateIssuePriorityScore(emptyIssues);

    expect(result).toEqual({
      high: [],
      medium: [],
      low: []
    });
    expect(result.high).toHaveLength(0);
    expect(result.medium).toHaveLength(0);
    expect(result.low).toHaveLength(0);
  });
});