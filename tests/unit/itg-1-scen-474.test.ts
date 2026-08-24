import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Tracking', () => {
  // SCEN-474: [edge] 報告提出状況リアルタイム表示機能 - 9名が報告提出済みで1名が未提出の場合、未提出メンバーが一覧で正確に識別される
  test('should accurately identify 1 unsubmitted member among 10 team members with 9 submitted reports', async () => {
    const teamId = 'team-engineering-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'leader-user-001';

    const mockSubmittedMembers = [
      {
        userId: 'member1',
        userName: 'Alice Johnson',
        email: 'alice.johnson@company.com',
        submittedAt: new Date('2024-01-15T08:45:00Z'),
      },
      {
        userId: 'member2',
        userName: 'Bob Smith',
        email: 'bob.smith@company.com',
        submittedAt: new Date('2024-01-15T08:50:00Z'),
      },
      {
        userId: 'member3',
        userName: 'Carol White',
        email: 'carol.white@company.com',
        submittedAt: new Date('2024-01-15T08:52:00Z'),
      },
      {
        userId: 'member4',
        userName: 'David Brown',
        email: 'david.brown@company.com',
        submittedAt: new Date('2024-01-15T08:55:00Z'),
      },
      {
        userId: 'member5',
        userName: 'Eve Davis',
        email: 'eve.davis@company.com',
        submittedAt: new Date('2024-01-15T09:00:00Z'),
      },
      {
        userId: 'member6',
        userName: 'Frank Wilson',
        email: 'frank.wilson@company.com',
        submittedAt: new Date('2024-01-15T09:05:00Z'),
      },
      {
        userId: 'member7',
        userName: 'Grace Martinez',
        email: 'grace.martinez@company.com',
        submittedAt: new Date('2024-01-15T09:10:00Z'),
      },
      {
        userId: 'member8',
        userName: 'Henry Garcia',
        email: 'henry.garcia@company.com',
        submittedAt: new Date('2024-01-15T09:15:00Z'),
      },
      {
        userId: 'member9',
        userName: 'Iris Rodriguez',
        email: 'iris.rodriguez@company.com',
        submittedAt: new Date('2024-01-15T09:20:00Z'),
      },
    ];

    const mockUnsubmittedMember = {
      userId: 'member10',
      userName: 'Jack Lee',
      email: 'jack.lee@company.com',
    };

    const reportDeadline = new Date('2024-01-15T09:30:00Z');
    const currentTime = new Date('2024-01-15T09:25:00Z');

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const result: ReportSubmissionStatusSummary = await aggregateReportSubmissionStatus(input);

    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(9);
    expect(result.unsubmittedCount).toBe(1);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(90.0);

    expect(result.unsubmittedMembers).toHaveLength(1);
    expect(result.unsubmittedMembers[0]).toEqual(
      expect.objectContaining({
        userId: 'member10',
        userName: 'Jack Lee',
        email: 'jack.lee@company.com',
      })
    );

    expect(result.unsubmittedMembers[0].remainingMinutes).toBeLessThanOrEqual(5);

    const aggregatedAtTime = new Date(result.aggregatedAt);
    expect(aggregatedAtTime.getTime()).toBeLessThanOrEqual(new Date().getTime());
    expect(aggregatedAtTime.getTime()).toBeGreaterThanOrEqual(
      new Date('2024-01-15T00:00:00Z').getTime()
    );
  });
});