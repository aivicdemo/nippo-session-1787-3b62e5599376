import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度判定機能', () => {
  // SCEN-1323
  test('抽出済みキーワード配列が null のとき優先度判定を中止し例外を発生させる', () => {
    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn().mockReturnValue(null),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const reportTexts = [
      '昨日はバグ修正、今日はテスト実施、課題は納期遅延',
    ];

    expect(() => {
      extractAndRankIssueKeywords(
        input,
        textAnalysisServiceAdapterStub,
        reportTexts,
      );
    }).toThrow(/キーワード抽出/);
  });
});