import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Tracking - Dashboard Display', () => {
  // SCEN-2891: [normal] 提出状況表示機能 - 朝会開始30分前時点で、部長ダッシュボードに未提出メンバーが複数件として表示される
  test('should display unsubmitted members in dashboard 30 minutes before morning meeting start time', async () => {
    // Setup: Define fixed time points for predictable testing
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    const thirtyMinutesBeforeStart = new Date('2024-01-15T08:30:00Z');
    const reportDate = '2024-01-15';
    const teamId = 'team-engineering-001';
    const requestUserId = 'user-manager-001';

    // Simulate team members: 3 unsubmitted (A, B, C) and 7 submitted (D-J)
    const unsubmittedMembers = [
      {
        userId: 'user-member-A',
        userName: 'Member A',
        email: 'member-a@company.com',
        remainingMinutes: 30,
      },
      {
        userId: 'user-member-B',
        userName: 'Member B',
        email: 'member-b@company.com',
        remainingMinutes: 30,
      },
      {
        userId: 'user-member-C',
        userName: 'Member C',
        email: 'member-c@company.com',
        remainingMinutes: 30,
      },
    ];

    const submittedCount = 7;
    const totalMembers = unsubmittedMembers.length + submittedCount; // 10 members total

    // Prepare input for aggregation
    const input: AggregateReportSubmissionStatusInput = {
      teamId: teamId,
      reportDate: reportDate,
      requestUserId: requestUserId,
      includeDelayedSubmissions: true,
    };

    // Mock data representing database state
    // Members D-J submitted on time, Members A-C did not submit
    const mockDatabaseState = {
      team: {
        id: teamId,
        name: 'Engineering Team',
      },
      members: [
        // Unsubmitted members
        { userId: 'user-member-A', displayName: 'Member A', email: 'member-a@company.com' },
        { userId: 'user-member-B', displayName: 'Member B', email: 'member-b@company.com' },
        { userId: 'user-member-C', displayName: 'Member C', email: 'member-c@company.com' },
        // Submitted members
        { userId: 'user-member-D', displayName: 'Member D', email: 'member-d@company.com' },
        { userId: 'user-member-E', displayName: 'Member E', email: 'member-e@company.com' },
        { userId: 'user-member-F', displayName: 'Member F', email: 'member-f@company.com' },
        { userId: 'user-member-G', displayName: 'Member G', email: 'member-g@company.com' },
        { userId: 'user-member-H', displayName: 'Member H', email: 'member-h@company.com' },
        { userId: 'user-member-I', displayName: 'Member I', email: 'member-i@company.com' },
        { userId: 'user-member-J', displayName: 'Member J', email: 'member-j@company.com' },
      ],
      reportSubmissions: [
        // Members D-J submitted on time before deadline
        { userId: 'user-member-D', submittedAt: new Date('2024-01-15T08:15:00Z'), status: 'on_time' },
        { userId: 'user-member-E', submittedAt: new Date('2024-01-15T08:20:00Z'), status: 'on_time' },
        { userId: 'user-member-F', submittedAt: new Date('2024-01-15T08:10:00Z'), status: 'on_time' },
        { userId: 'user-member-G', submittedAt: new Date('2024-01-15T08:25:00Z'), status: 'on_time' },
        { userId: 'user-member-H', submittedAt: new Date('2024-01-15T08:05:00Z'), status: 'on_time' },
        { userId: 'user-member-I', submittedAt: new Date('2024-01-15T08:22:00Z'), status: 'on_time' },
        { userId: 'user-member-J', submittedAt: new Date('2024-01-15T08:18:00Z'), status: 'on_time' },
        // Members A-C did not submit
      ],
      deadline: morningMeetingStartTime,
    };

    // Call the function to aggregate submission status
    // In a real scenario, this would query the database; here we simulate the expected behavior
    const result: ReportSubmissionStatusSummary = await aggregateReportSubmissionStatus(input);

    // Assertions: Verify the dashboard display matches expected values
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(totalMembers);
    expect(result.submittedCount).toBe(submittedCount);
    expect(result.unsubmittedCount).toBe(3);
    expect(result.delayedSubmissionCount).toBe(0);

    // Verify submission rate calculation: 7 submitted / 10 total = 70.0%
    expect(result.submissionRate).toBe(70.0);

    // Verify unsubmitted members list contains exactly 3 members with correct details
    expect(result.unsubmittedMembers).toHaveLength(3);

    // Verify Member A details
    expect(result.unsubmittedMembers[0].userId).toBe('user-member-A');
    expect(result.unsubmittedMembers[0].userName).toBe('Member A');
    expect(result.unsubmittedMembers[0].email).toBe('member-a@company.com');
    expect(result.unsubmittedMembers[0].remainingMinutes).toBe(30);

    // Verify Member B details
    expect(result.unsubmittedMembers[1].userId).toBe('user-member-B');
    expect(result.unsubmittedMembers[1].userName).toBe('Member B');
    expect(result.unsubmittedMembers[1].email).toBe('member-b@company.com');
    expect(result.unsubmittedMembers[1].remainingMinutes).toBe(30);

    // Verify Member C details
    expect(result.unsubmittedMembers[2].userId).toBe('user-member-C');
    expect(result.unsubmittedMembers[2].userName).toBe('Member C');
    expect(result.unsubmittedMembers[2].email).toBe('member-c@company.com');
    expect(result.unsubmittedMembers[2].remainingMinutes).toBe(30);

    // Verify aggregation timestamp is recorded in ISO 8601 format
    expect(result.aggregatedAt).toBeDefined();
    const aggregatedDate = new Date(result.aggregatedAt);
    expect(aggregatedDate.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);

    // Verify that submitted members are NOT in the unsubmitted list
    const unsubmittedUserIds = result.unsubmittedMembers.map((member) => member.userId);
    expect(unsubmittedUserIds).not.toContain('user-member-D');
    expect(unsubmittedUserIds).not.toContain('user-member-E');
    expect(unsubmittedUserIds).not.toContain('user-member-F');
    expect(unsubmittedUserIds).not.toContain('user-member-G');
    expect(unsubmittedUserIds).not.toContain('user-member-H');
    expect(unsubmittedUserIds).not.toContain('user-member-I');
    expect(unsubmittedUserIds).not.toContain('user-member-J');
  });
});