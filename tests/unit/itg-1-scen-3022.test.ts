import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Tracking', () => {
  // SCEN-3022
  test('should display all 10 team members as submitted when all members have submitted their reports', () => {
    // Arrange
    const teamId = 'team_engineering_001';
    const reportDate = '2024-01-15';
    const requestUserId = 'manager_001';

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // Mock submission data for all 10 team members
    // Each member has submitted with timestamps
    const memberSubmissions = [
      {
        userId: 'member_001',
        userName: 'Engineer A',
        email: 'engineer.a@company.com',
        submissionTimestamp: new Date('2024-01-15T09:15:00Z'),
        isOnTime: true,
      },
      {
        userId: 'member_002',
        userName: 'Engineer B',
        email: 'engineer.b@company.com',
        submissionTimestamp: new Date('2024-01-15T09:18:30Z'),
        isOnTime: true,
      },
      {
        userId: 'member_003',
        userName: 'Engineer C',
        email: 'engineer.c@company.com',
        submissionTimestamp: new Date('2024-01-15T09:20:15Z'),
        isOnTime: true,
      },
      {
        userId: 'member_004',
        userName: 'Engineer D',
        email: 'engineer.d@company.com',
        submissionTimestamp: new Date('2024-01-15T09:22:00Z'),
        isOnTime: true,
      },
      {
        userId: 'member_005',
        userName: 'Engineer E',
        email: 'engineer.e@company.com',
        submissionTimestamp: new Date('2024-01-15T09:25:45Z'),
        isOnTime: true,
      },
      {
        userId: 'member_006',
        userName: 'Engineer F',
        email: 'engineer.f@company.com',
        submissionTimestamp: new Date('2024-01-15T09:28:30Z'),
        isOnTime: true,
      },
      {
        userId: 'member_007',
        userName: 'Engineer G',
        email: 'engineer.g@company.com',
        submissionTimestamp: new Date('2024-01-15T09:30:00Z'),
        isOnTime: true,
      },
      {
        userId: 'member_008',
        userName: 'Engineer H',
        email: 'engineer.h@company.com',
        submissionTimestamp: new Date('2024-01-15T09:32:15Z'),
        isOnTime: true,
      },
      {
        userId: 'member_009',
        userName: 'Engineer I',
        email: 'engineer.i@company.com',
        submissionTimestamp: new Date('2024-01-15T09:35:00Z'),
        isOnTime: true,
      },
      {
        userId: 'member_010',
        userName: 'Engineer J',
        email: 'engineer.j@company.com',
        submissionTimestamp: new Date('2024-01-15T09:38:45Z'),
        isOnTime: true,
      },
    ];

    // Act
    // In a real scenario, this function would aggregate data from database
    // For this test, we simulate the aggregation result based on all members having submitted
    const result: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(
      input,
      memberSubmissions,
    );

    // Assert
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(10);
    expect(result.unsubmittedCount).toBe(0);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(100.0);
    expect(result.unsubmittedMembers).toHaveLength(0);
    expect(result.aggregatedAt).toBeDefined();
    
    // Verify that all member details are present in the result
    expect(result).toHaveProperty('submittedCount', 10);
    expect(result).toHaveProperty('unsubmittedCount', 0);
  });
});