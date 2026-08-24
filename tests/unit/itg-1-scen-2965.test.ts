import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('報告提出状況集計機能', () => {
  // SCEN-2965: [normal] 報告提出状況集計機能 - 提出済みメンバーが複数人のとき、全提出者が正しく識別される
  test('提出済みメンバーが複数人のとき、全提出者が正しく識別される', () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'manager-001';

    const unsubmittedMember_06 = {
      userId: 'member-06',
      userName: 'メンバー06',
      email: 'member06@example.com',
      remainingMinutes: 15
    };

    const unsubmittedMember_07 = {
      userId: 'member-07',
      userName: 'メンバー07',
      email: 'member07@example.com',
      remainingMinutes: 10
    };

    const unsubmittedMember_08 = {
      userId: 'member-08',
      userName: 'メンバー08',
      email: 'member08@example.com',
      remainingMinutes: 5
    };

    const unsubmittedMember_09 = {
      userId: 'member-09',
      userName: 'メンバー09',
      email: 'member09@example.com',
      remainingMinutes: 0
    };

    const unsubmittedMember_10 = {
      userId: 'member-10',
      userName: 'メンバー10',
      email: 'member10@example.com',
      remainingMinutes: -5
    };

    const input = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true
    };

    const result = aggregateReportSubmissionStatus(input);

    expect(result.teamId).toBe('team-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.totalMembers).toBe(10);
    expect(result.submittedCount).toBe(5);
    expect(result.unsubmittedCount).toBe(5);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(50.0);

    expect(result.unsubmittedMembers).toHaveLength(5);
    expect(result.unsubmittedMembers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 'member-06',
          userName: 'メンバー06',
          email: 'member06@example.com'
        }),
        expect.objectContaining({
          userId: 'member-07',
          userName: 'メンバー07',
          email: 'member07@example.com'
        }),
        expect.objectContaining({
          userId: 'member-08',
          userName: 'メンバー08',
          email: 'member08@example.com'
        }),
        expect.objectContaining({
          userId: 'member-09',
          userName: 'メンバー09',
          email: 'member09@example.com'
        }),
        expect.objectContaining({
          userId: 'member-10',
          userName: 'メンバー10',
          email: 'member10@example.com'
        })
      ])
    );

    expect(result.aggregatedAt).toBeDefined();
    const aggregatedAtDate = new Date(result.aggregatedAt);
    expect(aggregatedAtDate.getTime()).toBeLessThanOrEqual(new Date().getTime());
    expect(aggregatedAtDate.getTime()).toBeGreaterThan(new Date().getTime() - 5000);
  });
});