import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Real-time Display', () => {
  // SCEN-2800: [edge] 報告提出状況リアルタイム表示機能 - 提出済みと未提出の報告数が全メンバー数の合計と一致する
  test('should ensure submitted and unsubmitted counts sum to total team members', async () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'manager-001';

    // Team setup: 10 members total
    const totalTeamMembers = 10;
    const submittedMembersCount = 5;
    const unsubmittedMembersCount = 5;

    // Mock unsubmitted members data
    const unsubmittedMembers = [
      {
        userId: 'member-006',
        userName: 'Member F',
        email: 'member-f@company.com',
        remainingMinutes: 45,
      },
      {
        userId: 'member-007',
        userName: 'Member G',
        email: 'member-g@company.com',
        remainingMinutes: 45,
      },
      {
        userId: 'member-008',
        userName: 'Member H',
        email: 'member-h@company.com',
        remainingMinutes: 45,
      },
      {
        userId: 'member-009',
        userName: 'Member I',
        email: 'member-i@company.com',
        remainingMinutes: 45,
      },
      {
        userId: 'member-010',
        userName: 'Member J',
        email: 'member-j@company.com',
        remainingMinutes: 45,
      },
    ];

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // Call the function to aggregate report submission status
    const result: ReportSubmissionStatusSummary = await aggregateReportSubmissionStatus(input);

    // Verify that submitted + unsubmitted equals total members
    const totalCounted = result.submittedCount + result.unsubmittedCount;
    expect(totalCounted).toBe(totalTeamMembers);

    // Verify submitted count matches expected value
    expect(result.submittedCount).toBe(submittedMembersCount);

    // Verify unsubmitted count matches expected value
    expect(result.unsubmittedCount).toBe(unsubmittedMembersCount);

    // Verify total members count
    expect(result.totalMembers).toBe(totalTeamMembers);

    // Verify submission rate calculation: (5 / 10) * 100 = 50.0
    expect(result.submissionRate).toBe(50.0);

    // Verify unsubmitted members list length matches unsubmitted count
    expect(result.unsubmittedMembers).toHaveLength(unsubmittedMembersCount);

    // Verify unsubmitted members details are populated
    expect(result.unsubmittedMembers[0]).toHaveProperty('userId');
    expect(result.unsubmittedMembers[0]).toHaveProperty('userName');
    expect(result.unsubmittedMembers[0]).toHaveProperty('email');
    expect(result.unsubmittedMembers[0]).toHaveProperty('remainingMinutes');

    // Verify aggregated timestamp is set
    expect(result.aggregatedAt).toBeDefined();
    expect(typeof result.aggregatedAt).toBe('string');

    // Verify team ID and report date are preserved
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
  });
});