import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-743
  test('日報テキストが空文字列のとき、エラーを返す', () => {
    // arrange
    const emptyReportText = '';
    const teamId = 'team-001';
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-07T23:59:59Z');
    const requestUserId = 'user-001';
    const minFrequencyThreshold = 1;

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // act & assert
    expect(() => {
      extractAndRankIssueKeywords(
        {
          teamId,
          startDate,
          endDate,
          minFrequencyThreshold,
          requestUserId,
        },
        emptyReportText,
        mockTextAnalysisServiceAdapter,
      );
    }).toThrow(/EMPTY_TEXT_ERROR/);

    // verify external service was not called
    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});