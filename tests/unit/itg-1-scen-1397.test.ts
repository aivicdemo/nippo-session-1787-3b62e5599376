import { calculateIssuePriorityScore } from '../../src/logic/issue-analysis';
import { type IssuePrioritizationInput, type PrioritizedIssue } from '../../src/logic/issue-analysis';

describe('Issue Priority Score Recalculation', () => {
  // SCEN-1397
  test('should recalculate parent issue priority score after merging multiple child issues', () => {
    // Setup: Parent issue with initial priority score 50
    const parentIssue = {
      issueKeyword: 'database_performance',
      occurrenceCount: 10,
      impactScore: 75,
      resolutionDifficulty: 65,
    };

    // Setup: Three child issues with different priority scores
    const childIssues = [
      {
        issueKeyword: 'slow_query_1',
        occurrenceCount: 3,
        impactScore: 40,
        resolutionDifficulty: 30,
      },
      {
        issueKeyword: 'slow_query_2',
        occurrenceCount: 4,
        impactScore: 55,
        resolutionDifficulty: 40,
      },
      {
        issueKeyword: 'connection_timeout',
        occurrenceCount: 3,
        impactScore: 70,
        resolutionDifficulty: 55,
      },
    ];

    // Calculate individual priority scores for child issues
    // Using default scoring weights: frequency 0.4, impact 0.4, difficulty 0.2
    const childScores = childIssues.map((child) => {
      const frequencyComponent = (child.occurrenceCount / 10) * 100 * 0.4;
      const impactComponent = child.impactScore * 0.4;
      const difficultyComponent = child.resolutionDifficulty * 0.2;
      return Math.round(frequencyComponent + impactComponent + difficultyComponent);
    });

    // Expected child scores: [30, 40, 60] approximately
    expect(childScores[0]).toBe(30);
    expect(childScores[1]).toBe(40);
    expect(childScores[2]).toBe(60);

    // Create input for priority calculation after merge
    // Parent issue receives aggregated metrics from child issues
    const mergedIssueInput: IssuePrioritizationInput = {
      issues: [
        {
          issueKeyword: parentIssue.issueKeyword,
          occurrenceCount: parentIssue.occurrenceCount,
          impactScore: parentIssue.impactScore,
          resolutionDifficulty: parentIssue.resolutionDifficulty,
        },
      ],
      analysisStartDate: '2024-01-01T00:00:00Z',
      analysisEndDate: '2024-01-07T23:59:59Z',
      scoringWeights: {
        frequency_weight: 0.4,
        impact_weight: 0.4,
        difficulty_weight: 0.2,
      },
    };

    // Execute priority score calculation
    const result = calculateIssuePriorityScore(mergedIssueInput);

    // Verify result structure
    expect(result).toBeDefined();
    expect(result.prioritizedIssues).toBeDefined();
    expect(Array.isArray(result.prioritizedIssues)).toBe(true);
    expect(result.prioritizedIssues.length).toBe(1);

    // Verify parent issue priority score is recalculated
    const recalculatedParentIssue: PrioritizedIssue = result.prioritizedIssues[0];
    expect(recalculatedParentIssue.issueKeyword).toBe('database_performance');

    // Calculate expected recalculated score:
    // Using aggregation from child scores [30, 40, 60]
    // Average: (30 + 40 + 60) / 3 = 43.33 -> 43
    // Maximum: 60
    // Using maximum as recalculation strategy for merged issues
    const expectedRecalculatedScore = 60;

    // Verify priority score has changed from initial and matches expected value
    expect(recalculatedParentIssue.priorityScore).toBe(expectedRecalculatedScore);

    // Verify priority rank is determined correctly based on recalculated score
    expect(recalculatedParentIssue.priorityRank).toBe('HIGH');

    // Verify display color matches priority rank
    expect(recalculatedParentIssue.displayColor).toBe('RED');

    // Verify calculation timestamp is present and valid
    expect(result.calculatedAt).toBeDefined();
    expect(typeof result.calculatedAt).toBe('string');
    const calculatedDateTime = new Date(result.calculatedAt);
    expect(calculatedDateTime.toString()).not.toBe('Invalid Date');

    // Verify total issue count in result
    expect(result.totalIssueCount).toBe(1);

    // Verify high priority count reflects the recalculated score
    expect(result.highPriorityCount).toBe(1);
  });
});