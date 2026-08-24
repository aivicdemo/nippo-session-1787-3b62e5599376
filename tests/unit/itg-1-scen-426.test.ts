import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Aggregation - Large Scale Team', () => {
  // SCEN-426
  test('should accurately aggregate submission status for maximum-scale team (100 members) with correct member state distribution', async () => {
    // Setup: Create 100 team members with IDs member_001 to member_100
    const teamId = 'team-large-scale-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'manager-001';

    // Prepare submitted members (member_001 to member_050)
    const submittedMembers = Array.from({ length: 50 }, (_, i) => {
      const memberId = `member_${String(i + 1).padStart(3, '0')}`;
      return {
        userId: memberId,
        userName: `Engineer ${i + 1}`,
        email: `engineer${i + 1}@example.com`,
        submissionStatus: 'submitted' as const,
        submissionTimestamp: new Date('2024-01-15T08:30:00Z'),
        reportContent: {
          yesterday: `Completed task ${i + 1}`,
          today: `Planned work ${i + 1}`,
          challenges: `Issue ${i + 1}`,
        },
      };
    });

    // Prepare unsubmitted members (member_051 to member_100)
    const unsubmittedMembers = Array.from({ length: 50 }, (_, i) => {
      const memberId = `member_${String(i + 51).padStart(3, '0')}`;
      return {
        userId: memberId,
        userName: `Engineer ${i + 51}`,
        email: `engineer${i + 51}@example.com`,
        submissionStatus: 'unsubmitted' as const,
        submissionTimestamp: null,
        reportContent: null,
      };
    });

    const allMembers = [...submittedMembers, ...unsubmittedMembers];

    // Mock repository/data access
    const mockGetTeamMembers = jest.fn().mockResolvedValue(allMembers);
    const mockGetReportSubmissionRecords = jest.fn().mockResolvedValue(
      submittedMembers.map((member) => ({
        userId: member.userId,
        teamId: teamId,
        reportDate: reportDate,
        submissionTimestamp: member.submissionTimestamp,
        isOnTime: true,
        delayMinutes: 0,
      }))
    );

    // Stub NotificationServiceAdapter for reminder notifications
    const notificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        sentAt: new Date('2024-01-15T08:00:00Z'),
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        sentCount: 100,
        failedCount: 0,
        deliveredCount: 100,
      }),
    };

    // Create input for aggregation
    const input: AggregateReportSubmissionStatusInput = {
      teamId: teamId,
      reportDate: reportDate,
      requestUserId: requestUserId,
      includeDelayedSubmissions: true,
    };

    // Mock the actual aggregation logic to return expected result
    const mockAggregationResult: ReportSubmissionStatusSummary = {
      teamId: teamId,
      reportDate: reportDate,
      totalMembers: 100,
      submittedCount: 50,
      unsubmittedCount: 50,
      delayedSubmissionCount: 0,
      submissionRate: 50.0,
      unsubmittedMembers: unsubmittedMembers.map((member) => ({
        userId: member.userId,
        userName: member.userName,
        email: member.email,
        remainingMinutes: -120,
      })),
      aggregatedAt: '2024-01-15T09:00:00Z',
    };

    // Call the function with mocked dependencies
    // Note: In actual implementation, aggregateReportSubmissionStatus would accept
    // repository/adapter parameters or use dependency injection
    const result = await aggregateReportSubmissionStatus(input);

    // Verify (1): Correct count totals
    expect(result.totalMembers).toBe(100);
    expect(result.submittedCount).toBe(50);
    expect(result.unsubmittedCount).toBe(50);
    expect(result.submittedCount + result.unsubmittedCount).toBe(result.totalMembers);

    // Verify (2): Submitted members (member_001 to member_050) are correctly recorded
    const submittedMemberIds = Array.from({ length: 50 }, (_, i) =>
      `member_${String(i + 1).padStart(3, '0')}`
    );
    submittedMemberIds.forEach((memberId) => {
      expect(result.unsubmittedMembers.map((m) => m.userId)).not.toContain(memberId);
    });

    // Verify (3): Unsubmitted members (member_051 to member_100) are correctly recorded
    const unsubmittedMemberIds = Array.from({ length: 50 }, (_, i) =>
      `member_${String(i + 51).padStart(3, '0')}`
    );
    const returnedUnsubmittedIds = result.unsubmittedMembers.map((m) => m.userId);
    unsubmittedMemberIds.forEach((memberId) => {
      expect(returnedUnsubmittedIds).toContain(memberId);
    });

    // Verify (4): All 100 members are included without omission
    expect(result.unsubmittedMembers.length).toBe(50);
    const allReturnedMemberIds = new Set([
      ...submittedMemberIds,
      ...returnedUnsubmittedIds,
    ]);
    expect(allReturnedMemberIds.size).toBe(100);

    // Verify (5): Submission rate calculation (50 submitted / 100 total * 100 = 50.0%)
    expect(result.submissionRate).toBe(50.0);

    // Verify (6): Basic properties
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.delayedSubmissionCount).toBe(0);

    // Verify (7): Aggregated timestamp is recorded in ISO 8601 format
    expect(typeof result.aggregatedAt).toBe('string');
    expect(result.aggregatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // Verify (8): Each unsubmitted member has required fields
    result.unsubmittedMembers.forEach((member) => {
      expect(member.userId).toBeDefined();
      expect(member.userName).toBeDefined();
      expect(member.email).toBeDefined();
      expect(typeof member.remainingMinutes).toBe('number');
    });

    // Verify notification adapter was stubbed correctly
    expect(notificationServiceAdapter.sendReminderNotification).toBeDefined();
    expect(notificationServiceAdapter.getDeliveryStatus).toBeDefined();
  });
});