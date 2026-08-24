import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-1178
  test('日報テキストが空文字列のとき入力値検証エラーをスローする', () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-123';
    const emptyReportText = '';

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    expect(() =>
      extractAndRankIssueKeywords(
        {
          teamId,
          startDate,
          endDate,
          minFrequencyThreshold,
          requestUserId,
          reportTexts: [emptyReportText],
        },
        mockTextAnalysisAdapter
      )
    ).toThrow(/日報テキスト/);

    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});