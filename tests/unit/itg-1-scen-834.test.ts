import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-834
  test('[error] 日報IDが欠落している状態でキーワード抽出を実行したときエラーになる', () => {
    const stubTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockImplementation(() => {
        throw new Error('ValidationError: Daily report ID is required');
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    expect(() =>
      extractAndRankIssueKeywords(
        {
          teamId: 'team-001',
          startDate: new Date('2024-01-15T00:00:00Z'),
          endDate: new Date('2024-01-21T23:59:59Z'),
          minFrequencyThreshold: 1,
          requestUserId: 'user-001',
        },
        null as any,
        stubTextAnalysisServiceAdapter
      )
    ).toThrow(/Daily report ID is required/);
  });
});