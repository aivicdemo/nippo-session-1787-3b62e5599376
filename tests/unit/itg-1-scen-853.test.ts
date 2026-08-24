import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

// Mock TextAnalysisServiceAdapter
jest.mock('../../src/adapters/TextAnalysisServiceAdapter', () => ({
  TextAnalysisServiceAdapter: {
    assessImpactScore: jest.fn(),
  },
}));

describe('calculateIssuePriorityScore - Impact Score Null Error Handling', () => {
  let mockAssessImpactScore: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const { TextAnalysisServiceAdapter } = require('../../src/adapters/TextAnalysisServiceAdapter');
    mockAssessImpactScore = TextAnalysisServiceAdapter.assessImpactScore;
  });

  // SCEN-853
  test('should throw error when TextAnalysisServiceAdapter returns null impact score', async () => {
    mockAssessImpactScore.mockResolvedValue(null);

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: '納期遅延の発生により、クライアント納品予定の前倒しが困難になっている',
      occurrenceFrequency: 3,
      impactScore: null as any,
      affectedTeamCount: 2,
      resolutionDaysAverage: 5,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    await expect(calculateIssuePriorityScore(input)).rejects.toThrow(
      /Impact score/
    );
  });
});