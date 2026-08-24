import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Edge Cases', () => {
  test('SCEN-1158: Keyword with below-threshold frequency is marked as invalid noise', async () => {
    // Arrange
    const reportText = 'システム障害が発生した。ユーザーから問い合わせが多い。対応中。';
    const teamId = 'team-001';
    const startDate = new Date('2024-01-15T00:00:00Z');
    const endDate = new Date('2024-01-21T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-001';

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: 'システム障害',
          frequency: 2,
          totalOccurrences: 5,
          frequencyPercentage: 40,
        },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(65),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    const input = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    // Act
    const result = await extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);

    // Assert
    expect(result).toBeDefined();
    expect(result.keywords).toHaveLength(1);

    const keyword = result.keywords[0];
    expect(keyword.keyword).toBe('システム障害');
    expect(keyword.frequency).toBe(2);
    expect(keyword.rank).toBe(1);

    // Validation status check
    expect(keyword.validationStatus).toBe('INVALID_NOISE');
    expect(keyword.isValid).toBe(false);
    expect(keyword.invalidReason).toMatch(/keyword_frequency_below_threshold/);
    expect(keyword.invalidReason).toMatch(/40%/);
    expect(keyword.invalidReason).toMatch(/50%/);

    expect(result.totalKeywordCount).toBe(1);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisPeriodDays).toBe(7);
  });
});