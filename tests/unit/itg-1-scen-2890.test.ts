import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Tracking', () => {
  // SCEN-2890
  test('should display only unsubmitted member (1) in dashboard 30 minutes before morning meeting start', () => {
    // Setup: Fixed system time at 30 minutes before morning meeting
    // Morning meeting start: 2024-01-15 09:30:00
    // Current time (30 min before): 2024-01-15 09:00:00
    const currentTime = new Date('2024-01-15T09:00:00Z');
    const morningMeetingStart = new Date('2024-01-15T09:30:00Z');
    const reportDate = '2024-01-15';
    const teamId = 'team_001';
    const deptManagerId = 'dept_manager_001';

    // Prepare 9 submitted members (submitted 45+ minutes before meeting start)
    // Meeting starts at 09:30, so 45 min before = 08:45
    // These members submitted before or at 08:45
    const submittedMemberIds = [
      'member_001', 'member_002', 'member_003', 'member_004', 'member_005',
      'member_006', 'member_007', 'member_008', 'member_009'
    ];
    const submissionTime = new Date('2024-01-15T08:45:00Z');

    // 1 member not submitted: member_010 (no submission record)
    const unsubmittedMemberId = 'member_010';

    // Mock database state: 9 submitted reports
    const submittedReports = submittedMemberIds.map(memberId => ({
      userId: memberId,
      teamId,
      reportDate,
      submissionTimestamp: submissionTime,
      status: 'submitted' as const
    }));

    // Total team members: 10
    const totalMembers = 10;
    const submittedCount = submittedReports.length; // 9
    const unsubmittedCount = totalMembers - submittedCount; // 1

    // Build input
    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId: deptManagerId,
      includeDelayedSubmissions: true
    };

    // Mock implementation: aggregateReportSubmissionStatus should return
    // a summary with unsubmittedMembers containing only member_010
    const unsubmittedMembers = [
      {
        userId: unsubmittedMemberId,
        userName: 'Member Ten',
        email: 'member_010@company.com',
        remainingMinutes: 30 // 09:30 - 09:00 = 30 minutes
      }
    ];

    // Calculate submission rate: 9 submitted / 10 total = 90.0%
    const submissionRate = (submittedCount / totalMembers) * 100; // 90.0

    const expectedOutput: ReportSubmissionStatusSummary = {
      teamId,
      reportDate,
      totalMembers,
      submittedCount,
      unsubmittedCount,
      delayedSubmissionCount: 0,
      submissionRate,
      unsubmittedMembers,
      aggregatedAt: '2024-01-15T09:00:00Z'
    };

    // Execute function
    const result = aggregateReportSubmissionStatus(input);

    // Assertions
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(9);
    expect(result.unsubmittedCount).toBe(1);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(90.0);
    expect(result.unsubmittedMembers).toHaveLength(1);
    expect(result.unsubmittedMembers[0].userId).toBe('member_010');
    expect(result.unsubmittedMembers[0].remainingMinutes).toBe(30);
  });
});