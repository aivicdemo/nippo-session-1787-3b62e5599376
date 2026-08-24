import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import type {
  TeamPerformanceMetricsInput,
  TeamPerformanceMetricsOutput,
  DailyReportRecord,
} from '../../src/logic/monthly-performance-analysis';

describe('calculateTeamPerformanceMetrics - Edge case: Multiple members with equal productivity scores', () => {
  // SCEN-2309
  test('should produce stable and consistent productivity scores when multiple members have equal scores', () => {
    // Prepare test data: 5 members (A-E) with identical productivity inputs
    const aggregationStartDate = new Date('2024-01-15');
    const aggregationEndDate = new Date('2024-01-31');
    const teamIds = ['team-001'];

    // Create report records for 5 members with identical characteristics
    const reportRecords: DailyReportRecord[] = [
      {
        recordId: 'report-001',
        memberId: 'member-A',
        teamId: 'team-001',
        reportDate: new Date('2024-01-20'),
        yesterdayAccomplishment: 'Completed module X testing',
        todayPlan: 'Will review module Y',
        issueDescription: 'Database connection timeout',
        submissionTime: new Date('2024-01-20T08:30:00Z'),
      },
      {
        recordId: 'report-002',
        memberId: 'member-B',
        teamId: 'team-001',
        reportDate: new Date('2024-01-20'),
        yesterdayAccomplishment: 'Completed module X testing',
        todayPlan: 'Will review module Y',
        issueDescription: 'Database connection timeout',
        submissionTime: new Date('2024-01-20T08:30:00Z'),
      },
      {
        recordId: 'report-003',
        memberId: 'member-C',
        teamId: 'team-001',
        reportDate: new Date('2024-01-20'),
        yesterdayAccomplishment: 'Completed module X testing',
        todayPlan: 'Will review module Y',
        issueDescription: 'Database connection timeout',
        submissionTime: new Date('2024-01-20T08:30:00Z'),
      },
      {
        recordId: 'report-004',
        memberId: 'member-D',
        teamId: 'team-001',
        reportDate: new Date('2024-01-20'),
        yesterdayAccomplishment: 'Completed module X testing',
        todayPlan: 'Will review module Y',
        issueDescription: 'Database connection timeout',
        submissionTime: new Date('2024-01-20T08:30:00Z'),
      },
      {
        recordId: 'report-005',
        memberId: 'member-E',
        teamId: 'team-001',
        reportDate: new Date('2024-01-20'),
        yesterdayAccomplishment: 'Completed module X testing',
        todayPlan: 'Will review module Y',
        issueDescription: 'Database connection timeout',
        submissionTime: new Date('2024-01-20T08:30:00Z'),
      },
    ];

    // Mock TextAnalysisServiceAdapter to return identical scores for all members
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: ['Database', 'timeout'],
        frequency: { Database: 2, timeout: 2 },
      }),
      assessImpactScore: jest.fn().mockReturnValue(75),
      classifyIssueSeverity: jest.fn().mockReturnValue('medium'),
    };

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds,
      reportRecords,
    };

    // First calculation execution
    const result1: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(
      input,
      mockTextAnalysisService
    );

    // Store scores from first calculation
    const firstScores = new Map(
      result1.memberProductivityScores.map((score) => [
        score.memberId,
        score.resolutionContributionScore,
      ])
    );
    const firstMemberOrder = result1.memberProductivityScores.map((score) => score.memberId);

    // Second calculation execution with same input data
    const result2: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(
      input,
      mockTextAnalysisService
    );

    // Store scores from second calculation
    const secondScores = new Map(
      result2.memberProductivityScores.map((score) => [
        score.memberId,
        score.resolutionContributionScore,
      ])
    );
    const secondMemberOrder = result2.memberProductivityScores.map((score) => score.memberId);

    // Assertions: Verify score stability across calculation runs
    expect(result1.memberProductivityScores).toHaveLength(5);
    expect(result2.memberProductivityScores).toHaveLength(5);

    // Check that all members have identical scores (75)
    for (const score of result1.memberProductivityScores) {
      expect(score.resolutionContributionScore).toBe(75);
    }
    for (const score of result2.memberProductivityScores) {
      expect(score.resolutionContributionScore).toBe(75);
    }

    // Check consistency between first and second calculation
    for (const memberId of ['member-A', 'member-B', 'member-C', 'member-D', 'member-E']) {
      const firstScore = firstScores.get(memberId);
      const secondScore = secondScores.get(memberId);
      expect(firstScore).toBeDefined();
      expect(secondScore).toBeDefined();
      expect(firstScore).toBe(secondScore);
    }

    // Verify member order is stable across calculations
    expect(firstMemberOrder).toEqual(secondMemberOrder);

    // Verify no deviation greater than 1 point between runs
    for (const memberId of ['member-A', 'member-B', 'member-C', 'member-D', 'member-E']) {
      const firstScore = firstScores.get(memberId) || 0;
      const secondScore = secondScores.get(memberId) || 0;
      const deviation = Math.abs(firstScore - secondScore);
      expect(deviation).toBeLessThan(1);
    }
  });
});