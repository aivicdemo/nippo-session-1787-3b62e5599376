import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度スコア算出機能', () => {
  // SCEN-1725
  test('[error] チームID が undefined のとき集約処理がエラーになる', () => {
    const input = {
      teamId: undefined as any,
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    expect(() => {
      extractAndRankIssueKeywords(input);
    }).toThrow(/チームID|必須/);
  });
});