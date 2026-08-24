import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Error Handling', () => {
  // SCEN-2242: [error] 課題重複検出・正規化機能 - 日報オブジェクトのreporterIdが未定義のときエラーになる
  test('should throw TypeError with validation_error message when reporterId is undefined in report input', async () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['バグ', 'パフォーマンス'],
        confidence: 0.85,
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const invalidInput: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const reportWithUndefinedReporterId = {
      title: '課題検出テスト',
      content: '昨日の課題：バグが3件、パフォーマンス問題が2件',
      reporterId: undefined,
      timestamp: '2024-01-15T09:00:00Z',
    };

    try {
      await extractAndRankIssueKeywords(
        invalidInput,
        mockTextAnalysisService as any,
        [reportWithUndefinedReporterId] as any
      );
      fail('Expected TypeError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(TypeError);
      expect((error as Error).message).toMatch(/reporterId/);
      expect((error as Error).message).toMatch(/必須/);
    }
  });
});