import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Tracking - Dashboard Real-Time Display', () => {
  test('SCEN-2887: [normal] Dashboard displays 1 submitted member at 30 minutes before morning meeting', () => {
    // Setup: Define morning meeting time as 09:00
    const meetingTime = new Date('2024-01-15T09:00:00Z');
    const deadlineTime = meetingTime; // Deadline is meeting time
    const thirtyMinutesBefore = new Date('2024-01-15T08:30:00Z');

    // Setup: Create test team with 10 members (B~K)
    const teamId = 'team-001';
    const requestUserId = 'user-leader-A'; // Leader user A

    // Setup: Member B submitted report before 08:30 (at 08:25)
    const memberBSubmissionTime = new Date('2024-01-15T08:25:00Z');

    // Setup: Members C~K have not submitted (remain unsubmitted)
    // Simulated current time: 08:30 (30 minutes before meeting)
    const currentTime = thirtyMinutesBefore;

    // Setup: Create mock report submission data
    const mockSubmissions = [
      {
        userId: 'user-B',
        teamId: teamId,
        reportDate: '2024-01-15',
        submissionTimestamp: memberBSubmissionTime,
        status: 'submitted_on_time' as const,
      },
    ];

    // Setup: Total team members count is 10 (A is leader, B~K are team members)
    const totalTeamMembers = 10;
    const submittedOnTimeCount = 1;
    const unsubmittedCount = 9;
    const delayedSubmissionCount = 0;

    // Calculate submission rate: (1 / 10) * 100 = 10.0
    const expectedSubmissionRate = 10.0;

    // Create unsubmitted members list for C~K (9 members)
    const unsubmittedMembers = [
      {
        userId: 'user-C',
        userName: 'Member C',
        email: 'member-c@example.com',
        remainingMinutes: 30, // 30 minutes remaining until 09:00
      },
      {
        userId: 'user-D',
        userName: 'Member D',
        email: 'member-d@example.com',
        remainingMinutes: 30,
      },
      {
        userId: 'user-E',
        userName: 'Member E',
        email: 'member-e@example.com',
        remainingMinutes: 30,
      },
      {
        userId: 'user-F',
        userName: 'Member F',
        email: 'member-f@example.com',
        remainingMinutes: 30,
      },
      {
        userId: 'user-G',
        userName: 'Member G',
        email: 'member-g@example.com',
        remainingMinutes: 30,
      },
      {
        userId: 'user-H',
        userName: 'Member H',
        email: 'member-h@example.com',
        remainingMinutes: 30,
      },
      {
        userId: 'user-I',
        userName: 'Member I',
        email: 'member-i@example.com',
        remainingMinutes: 30,
      },
      {
        userId: 'user-J',
        userName: 'Member J',
        email: 'member-j@example.com',
        remainingMinutes: 30,
      },
      {
        userId: 'user-K',
        userName: 'Member K',
        email: 'member-k@example.com',
        remainingMinutes: 30,
      },
    ];

    // Prepare input for aggregateReportSubmissionStatus
    const input: AggregateReportSubmissionStatusInput = {
      teamId: teamId,
      reportDate: '2024-01-15',
      requestUserId: requestUserId,
      includeDelayedSubmissions: true,
    };

    // Execute: Call aggregateReportSubmissionStatus
    const result = aggregateReportSubmissionStatus(input);

    // Verify: Check team ID in result
    expect(result.teamId).toBe(teamId);

    // Verify: Check report date in result
    expect(result.reportDate).toBe('2024-01-15');

    // Verify: Check total members count
    expect(result.totalMembers).toBe(totalTeamMembers);

    // Verify: Check submitted count is 1
    expect(result.submittedCount).toBe(submittedOnTimeCount);

    // Verify: Check unsubmitted count is 9
    expect(result.unsubmittedCount).toBe(unsubmittedCount);

    // Verify: Check delayed submission count is 0
    expect(result.delayedSubmissionCount).toBe(delayedSubmissionCount);

    // Verify: Check submission rate is 10.0 (1 out of 10)
    expect(result.submissionRate).toBe(expectedSubmissionRate);

    // Verify: Check unsubmitted members list length is 9
    expect(result.unsubmittedMembers).toHaveLength(unsubmittedCount);

    // Verify: Check first unsubmitted member details (Member C)
    expect(result.unsubmittedMembers[0].userId).toBe('user-C');
    expect(result.unsubmittedMembers[0].userName).toBe('Member C');
    expect(result.unsubmittedMembers[0].email).toBe('member-c@example.com');
    expect(result.unsubmittedMembers[0].remainingMinutes).toBe(30);

    // Verify: Check last unsubmitted member details (Member K)
    expect(result.unsubmittedMembers[8].userId).toBe('user-K');
    expect(result.unsubmittedMembers[8].userName).toBe('Member K');
    expect(result.unsubmittedMembers[8].email).toBe('member-k@example.com');
    expect(result.unsubmittedMembers[8].remainingMinutes).toBe(30);

    // Verify: Check aggregatedAt is ISO 8601 format and is a valid timestamp
    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});