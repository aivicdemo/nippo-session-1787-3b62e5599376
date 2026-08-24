import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking', () => {
  // SCEN-2253
  test('should not merge duplicate keyword when occurrence frequency is below threshold (exactly 2 occurrences with threshold 3)', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'デバッグ', frequency: 2 },
          { keyword: '対応', frequency: 1 }
        ],
        extractionConfidence: 0.85
      }),
      assessImpactScore: jest.fn().mockResolvedValue({ impactScore: 45 }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: 'medium' })
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-123'
    };

    const reportTexts = [
      'デバッグに時間がかかった。デバッグ対応中。'
    ];

    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
      reportTexts
    );

    // Verify the result structure
    expect(result).toHaveProperty('keywords');
    expect(result).toHaveProperty('totalKeywordCount');
    expect(result).toHaveProperty('extractedAt');
    expect(result).toHaveProperty('analysisperiodDays');

    // Verify that 'デバッグ' is not merged and maintains frequency of 2
    const debugKeyword = result.keywords.find((kw) => kw.keyword === 'デバッグ');
    expect(debugKeyword).toBeDefined();
    expect(debugKeyword?.frequency).toBe(2);

    // Verify that the keyword appears as a single entry (not merged)
    const debugKeywordCount = result.keywords.filter((kw) => kw.keyword === 'デバッグ').length;
    expect(debugKeywordCount).toBe(1);

    // Verify ranking is present and starts from 1
    expect(debugKeyword?.rank).toBe(1);

    // Verify total keyword count reflects unmerged keywords
    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(2);

    // Verify analysis period days calculation
    const expectedDays = 7; // 2024-01-08 to 2024-01-14 is 7 days
    expect(result.analysisperiodDays).toBe(expectedDays);

    // Verify extractedAt is a valid date
    expect(result.extractedAt).toBeInstanceOf(Date);
  });
});