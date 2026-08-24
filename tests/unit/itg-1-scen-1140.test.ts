import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking', () => {
  test('SCEN-1140: extractAndRankIssueKeywords should reject keywords with zero frequency during validation', async () => {
    // Arrange
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const minFrequencyThreshold = 1;
    const requestUserId = 'user-manager-001';

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'database-connection-timeout',
            frequency: 3,
            confidence: 0.92
          },
          {
            keyword: 'memory-leak-issue',
            frequency: 0,
            confidence: 0.45
          },
          {
            keyword: 'api-rate-limit',
            frequency: 2,
            confidence: 0.88
          }
        ],
        analysisTimestamp: new Date('2024-01-14T15:30:00Z')
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'medium'
      })
    };

    const input = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId
    };

    // Act & Assert
    await expect(
      extractAndRankIssueKeywords(input, mockTextAnalysisAdapter)
    ).rejects.toThrow(/FREQUENCY_ZERO_ERROR|出現頻度が0のキーワード/);
  });
});