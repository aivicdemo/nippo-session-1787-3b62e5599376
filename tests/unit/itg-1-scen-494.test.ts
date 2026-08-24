import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking', () => {
  // SCEN-494: TextAnalysisServiceAdapter.assessImpactScore returns out-of-range score
  test('should throw error when assessImpactScore returns score outside 0-100 range', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['システム障害'],
        frequency: 1,
      }),
      assessImpactScore: jest.fn().mockResolvedValue(150),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    await expect(
      extractAndRankIssueKeywords(input, mockTextAnalysisAdapter)
    ).rejects.toThrow(/impact score|range|valid/i);
  });

  test('should throw error when assessImpactScore returns negative score', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['システム障害'],
        frequency: 1,
      }),
      assessImpactScore: jest.fn().mockResolvedValue(-10),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    await expect(
      extractAndRankIssueKeywords(input, mockTextAnalysisAdapter)
    ).rejects.toThrow(/impact score|range|valid/i);
  });
});