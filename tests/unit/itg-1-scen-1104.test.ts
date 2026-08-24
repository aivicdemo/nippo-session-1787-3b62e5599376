import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('報告提出状況追跡機能', () => {
  // SCEN-1104
  test('複数メンバーの提出状況に重複データが含まれる場合、ユニークに集約される', () => {
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'manager-001',
      includeDelayedSubmissions: true,
    };

    const submissionRecords = [
      {
        userId: 'member-a',
        userName: 'Member A',
        email: 'a@example.com',
        submissionTimestamp: new Date('2024-01-15T09:00:00Z'),
        isOnTime: true,
      },
      {
        userId: 'member-b',
        userName: 'Member B',
        email: 'b@example.com',
        submissionTimestamp: new Date('2024-01-15T09:05:00Z'),
        isOnTime: true,
      },
      {
        userId: 'member-a',
        userName: 'Member A',
        email: 'a@example.com',
        submissionTimestamp: new Date('2024-01-15T09:00:00Z'),
        isOnTime: true,
      },
      {
        userId: 'member-c',
        userName: 'Member C',
        email: 'c@example.com',
        submissionTimestamp: new Date('2024-01-15T09:10:00Z'),
        isOnTime: true,
      },
      {
        userId: 'member-b',
        userName: 'Member B',
        email: 'b@example.com',
        submissionTimestamp: new Date('2024-01-15T09:05:00Z'),
        isOnTime: true,
      },
    ];

    const allTeamMembers = [
      { userId: 'member-a', userName: 'Member A', email: 'a@example.com' },
      { userId: 'member-b', userName: 'Member B', email: 'b@example.com' },
      { userId: 'member-c', userName: 'Member C', email: 'c@example.com' },
      { userId: 'member-d', userName: 'Member D', email: 'd@example.com' },
    ];

    const deadlineTime = new Date('2024-01-15T10:00:00Z');

    const result = aggregateReportSubmissionStatus(
      input,
      submissionRecords,
      allTeamMembers,
      deadlineTime
    );

    expect(result.teamId).toBe('team-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.totalMembers).toBe(4);
    expect(result.submittedCount).toBe(3);
    expect(result.unsubmittedCount).toBe(1);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(75.0);

    const uniqueSubmittedUserIds = new Set(result.unsubmittedMembers.map((m) => m.userId));
    expect(uniqueSubmittedUserIds.size).toBe(1);
    expect(result.unsubmittedMembers[0].userId).toBe('member-d');

    expect(result.aggregatedAt).toBeDefined();
    const aggregatedAtTime = new Date(result.aggregatedAt);
    expect(aggregatedAtTime.getTime()).toBeGreaterThan(0);
  });
});