import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-2928
  test('レポートテキストが空文字列のとき、処理を中断してエラーを返す', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-123',
    };

    const result = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter,
      ''
    );

    expect(result).toEqual({
      code: 'EMPTY_REPORT_TEXT',
      message: 'レポートテキストが空です。処理を中断します。',
    });

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});