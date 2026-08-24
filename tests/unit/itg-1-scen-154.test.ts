import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム表示機能', () => {
  // SCEN-154: [edge] 報告提出状況リアルタイム表示機能 - 報告期限の直前時点で未提出メンバー一覧が最新化される
  test('報告期限の直前時点で未提出メンバー一覧が最新化される', () => {
    // Arrange
    const baseDate = new Date('2024-01-15');
    const reportDate = '2024-01-15';
    const teamId = 'team-001';
    const requestUserId = 'manager-001';

    // テスト用に10名のユーザーを定義
    const allTeamMembers = [
      { userId: 'user01', userName: 'Member 01', email: 'user01@example.com' },
      { userId: 'user02', userName: 'Member 02', email: 'user02@example.com' },
      { userId: 'user03', userName: 'Member 03', email: 'user03@example.com' },
      { userId: 'user04', userName: 'Member 04', email: 'user04@example.com' },
      { userId: 'user05', userName: 'Member 05', email: 'user05@example.com' },
      { userId: 'user06', userName: 'Member 06', email: 'user06@example.com' },
      { userId: 'user07', userName: 'Member 07', email: 'user07@example.com' },
      { userId: 'user08', userName: 'Member 08', email: 'user08@example.com' },
      { userId: 'user09', userName: 'Member 09', email: 'user09@example.com' },
      { userId: 'user10', userName: 'Member 10', email: 'user10@example.com' },
    ];

    const totalMembers = allTeamMembers.length;
    const submittedCount = 7; // user01～user07が提出済み
    const unsubmittedCount = 3; // user08～user10が未提出
    const delayedSubmissionCount = 0;

    const unsubmittedMembers = [
      { userId: 'user08', userName: 'Member 08', email: 'user08@example.com', remainingMinutes: 5 },
      { userId: 'user09', userName: 'Member 09', email: 'user09@example.com', remainingMinutes: 5 },
      { userId: 'user10', userName: 'Member 10', email: 'user10@example.com', remainingMinutes: 5 },
    ];

    const submissionRate = 70.0; // (7 / 10) * 100 = 70.0

    const input: AggregateReportSubmissionStatusInput = {
      teamId,
      reportDate,
      requestUserId,
      includeDelayedSubmissions: true,
    };

    // Act
    const result = aggregateReportSubmissionStatus(
      input,
      {
        fetchTeamMembers: async () => allTeamMembers,
        fetchSubmittedReports: async () =>
          allTeamMembers.slice(0, 7).map((member) => ({
            userId: member.userId,
            submissionTimestamp: new Date('2024-01-15T08:30:00Z'),
          })),
        calculateRemainingMinutes: () => 5,
        getCurrentTime: () => baseDate,
      }
    );

    // Assert
    expect(result).toBeDefined();
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(totalMembers);
    expect(result.submittedCount).toBe(submittedCount);
    expect(result.unsubmittedCount).toBe(unsubmittedCount);
    expect(result.delayedSubmissionCount).toBe(delayedSubmissionCount);
    expect(result.submissionRate).toBe(submissionRate);

    // 未提出メンバーの順序と内容を確認
    expect(result.unsubmittedMembers).toHaveLength(3);
    expect(result.unsubmittedMembers[0]).toEqual({
      userId: 'user08',
      userName: 'Member 08',
      email: 'user08@example.com',
      remainingMinutes: 5,
    });
    expect(result.unsubmittedMembers[1]).toEqual({
      userId: 'user09',
      userName: 'Member 09',
      email: 'user09@example.com',
      remainingMinutes: 5,
    });
    expect(result.unsubmittedMembers[2]).toEqual({
      userId: 'user10',
      userName: 'Member 10',
      email: 'user10@example.com',
      remainingMinutes: 5,
    });

    // aggregatedAtがISO 8601形式で記録されていることを確認
    expect(result.aggregatedAt).toBeDefined();
    expect(typeof result.aggregatedAt).toBe('string');
    const aggregatedAtDate = new Date(result.aggregatedAt);
    expect(aggregatedAtDate.getFullYear()).toBe(2024);
    expect(aggregatedAtDate.getMonth()).toBe(0); // January is 0
    expect(aggregatedAtDate.getDate()).toBe(15);
  });
});