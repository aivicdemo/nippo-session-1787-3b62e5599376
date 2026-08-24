import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け機能', () => {
  test('SCEN-1493: 対象期間が7日間でない場合、INVALID_PERIOD_RANGEエラーを返す', () => {
    // Arrange
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-06T23:59:59Z'); // 5日間（7日間ではない）

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // Act & Assert
    expect(() =>
      extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter)
    ).toThrow(/INVALID_PERIOD_RANGE/);
  });
});