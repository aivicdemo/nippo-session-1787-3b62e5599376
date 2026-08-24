import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization', () => {
  // SCEN-792
  test('should return empty array when no issues are extracted', async () => {
    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-admin-001',
    };

    const result = await extractAndRankIssueKeywords(input);

    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords).toEqual([]);
    expect(result.totalKeywordCount).toBe(0);
    expect(typeof result.extractedAt).toBe('string');
    expect(result.analysisperiodDays).toBe(7);
  });
});