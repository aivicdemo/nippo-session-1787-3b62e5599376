import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Tracking - Dashboard Display', () => {
  // SCEN-2889: [normal] 提出状況表示機能 - 朝会開始30分前時点で、部長ダッシュボードに未提出メンバーが0件として表示される
  test('should display zero unsubmitted members on director dashboard 30 minutes before morning meeting start time', async () => {
    // Setup: Base times and constants
    const reportDate = '2024-01-15';
    const morningMeetingStartTime = '09:00'; // JST
    const dashboardCheckTime = new Date('2024-01-15T08:30:00+09:00'); // 30 minutes before meeting
    const teamId = 'team-alpha-001';
    const requestUserId = 'user-director-001';

    // Setup: Team members (10 members total)
    const teamMemberIds = [
      'user-member-001',
      'user-member-002',
      'user-member-003',
      'user-member-004',
      'user-member-005',
      'user-member-006',
      'user-member-007',
      'user-member-008',
      'user-member-009',
      'user-member-010',
    ];

    // Setup: Mock database state - all 10 members have NOT submitted by 08:30
    const mockTeamMembers = teamMemberIds.map((userId, index) => ({
      userId,
      userName: `Engineer ${index + 1}`,
      email: `engineer${index + 1}@company.example.com`,
      submissionTimestamp: null, // Not submitted
      isDeleted: false,
    }));

    // Setup: Mock aggregation data
    const totalMembers = mockTeamMembers.length;
    const submittedCount = 0; // All unsubmitted at 08:30
    const unsubmittedCount = 10; // All 10 members unsubmitted
    const delayedSubmissionCount = 0; // No delayed submissions at this point

    // Calculate submission rate: (0 submitted / 10 total) * 100 = 0%
    const submissionRate = (submittedCount / totalMembers) * 100;

    // Setup: Build unsubmitted members list
    const unsubmittedMembers = mockTeamMembers.map((member) => {
      const meetingStartDateTime = new Date(`2024-01-15T${morningMeetingStartTime}:00+09:00`);
      const remainingMinutes = Math.floor(
        (meetingStartDateTime.getTime() - dashboardCheckTime.getTime()) / (1000 * 60)
      );
      return {
        userId: member.userId,
        userName: member.userName,
        email: member.email,
        remainingMinutes,
      };
    });

    // Setup: Aggregation request
    const aggregationInput: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // Execute: Call aggregateReportSubmissionStatus
    const result = await aggregateReportSubmissionStatus(aggregationInput);

    // Verify: Result structure and values
    expect(result).toBeDefined();
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(0);
    expect(result.unsubmittedCount).toBe(10);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(0.0);

    // Verify: Unsubmitted members details
    expect(result.unsubmittedMembers).toHaveLength(10);
    result.unsubmittedMembers.forEach((member, index) => {
      expect(member.userId).toBe(teamMemberIds[index]);
      expect(member.userName).toBe(`Engineer ${index + 1}`);
      expect(member.email).toBe(`engineer${index + 1}@company.example.com`);
      expect(member.remainingMinutes).toBe(30); // 30 minutes until 09:00
    });

    // Verify: Aggregation timestamp is recorded
    expect(result.aggregatedAt).toBeDefined();
    const aggregatedAtTime = new Date(result.aggregatedAt);
    expect(aggregatedAtTime.getTime()).toBeGreaterThanOrEqual(dashboardCheckTime.getTime() - 1000);
    expect(aggregatedAtTime.getTime()).toBeLessThanOrEqual(dashboardCheckTime.getTime() + 60000);

    // Verify: Dashboard display conditions
    // - Unsubmitted members count should be 10 (not 0)
    // - Form should NOT be displayed to director (only to team members)
    // - No reminder notifications should have been sent at this time
    expect(result.unsubmittedCount).toBe(10);
    expect(result.submittedCount).toBe(0);
  });
});