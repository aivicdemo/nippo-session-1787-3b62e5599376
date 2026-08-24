import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring with TextAnalysisServiceAdapter Failure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1528
  test('should handle TextAnalysisServiceAdapter extractKeywords failure gracefully', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockRejectedValueOnce(
        new Error('External API service unavailable')
      ),
      assessImpactScore: jest.fn().mockResolvedValueOnce(75),
      classifyIssueSeverity: jest.fn().mockResolvedValueOnce('high'),
    };

    const mockCacheService = {
      getCachedAnalysisResult: jest
        .fn()
        .mockResolvedValueOnce(null),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システム障害が発生した。対応が急務である',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    let thrownError: Error | null = null;
    try {
      await calculateIssuePriorityScore(
        input,
        mockTextAnalysisAdapter,
        mockCacheService
      );
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toMatch(/分析/);
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      input.issueContent
    );
    expect(mockCacheService.getCachedAnalysisResult).toHaveBeenCalledWith(
      input.issueId
    );
  });
});