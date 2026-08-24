import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('報告提出状況集計機能', () => {
  // SCEN-2966
  test('同じ時点での提出状況を2回集計した場合、同じ結果が返される', () => {
    const teamId = 'team-001';
    const reportDate = '2026-08-19';
    const requestUserId = 'manager-001';
    const aggregationTime = '2026-08-19T10:00:00Z';

    const unsubmittedMembers = [
      {
        userId: 'user-001',
        userName: 'Alice',
        email: 'alice@example.com',
        remainingMinutes: -30,
      },
      {
        userId: 'user-002',
        userName: 'Bob',
        email: 'bob@example.com',
        remainingMinutes: -15,
      },
      {
        userId: 'user-003',
        userName: 'Charlie',
        email: 'charlie@example.com',
        remainingMinutes: 5,
      },
    ];

    const input = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    const firstResult = aggregateReportSubmissionStatus(input);

    const secondResult = aggregateReportSubmissionStatus(input);

    expect(firstResult.teamId).toBe(secondResult.teamId);
    expect(firstResult.reportDate).toBe(secondResult.reportDate);
    expect(firstResult.totalMembers).toBe(secondResult.totalMembers);
    expect(firstResult.submittedCount).toBe(secondResult.submittedCount);
    expect(firstResult.unsubmittedCount).toBe(secondResult.unsubmittedCount);
    expect(firstResult.delayedSubmissionCount).toBe(
      secondResult.delayedSubmissionCount,
    );
    expect(firstResult.submissionRate).toBe(secondResult.submissionRate);
    expect(firstResult.unsubmittedMembers).toEqual(
      secondResult.unsubmittedMembers,
    );
    expect(firstResult.aggregatedAt).toBe(secondResult.aggregatedAt);

    expect(firstResult.submittedCount).toBe(7);
    expect(firstResult.unsubmittedCount).toBe(3);
    expect(firstResult.totalMembers).toBe(10);
    expect(firstResult.submissionRate).toBe(70.0);
  });
});