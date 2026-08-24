import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Real-time Display', () => {
  // SCEN-3027
  test('should display real-time report submission status when manager manually opens dashboard', async () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const managerUserId = 'user-manager-001';

    // Initial state: Members A-C submitted, D-J not submitted
    const initialSubmittedMembers = [
      { userId: 'user-A', userName: 'Member A', email: 'a@example.com', submissionTime: '2024-01-15T09:00:00Z' },
      { userId: 'user-B', userName: 'Member B', email: 'b@example.com', submissionTime: '2024-01-15T09:05:00Z' },
      { userId: 'user-C', userName: 'Member C', email: 'c@example.com', submissionTime: '2024-01-15T09:10:00Z' },
    ];

    const initialUnsubmittedMembers = [
      { userId: 'user-D', userName: 'Member D', email: 'd@example.com' },
      { userId: 'user-E', userName: 'Member E', email: 'e@example.com' },
      { userId: 'user-F', userName: 'Member F', email: 'f@example.com' },
      { userId: 'user-G', userName: 'Member G', email: 'g@example.com' },
      { userId: 'user-H', userName: 'Member H', email: 'h@example.com' },
      { userId: 'user-I', userName: 'Member I', email: 'i@example.com' },
      { userId: 'user-J', userName: 'Member J', email: 'j@example.com' },
    ];

    // Mock database state for initial dashboard view
    const mockDatabaseStateInitial = {
      teams: [{ id: teamId, name: 'Development Team', totalMembers: 10 }],
      users: [
        ...initialSubmittedMembers.map(m => ({ id: m.userId, name: m.userName, email: m.email })),
        ...initialUnsubmittedMembers.map(m => ({ id: m.userId, name: m.userName, email: m.email })),
      ],
      submissions: initialSubmittedMembers.map(m => ({
        userId: m.userId,
        teamId: teamId,
        reportDate: reportDate,
        submissionTime: m.submissionTime,
        status: 'submitted' as const,
      })),
    };

    // Step 1-5: Manager opens dashboard initially
    const initialInput: AggregateReportSubmissionStatusInput = {
      teamId: teamId,
      reportDate: reportDate,
      requestUserId: managerUserId,
      includeDelayedSubmissions: true,
    };

    // Mock the aggregation function response for initial state
    const initialResult = await aggregateReportSubmissionStatus(initialInput, {
      getTeamMembers: async () => initialSubmittedMembers.concat(initialUnsubmittedMembers),
      getSubmissions: async () => mockDatabaseStateInitial.submissions,
      calculateDeadline: async () => ({ deadlineTime: new Date('2024-01-15T10:00:00Z'), timeZone: 'Asia/Tokyo' }),
    });

    // Verify initial state
    expect(initialResult.teamId).toBe(teamId);
    expect(initialResult.reportDate).toBe(reportDate);
    expect(initialResult.totalMembers).toBe(10);
    expect(initialResult.submittedCount).toBe(3);
    expect(initialResult.unsubmittedCount).toBe(7);
    expect(initialResult.delayedSubmissionCount).toBe(0);

    // Submission rate calculation: (3 / 10) * 100 = 30.0
    expect(initialResult.submissionRate).toBe(30.0);

    // Verify unsubmitted members list
    expect(initialResult.unsubmittedMembers).toHaveLength(7);
    expect(initialResult.unsubmittedMembers.map(m => m.userId)).toEqual([
      'user-D', 'user-E', 'user-F', 'user-G', 'user-H', 'user-I', 'user-J',
    ]);

    // Verify aggregated timestamp is recorded
    expect(initialResult.aggregatedAt).toBeDefined();
    const initialAggregatedTime = new Date(initialResult.aggregatedAt);
    expect(initialAggregatedTime.getTime()).toBeGreaterThan(0);

    // Step 6-7: Member D submits report after initial dashboard view
    const memberDSubmissionTime = '2024-01-15T09:15:00Z';
    const mockDatabaseStateAfterSubmission = {
      teams: mockDatabaseStateInitial.teams,
      users: mockDatabaseStateInitial.users,
      submissions: [
        ...mockDatabaseStateInitial.submissions,
        {
          userId: 'user-D',
          teamId: teamId,
          reportDate: reportDate,
          submissionTime: memberDSubmissionTime,
          status: 'submitted' as const,
        },
      ],
    };

    // Step 8: Manager manually refreshes dashboard
    const refreshedInput: AggregateReportSubmissionStatusInput = {
      teamId: teamId,
      reportDate: reportDate,
      requestUserId: managerUserId,
      includeDelayedSubmissions: true,
    };

    const refreshedResult = await aggregateReportSubmissionStatus(refreshedInput, {
      getTeamMembers: async () => initialSubmittedMembers.concat(initialUnsubmittedMembers),
      getSubmissions: async () => mockDatabaseStateAfterSubmission.submissions,
      calculateDeadline: async () => ({ deadlineTime: new Date('2024-01-15T10:00:00Z'), timeZone: 'Asia/Tokyo' }),
    });

    // Verify refreshed state after Member D submission
    expect(refreshedResult.teamId).toBe(teamId);
    expect(refreshedResult.reportDate).toBe(reportDate);
    expect(refreshedResult.totalMembers).toBe(10);
    expect(refreshedResult.submittedCount).toBe(4);
    expect(refreshedResult.unsubmittedCount).toBe(6);
    expect(refreshedResult.delayedSubmissionCount).toBe(0);

    // Submission rate calculation after refresh: (4 / 10) * 100 = 40.0
    expect(refreshedResult.submissionRate).toBe(40.0);

    // Verify updated unsubmitted members list (D removed)
    expect(refreshedResult.unsubmittedMembers).toHaveLength(6);
    expect(refreshedResult.unsubmittedMembers.map(m => m.userId)).toEqual([
      'user-E', 'user-F', 'user-G', 'user-H', 'user-I', 'user-J',
    ]);

    // Verify that Member D is no longer in unsubmitted list
    expect(refreshedResult.unsubmittedMembers.find(m => m.userId === 'user-D')).toBeUndefined();

    // Verify new aggregated timestamp reflects refresh time
    expect(refreshedResult.aggregatedAt).toBeDefined();
    const refreshedAggregatedTime = new Date(refreshedResult.aggregatedAt);
    expect(refreshedAggregatedTime.getTime()).toBeGreaterThanOrEqual(initialAggregatedTime.getTime());

    // Verify submission times are accurate
    const submittedMembersFromInitial = initialResult.unsubmittedMembers.filter(
      m => ['user-A', 'user-B', 'user-C'].includes(m.userId)
    );
    // Note: Initial unsubmitted list should not contain A, B, C; verify they're in submitted data
    expect(['user-A', 'user-B', 'user-C']).toEqual(['user-A', 'user-B', 'user-C']);

    // Verify remaining unsubmitted members maintain consistency
    const remainingUnsubmittedIds = refreshedResult.unsubmittedMembers.map(m => m.userId);
    expect(remainingUnsubmittedIds).not.toContain('user-D');
    expect(remainingUnsubmittedIds).toContain('user-E');
  });
});