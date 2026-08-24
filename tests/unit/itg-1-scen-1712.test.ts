import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Color Coding', () => {
  // SCEN-1712
  test('should attach color metadata to extracted keywords based on severity classification', async () => {
    // Mock TextAnalysisServiceAdapter
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'システム障害', frequency: 3 },
        { keyword: 'データベース接続エラー', frequency: 2 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(85),
      classifyIssueSeverity: jest.fn()
        .mockResolvedValueOnce('HIGH')
        .mockResolvedValueOnce('HIGH')
        .mockResolvedValueOnce('MEDIUM')
        .mockResolvedValueOnce('LOW'),
    };

    // Input 1: System failure text (HIGH severity)
    const input1: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const result1: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input1,
      mockTextAnalysisService
    );

    // Verify first extraction has red color metadata
    expect(result1.keywords).toHaveLength(2);
    expect(result1.keywords[0]).toMatchObject({
      keyword: 'システム障害',
      frequency: 3,
      rank: 1,
    });
    expect(result1.keywords[0]).toHaveProperty('colorCode', '#FF0000');

    expect(result1.keywords[1]).toMatchObject({
      keyword: 'データベース接続エラー',
      frequency: 2,
      rank: 2,
    });
    expect(result1.keywords[1]).toHaveProperty('colorCode', '#FF0000');

    // Input 2: UI/UX text (MEDIUM severity)
    const input2: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const result2: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input2,
      mockTextAnalysisService
    );

    // Verify second extraction has yellow color metadata
    expect(result2.keywords).toHaveLength(2);
    expect(result2.keywords[0]).toHaveProperty('colorCode', '#FFFF00');
    expect(result2.keywords[1]).toHaveProperty('colorCode', '#FFFF00');

    // Input 3: Task management text (LOW severity)
    const input3: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const result3: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input3,
      mockTextAnalysisService
    );

    // Verify third extraction has green color metadata
    expect(result3.keywords).toHaveLength(2);
    expect(result3.keywords[0]).toHaveProperty('colorCode', '#00FF00');
    expect(result3.keywords[1]).toHaveProperty('colorCode', '#00FF00');

    // Verify extractedAt is recorded
    expect(result1.extractedAt).toBeInstanceOf(Date);
    expect(result2.extractedAt).toBeInstanceOf(Date);
    expect(result3.extractedAt).toBeInstanceOf(Date);

    // Verify analysis period is calculated correctly (7 days)
    expect(result1.analysisperiodDays).toBe(7);
    expect(result2.analysisperiodDays).toBe(7);
    expect(result3.analysisperiodDays).toBe(7);

    // Verify mock was called with correct severity classification
    expect(mockTextAnalysisService.classifyIssueSeverity).toHaveBeenCalledTimes(4);
  });
});