import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Deduplication and Normalization', () => {
  // SCEN-2252: [edge] 課題の重複検出と正規化 - 同一課題キーワードがちょうど出現頻度の閾値（例：3回）で検出される場合、重複として正規化される
  test('should normalize and deduplicate issue keywords when frequency exactly meets threshold of 3', async () => {
    // Setup mock TextAnalysisServiceAdapter
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'DB接続エラー', frequency: 3 },
        { keyword: 'ネットワークタイムアウト', frequency: 1 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 3,
      requestUserId: 'user-pm-001',
    };

    // Execute function with mocked adapter
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    // Verify extraction was called with correct parameters
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(
      input.teamId,
      input.startDate,
      input.endDate
    );

    // Verify keyword deduplication and normalization
    // When frequency exactly equals minFrequencyThreshold (3), the keyword should be included
    const db_connection_error_keyword = result.keywords.find(
      (kw) => kw.keyword === 'DB接続エラー'
    );
    expect(db_connection_error_keyword).toBeDefined();
    expect(db_connection_error_keyword?.frequency).toBe(3);
    expect(db_connection_error_keyword?.rank).toBe(1);

    // Verify that keywords below threshold are filtered out
    const network_timeout_keyword = result.keywords.find(
      (kw) => kw.keyword === 'ネットワークタイムアウト'
    );
    expect(network_timeout_keyword).toBeUndefined();

    // Verify total keyword count reflects all extracted keywords before filtering
    expect(result.totalKeywordCount).toBe(2);

    // Verify ranking order by frequency (descending)
    expect(result.keywords.length).toBe(1);
    expect(result.keywords[0].rank).toBe(1);
    expect(result.keywords[0].frequency).toBe(3);

    // Verify extraction metadata
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);
  });
});