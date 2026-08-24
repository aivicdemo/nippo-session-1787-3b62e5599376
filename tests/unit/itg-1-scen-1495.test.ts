import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-1495
  test('TextAnalysisServiceAdapterのextractKeywordsがタイムアウトしたとき、エラーを返す', () => {
    // Arrange
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockRejectedValue(
        new Error('API呼び出しが30秒でタイムアウトしました')
      ),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2026-01-31T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // Act & Assert
    expect(() =>
      extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter)
    ).toThrow(/タイムアウト/);
  });
});