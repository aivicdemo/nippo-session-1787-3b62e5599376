import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue extraction and ranking - Deduplication edge cases', () => {
  // SCEN-1155
  test('should preserve near-duplicate keywords that differ by one character during deduplication', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'データベース接続エラー', frequency: 2 },
          { keyword: 'タベース接続エラー', frequency: 1 }
        ]
      })
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001'
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    expect(result.keywords).toHaveLength(2);
    expect(result.keywords[0].keyword).toBe('データベース接続エラー');
    expect(result.keywords[0].frequency).toBe(2);
    expect(result.keywords[0].rank).toBe(1);
    expect(result.keywords[1].keyword).toBe('タベース接続エラー');
    expect(result.keywords[1].frequency).toBe(1);
    expect(result.keywords[1].rank).toBe(2);
    expect(result.totalKeywordCount).toBe(2);
    expect(result.analysisperiodDays).toBe(7);
    expect(result.extractedAt).toBeInstanceOf(Date);
  });
});