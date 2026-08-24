import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  // SCEN-1055: [error] 課題キーワード自動抽出機能 - 抽出されたキーワードが null のとき、抽出結果エラーになる
  test('should return error when TextAnalysisServiceAdapter returns null keywords', async () => {
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

    const reportData = [
      {
        reportId: 'report-001',
        reportText: 'システム連携がうまくいきません。API タイムアウトの問題があります。',
        reportDate: new Date('2024-01-10T09:00:00Z'),
      },
      {
        reportId: 'report-002',
        reportText: 'API タイムアウトが再発しています。データベース遅延が原因かもしれません。',
        reportDate: new Date('2024-01-11T09:00:00Z'),
      },
    ];

    await expect(
      extractAndRankIssueKeywords(input, mockTextAnalysisAdapter, reportData),
    ).rejects.toThrow(/キーワード抽出/);
  });
});