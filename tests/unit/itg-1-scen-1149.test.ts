import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization - Data Validation', () => {
  // SCEN-1149
  test('should return validation error when externalToolIntegrationFlag is missing from extracted issue data', () => {
    const invalidExtractedChallengesWithMissingFlag = [
      {
        challengeId: 'challenge-001',
        content: 'Database performance issue',
        occurrenceCount: 5,
        impactScore: 75,
        // externalToolIntegrationFlag intentionally omitted
      },
    ];

    const input = {
      teamId: 'team-alpha',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
      extractedChallenges: invalidExtractedChallengesWithMissingFlag as any,
    };

    expect(() => {
      extractAndRankIssueKeywords(input);
    }).toThrow(/既存ツール連携対象フラグ/);
  });
});