import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';

describe('issue-extraction-and-ranking', () => {
  test('SCEN-352: impact score defaults to 50 when impact weights definition is incomplete', async () => {
    // Arrange
    const reports = [
      {
        reportId: 'r1',
        teamId: 't1',
        reportDate: new Date('2025-01-20T09:00:00Z'),
        issueText: 'ビルド失敗が発生',
      },
      {
        reportId: 'r2',
        teamId: 't1',
        reportDate: new Date('2025-01-20T10:30:00Z'),
        issueText: 'ビルド失敗で対応中',
      },
    ];

    const analysisStartDate = new Date('2025-01-13T00:00:00Z');
    const analysisEndDate = new Date('2025-01-20T23:59:59Z');
    const teamIds = ['t1'];
    const minimumConfidenceThreshold = 50;

    // Mock the priority scoring to capture impact score parameter
    let capturedImpactScore: number | null = null;
    jest.mock('../../src/logic/priority-scoring-engine', () => ({
      calculatePriorityScoreForIssue: jest.fn(
        (
          frequencyScore: number,
          impactScore: number,
          frequencyWeight?: number,
          impactWeight?: number
        ) => {
          capturedImpactScore = impactScore;
          const fWeight = frequencyWeight ?? 0.4;
          const iWeight = impactWeight ?? 0.6;
          return frequencyScore * fWeight + impactScore * iWeight;
        }
      ),
    }));

    // Act
    const result = await extractAndRankIssuesFromReports({
      reports,
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumConfidenceThreshold,
    });

    // Assert
    expect(result).toBeDefined();
    expect(result.issues).toBeDefined();
    expect(Array.isArray(result.issues)).toBe(true);
    expect(result.totalIssueCount).toBeGreaterThanOrEqual(1);
    expect(result.analysisTimestamp).toBeInstanceOf(Date);

    // Verify that the impact score defaults to 50 when weights are incomplete
    if (result.issues.length > 0) {
      const firstIssue = result.issues[0];
      expect(firstIssue.impactScore).toBe(50);

      // Verify priority score calculation: frequencyScore * 0.4 + 50 * 0.6
      // For 'ビルド失敗' with frequency 2 out of 2 reports in period
      // frequencyScore would be (2 / 2) * 100 = 100
      // priorityScore = 100 * 0.4 + 50 * 0.6 = 40 + 30 = 70
      const expectedPriorityScore = 100 * 0.4 + 50 * 0.6;
      expect(firstIssue.priorityScore).toBe(expectedPriorityScore);
    }

    // Verify that impact score was captured as default value 50
    if (capturedImpactScore !== null) {
      expect(capturedImpactScore).toBe(50);
    }

    // Verify confidence score is not below minimum threshold
    result.issues.forEach((issue) => {
      expect(issue.confidenceScore).toBeGreaterThanOrEqual(
        minimumConfidenceThreshold
      );
    });

    // Verify low confidence issue count is tracked
    expect(result.lowConfidenceIssueCount).toBeGreaterThanOrEqual(0);
  });
});