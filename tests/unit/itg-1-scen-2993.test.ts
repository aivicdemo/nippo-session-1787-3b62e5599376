import { extractAndRankIssueKeywords, type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出機能', () => {
  // SCEN-2993
  test('日報テキストが空文字列のとき、キーワード抽出がエラーになる', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        error: 'Empty text provided',
        code: 'EMPTY_INPUT',
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-pm-001',
    };

    const emptyReportText = '';

    expect(async () => {
      await extractAndRankIssueKeywords(
        input,
        mockTextAnalysisServiceAdapter
      );
    }).toThrow(/課題分析|Empty text|EMPTY_INPUT/);
  });
});