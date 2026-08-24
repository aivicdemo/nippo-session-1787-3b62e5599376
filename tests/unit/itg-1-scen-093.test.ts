import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボード提出状況リアルタイム表示機能', () => {
  // SCEN-093
  test('チームメンバーの報告データ一覧が空配列のとき、未提出メンバーの詳細情報が空となり、提出状況の集計が完了すること', () => {
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'manager-001',
      includeDelayedSubmissions: true,
    };

    const result = aggregateReportSubmissionStatus(input, {
      fetchTeamMembers: async () => [
        { userId: 'user-001', userName: 'Alice', email: 'alice@example.com' },
        { userId: 'user-002', userName: 'Bob', email: 'bob@example.com' },
        { userId: 'user-003', userName: 'Charlie', email: 'charlie@example.com' },
      ],
      fetchReportSubmissions: async () => [],
      getReportDeadline: async () => ({
        deadlineTime: new Date('2024-01-15T09:00:00Z'),
        timeZone: 'Asia/Tokyo',
      }),
      getCurrentTime: () => new Date('2024-01-15T09:05:00Z'),
    });

    return result.then((summary) => {
      expect(summary.teamId).toBe('team-001');
      expect(summary.reportDate).toBe('2024-01-15');
      expect(summary.totalMembers).toBe(3);
      expect(summary.submittedCount).toBe(0);
      expect(summary.unsubmittedCount).toBe(3);
      expect(summary.delayedSubmissionCount).toBe(0);
      expect(summary.submissionRate).toBe(0.0);
      expect(summary.unsubmittedMembers).toHaveLength(3);
      expect(summary.unsubmittedMembers[0]).toEqual({
        userId: 'user-001',
        userName: 'Alice',
        email: 'alice@example.com',
        remainingMinutes: -5,
      });
      expect(summary.unsubmittedMembers[1]).toEqual({
        userId: 'user-002',
        userName: 'Bob',
        email: 'bob@example.com',
        remainingMinutes: -5,
      });
      expect(summary.unsubmittedMembers[2]).toEqual({
        userId: 'user-003',
        userName: 'Charlie',
        email: 'charlie@example.com',
        remainingMinutes: -5,
      });
      expect(summary.aggregatedAt).toBeDefined();
    });
  });
});