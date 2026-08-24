import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Impact Score Validation', () => {
  // SCEN-1143: [error] 抽出課題データ有効性検証機能 - チーム波及度スコアが 101 のときは検証エラーになる
  test('should throw validation error when impact score exceeds 100', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'database_performance',
            frequency: 3,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(101),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-123',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-31T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-456',
    };

    await expect(
      extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter),
    ).rejects.toThrow(/チーム波及度スコア/);
  });
});