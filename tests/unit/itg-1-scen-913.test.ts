import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { calculateIssuePriorityScore, type IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation - External Service Timeout Retry', () => {
  // SCEN-913
  test('should throw exception after maximum retry attempts when TextAnalysisServiceAdapter times out at 30+ seconds', async () => {
    // Setup: Mock TextAnalysisServiceAdapter with timeout behavior
    let callCount = 0;
    const timeoutError = new Error('Request timeout exceeded 30 seconds');
    (timeoutError as any).name = 'TimeoutError';

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['システム障害'],
        confidence: 0.95,
      }),
      assessImpactScore: jest.fn(async () => {
        callCount++;
        // Simulate 30+ second timeout on every call
        await new Promise((_, reject) => {
          setTimeout(() => reject(timeoutError), 100); // Simulated delay for timeout
        });
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システム障害により本番環境が停止している',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    // Execute: Call calculateIssuePriorityScore with mocked adapter
    let thrownException: Error | null = null;
    try {
      await calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);
    } catch (error) {
      thrownException = error as Error;
    }

    // Verify: Exception is thrown after maximum retry attempts
    expect(thrownException).not.toBeNull();
    expect(thrownException?.message).toMatch(/最大再試行回数/);
    
    // Verify: Total of 4 calls made (1 initial + 3 retries)
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledTimes(4);
    
    // Verify: Exception type is TimeoutError
    expect(thrownException?.name).toBe('TimeoutError');
  });
});