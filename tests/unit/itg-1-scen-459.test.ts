import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';

describe('Monthly Analysis Report Generation', () => {
  test('SCEN-459: minimum priority threshold clamping to valid range when out of bounds', async () => {
    const mockTeamIds = ['team-1', 'team-2'];
    const mockAggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const mockAggregationEndDate = new Date('2024-01-31T23:59:59Z');

    const mockAllChallengesWithScores = [
      {
        challengeId: 'challenge-1',
        title: 'Challenge 1',
        priorityScore: 100,
        frequency: 15,
        impactLevel: 'high'
      },
      {
        challengeId: 'challenge-2',
        title: 'Challenge 2',
        priorityScore: 90,
        frequency: 14,
        impactLevel: 'high'
      },
      {
        challengeId: 'challenge-3',
        title: 'Challenge 3',
        priorityScore: 80,
        frequency: 13,
        impactLevel: 'high'
      },
      {
        challengeId: 'challenge-4',
        title: 'Challenge 4',
        priorityScore: 70,
        frequency: 12,
        impactLevel: 'medium'
      },
      {
        challengeId: 'challenge-5',
        title: 'Challenge 5',
        priorityScore: 60,
        frequency: 11,
        impactLevel: 'medium'
      },
      {
        challengeId: 'challenge-6',
        title: 'Challenge 6',
        priorityScore: 50,
        frequency: 10,
        impactLevel: 'medium'
      },
      {
        challengeId: 'challenge-7',
        title: 'Challenge 7',
        priorityScore: 40,
        frequency: 9,
        impactLevel: 'low'
      },
      {
        challengeId: 'challenge-8',
        title: 'Challenge 8',
        priorityScore: 30,
        frequency: 8,
        impactLevel: 'low'
      },
      {
        challengeId: 'challenge-9',
        title: 'Challenge 9',
        priorityScore: 20,
        frequency: 7,
        impactLevel: 'low'
      },
      {
        challengeId: 'challenge-10',
        title: 'Challenge 10',
        priorityScore: 10,
        frequency: 6,
        impactLevel: 'low'
      }
    ];

    const topNCount = 5;

    // Pattern A: minimumPriorityThreshold = -10 (below lower bound)
    // Expected: threshold clamped to 0, all 10 challenges with priorityScore >= 0 are eligible
    // Top 5 by score should be returned with reportingRank 1-5
    const resultPatternA = await generateMonthlyAnalysisReport({
      aggregationPeriodStart: mockAggregationStartDate.toISOString(),
      aggregationPeriodEnd: mockAggregationEndDate.toISOString(),
      issueRankingData: mockAllChallengesWithScores.map((ch, idx) => ({
        issueId: ch.challengeId,
        frequency: ch.frequency,
        impactScore: ch.priorityScore
      })),
      priorityScoreData: mockAllChallengesWithScores.map((ch) => ({
        issueId: ch.challengeId,
        priorityScore: ch.priorityScore,
        priorityRank: ch.priorityScore >= 70 ? 'high' : ch.priorityScore >= 40 ? 'medium' : 'low',
        colorCode: ch.priorityScore >= 70 ? 'red' : ch.priorityScore >= 40 ? 'yellow' : 'green'
      })),
      teamPerformanceMetrics: [
        {
          teamId: 'team-1',
          issueResolutionSpeedDays: 5,
          reportSubmissionRate: 85,
          issueRecurrenceRate: 12
        },
        {
          teamId: 'team-2',
          issueResolutionSpeedDays: 7,
          reportSubmissionRate: 80,
          issueRecurrenceRate: 15
        }
      ],
      bottleneckProgressionData: mockAllChallengesWithScores.map((ch) => ({
        issueId: ch.challengeId,
        progressionType: ch.priorityScore >= 70 ? 'deteriorating' : 'stable',
        weeklyFrequencyTrend: [3, 4, 4, 4],
        category: 'technical'
      })),
      minimumPriorityThreshold: -10,
      topNCount: topNCount
    });

    expect(resultPatternA.selectedChallenges).toHaveLength(5);
    expect(resultPatternA.selectedChallenges[0].reportingRank).toBe(1);
    expect(resultPatternA.selectedChallenges[0].priorityScore).toBe(100);
    expect(resultPatternA.selectedChallenges[0].frequency).toBe(15);
    expect(resultPatternA.selectedChallenges[1].reportingRank).toBe(2);
    expect(resultPatternA.selectedChallenges[1].priorityScore).toBe(90);
    expect(resultPatternA.selectedChallenges[2].reportingRank).toBe(3);
    expect(resultPatternA.selectedChallenges[2].priorityScore).toBe(80);
    expect(resultPatternA.selectedChallenges[3].reportingRank).toBe(4);
    expect(resultPatternA.selectedChallenges[3].priorityScore).toBe(70);
    expect(resultPatternA.selectedChallenges[4].reportingRank).toBe(5);
    expect(resultPatternA.selectedChallenges[4].priorityScore).toBe(60);

    // Pattern B: minimumPriorityThreshold = 150 (above upper bound)
    // Expected: threshold clamped to 100, only challenges with priorityScore >= 100 are eligible
    // Only 1 challenge with priorityScore 100, so only 1 item returned
    const resultPatternB = await generateMonthlyAnalysisReport({
      aggregationPeriodStart: mockAggregationStartDate.toISOString(),
      aggregationPeriodEnd: mockAggregationEndDate.toISOString(),
      issueRankingData: mockAllChallengesWithScores.map((ch) => ({
        issueId: ch.challengeId,
        frequency: ch.frequency,
        impactScore: ch.priorityScore
      })),
      priorityScoreData: mockAllChallengesWithScores.map((ch) => ({
        issueId: ch.challengeId,
        priorityScore: ch.priorityScore,
        priorityRank: ch.priorityScore >= 70 ? 'high' : ch.priorityScore >= 40 ? 'medium' : 'low',
        colorCode: ch.priorityScore >= 70 ? 'red' : ch.priorityScore >= 40 ? 'yellow' : 'green'
      })),
      teamPerformanceMetrics: [
        {
          teamId: 'team-1',
          issueResolutionSpeedDays: 5,
          reportSubmissionRate: 85,
          issueRecurrenceRate: 12
        },
        {
          teamId: 'team-2',
          issueResolutionSpeedDays: 7,
          reportSubmissionRate: 80,
          issueRecurrenceRate: 15
        }
      ],
      bottleneckProgressionData: mockAllChallengesWithScores.map((ch) => ({
        issueId: ch.challengeId,
        progressionType: ch.priorityScore >= 70 ? 'deteriorating' : 'stable',
        weeklyFrequencyTrend: [3, 4, 4, 4],
        category: 'technical'
      })),
      minimumPriorityThreshold: 150,
      topNCount: topNCount
    });

    expect(resultPatternB.selectedChallenges).toHaveLength(1);
    expect(resultPatternB.selectedChallenges[0].reportingRank).toBe(1);
    expect(resultPatternB.selectedChallenges[0].priorityScore).toBe(100);

    // Pattern C: minimumPriorityThreshold = 0 (valid lower bound)
    // Expected: no clamping needed, all 10 challenges with priorityScore >= 0 are eligible
    // Top 5 by score should be returned
    const resultPatternC = await generateMonthlyAnalysisReport({
      aggregationPeriodStart: mockAggregationStartDate.toISOString(),
      aggregationPeriodEnd: mockAggregationEndDate.toISOString(),
      issueRankingData: mockAllChallengesWithScores.map((ch) => ({
        issueId: ch.challengeId,
        frequency: ch.frequency,
        impactScore: ch.priorityScore
      })),
      priorityScoreData: mockAllChallengesWithScores.map((ch) => ({
        issueId: ch.challengeId,
        priorityScore: ch.priorityScore,
        priorityRank: ch.priorityScore >= 70 ? 'high' : ch.priorityScore >= 40 ? 'medium' : 'low',
        colorCode: ch.priorityScore >= 70 ? 'red' : ch.priorityScore >= 40 ? 'yellow' : 'green'
      })),
      teamPerformanceMetrics: [
        {
          teamId: 'team-1',
          issueResolutionSpeedDays: 5,
          reportSubmissionRate: 85,
          issueRecurrenceRate: 12
        },
        {
          teamId: 'team-2',
          issueResolutionSpeedDays: 7,
          reportSubmissionRate: 80,
          issueRecurrenceRate: 15
        }
      ],
      bottleneckProgressionData: mockAllChallengesWithScores.map((ch) => ({
        issueId: ch.challengeId,
        progressionType: ch.priorityScore >= 70 ? 'deteriorating' : 'stable',
        weeklyFrequencyTrend: [3, 4, 4, 4],
        category: 'technical'
      })),
      minimumPriorityThreshold: 0,
      topNCount: topNCount
    });

    expect(resultPatternC.selectedChallenges).toHaveLength(5);
    expect(resultPatternC.selectedChallenges[0].reportingRank).toBe(1);
    expect(resultPatternC.selectedChallenges[0].priorityScore).toBe(100);
    expect(resultPatternC.selectedChallenges[1].reportingRank).toBe(2);
    expect(resultPatternC.selectedChallenges[1].priorityScore).toBe(90);
    expect(resultPatternC.selectedChallenges[2].reportingRank).toBe(3);
    expect(resultPatternC.selectedChallenges[2].priorityScore).toBe(80);
    expect(resultPatternC.selectedChallenges[3].reportingRank).toBe(4);
    expect(resultPatternC.selectedChallenges[3].priorityScore).toBe(70);
    expect(resultPatternC.selectedChallenges[4].reportingRank).toBe(5);
    expect(resultPatternC.selectedChallenges[4].priorityScore).toBe(60);

    // Verify clamping behavior: Pattern A and C should have identical results
    expect(resultPatternA.selectedChallenges).toEqual(resultPatternC.selectedChallenges);
  });
});