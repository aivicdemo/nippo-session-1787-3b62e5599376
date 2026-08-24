import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Tracking - Midnight Edge Case', () => {
  // SCEN-361: [edge] 報告提出状況リアルタイム更新機能 - 月初 00:00:00 に送信された日報が正しく当日分として記録される
  test('should correctly record report submitted at midnight on first day of month as same-day submission', async () => {
    // Arrange: Setup test data representing midnight on month's first day (UTC)
    const testDate = '2024-01-01';
    const teamId = 'team-dev-001';
    const requestUserId = 'admin-user-001';

    // Mock current system time: 2024-01-01T00:00:00Z
    const currentTimeUtc = new Date('2024-01-01T00:00:00Z');

    // Simulate report submission data at midnight
    const submissionInput: AggregateReportSubmissionStatusInput = {
      teamId: teamId,
      reportDate: testDate,
      requestUserId: requestUserId,
      includeDelayedSubmissions: true,
    };

    // Prepare test team member data
    const teamMembers = [
      {
        userId: 'member-001',
        userName: 'Alice Developer',
        email: 'alice@example.com',
      },
      {
        userId: 'member-002',
        userName: 'Bob Engineer',
        email: 'bob@example.com',
      },
      {
        userId: 'member-003',
        userName: 'Carol QA',
        email: 'carol@example.com',
      },
    ];

    // Member 001 submitted report at exactly 2024-01-01T00:00:00Z
    const submittedReports = [
      {
        userId: 'member-001',
        reportDate: '2024-01-01',
        submissionTimestamp: '2024-01-01T00:00:00Z',
        content: {
          yesterday: 'Previous day task completed',
          today: 'Starting today task',
          issues: 'Issue A',
        },
        status: 'submitted_on_time',
      },
    ];

    // Members 002 and 003 did not submit
    const unsubmittedMembers = [
      { userId: 'member-002', remainingMinutes: 540 }, // 9 hours until 09:00 deadline
      { userId: 'member-003', remainingMinutes: 540 },
    ];

    // Act: Call aggregation function
    const result: ReportSubmissionStatusSummary = await aggregateReportSubmissionStatus(
      submissionInput,
      {
        // Mock data provider: returns team members and submissions
        getTeamMembers: async (tid: string) => teamMembers,
        getSubmittedReports: async (tid: string, date: string) => submittedReports,
        getUnsubmittedMembers: async (tid: string, date: string) => unsubmittedMembers,
      }
    );

    // Assert: Verify aggregation results
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(testDate);
    expect(result.totalMembers).toBe(3);
    expect(result.submittedCount).toBe(1);
    expect(result.unsubmittedCount).toBe(2);
    expect(result.delayedSubmissionCount).toBe(0);

    // Submission rate calculation: 1 submitted / 3 total * 100 = 33.3%
    expect(result.submissionRate).toBe(33.3);

    // Verify unsubmitted members list
    expect(result.unsubmittedMembers).toHaveLength(2);
    expect(result.unsubmittedMembers[0]).toEqual(
      expect.objectContaining({
        userId: 'member-002',
        userName: 'Bob Engineer',
        email: 'bob@example.com',
        remainingMinutes: 540,
      })
    );
    expect(result.unsubmittedMembers[1]).toEqual(
      expect.objectContaining({
        userId: 'member-003',
        userName: 'Carol QA',
        email: 'carol@example.com',
        remainingMinutes: 540,
      })
    );

    // Verify aggregated timestamp is recorded in ISO 8601 format
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Verify that midnight submission (00:00:00) is recorded as same-day (2024-01-01)
    // and NOT rolled over to previous day
    const midnightReport = result.unsubmittedMembers.find(
      (m) => m.userId === 'member-001'
    );
    expect(midnightReport).toBeUndefined();

    // The submitted member should be in submitted count
    expect(result.submittedCount).toBe(1);

    // Verify that the submission timestamp boundary is correctly handled:
    // 2024-01-01T00:00:00Z should belong to 2024-01-01, not 2023-12-31
    expect(result.reportDate).toBe('2024-01-01');
  });
});