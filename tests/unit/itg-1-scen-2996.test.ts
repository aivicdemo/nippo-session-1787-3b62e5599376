import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking', () => {
  // SCEN-2996
  test('should handle null keyword array from TextAnalysisServiceAdapter gracefully', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue(null),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const reportContent =
      'サーバーの応答遅延が発生。データベース接続タイムアウトでユーザーがエラーを経験している';

    expect(async () => {
      await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter, reportContent);
    }).rejects.toThrow(/抽出されたキーワード配列が null/);
  });
});