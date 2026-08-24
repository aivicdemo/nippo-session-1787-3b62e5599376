import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・ランク付け機能', () => {
  // SCEN-745: [error] 課題自動抽出・優先度判定機能 - 日報テキストがundefinedのとき、エラーを返す
  test('日報テキストがundefinedのとき、INVALID_INPUT_TEXTエラーコードと共に適切なエラーメッセージを返す', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
    };

    const undefinedReportText = undefined;
    const teamId = 'team-001';
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-07T23:59:59Z');
    const requestUserId = 'user-001';

    const result = extractAndRankIssueKeywords(
      {
        teamId,
        startDate,
        endDate,
        minFrequencyThreshold: 1,
        requestUserId,
      },
      mockTextAnalysisServiceAdapter,
      undefinedReportText as any
    );

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errorCode: 'INVALID_INPUT_TEXT',
        errorMessage: expect.stringContaining('日報テキストが不正です'),
      })
    );

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});