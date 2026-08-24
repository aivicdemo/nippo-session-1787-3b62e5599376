import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  // SCEN-1485
  test('対象期間の日報データがnullのとき、エラーを返す', () => {
    const input = {
      teamId: 'team-001',
      startDate: new Date('2026-08-01T00:00:00Z'),
      endDate: new Date('2026-08-31T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue(null),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const result = extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);

    expect(result).toEqual({
      code: 'NO_DAILY_REPORT_DATA',
      message: '対象期間の日報データが見つかりません',
    });
    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});