import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type TextAnalysisServiceAdapter } from '../../src/logic/issue-extraction-prioritization';

describe('extractAndRankIssueKeywords - API retry behavior', () => {
  let mockTextAnalysisAdapter: TextAnalysisServiceAdapter;
  let callCount: number;
  let callTimestamps: number[];

  beforeEach(() => {
    callCount = 0;
    callTimestamps = [];
    
    mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(async () => {
        callCount++;
        callTimestamps.push(Date.now());
        
        if (callCount <= 3) {
          const error = new Error('API Error');
          (error as any).statusCode = 500;
          throw error;
        }
        
        // This should not be reached since max retries is 3
        return {
          keywords: [],
          frequency: {},
          extractedAt: new Date().toISOString(),
        };
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  // SCEN-3075
  it('should retry extractKeywords up to 3 times with intervals of 3s, 10s, 30s when API returns 500 error', async () => {
    jest.useFakeTimers();

    const reportText = 'システム障害が発生した。復旧対応中。';
    const teamId = 'team-001';
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-07T23:59:59Z');

    const extractPromise = extractAndRankIssueKeywords(
      {
        teamId,
        startDate,
        endDate,
        minFrequencyThreshold: 1,
        requestUserId: 'user-001',
      },
      mockTextAnalysisAdapter,
      reportText
    );

    // First call happens immediately
    await jest.advanceTimersByTimeAsync(0);
    expect(callCount).toBe(1);
    expect(callTimestamps.length).toBe(1);

    // Advance 3 seconds for first retry
    await jest.advanceTimersByTimeAsync(3000);
    expect(callCount).toBe(2);
    expect(callTimestamps.length).toBe(2);
    expect(callTimestamps[1] - callTimestamps[0]).toBeGreaterThanOrEqual(3000);

    // Advance 10 seconds for second retry
    await jest.advanceTimersByTimeAsync(10000);
    expect(callCount).toBe(3);
    expect(callTimestamps.length).toBe(3);
    expect(callTimestamps[2] - callTimestamps[1]).toBeGreaterThanOrEqual(10000);

    // Advance 30 seconds for third retry
    await jest.advanceTimersByTimeAsync(30000);
    expect(callCount).toBe(4);
    expect(callTimestamps.length).toBe(4);
    expect(callTimestamps[3] - callTimestamps[2]).toBeGreaterThanOrEqual(30000);

    // Advance additional time to ensure no more retries
    await jest.advanceTimersByTimeAsync(5000);
    expect(callCount).toBe(4);
    expect(callTimestamps.length).toBe(4);

    // Verify the function throws after max retries exceeded
    await expect(extractPromise).rejects.toThrow(/API/);

    // Verify total call count is exactly 4 (1 initial + 3 retries)
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(4);

    // Verify all intervals are as expected
    expect(callTimestamps[1] - callTimestamps[0]).toBeGreaterThanOrEqual(3000);
    expect(callTimestamps[2] - callTimestamps[1]).toBeGreaterThanOrEqual(10000);
    expect(callTimestamps[3] - callTimestamps[2]).toBeGreaterThanOrEqual(30000);

    // Total time should be within 30 seconds threshold plus initial call
    const totalElapsedTime = callTimestamps[3] - callTimestamps[0];
    expect(totalElapsedTime).toBeLessThanOrEqual(43000); // 3 + 10 + 30 seconds

    jest.useRealTimers();
  });
});