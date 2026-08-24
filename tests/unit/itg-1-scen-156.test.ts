import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム表示機能', () => {
  // SCEN-156: [edge] 全メンバーが報告未提出のとき、未提出メンバーリストに全員が表示される
  test('メンバー10名全員未提出のとき、全員が未提出メンバーリストに表示される', () => {
    const teamId = 'team-dev-001';
    const reportDate = '2024-12-16';
    const requestUserId = 'manager-001';

    // テスト対象チームの構成: メンバー10名
    const allMembers = [
      { userId: 'user-001', userName: '田中太郎', email: 'tanaka@example.com' },
      { userId: 'user-002', userName: '鈴木花子', email: 'suzuki@example.com' },
      { userId: 'user-003', userName: '佐藤次郎', email: 'sato@example.com' },
      { userId: 'user-004', userName: '渡辺美咲', email: 'watanabe@example.com' },
      { userId: 'user-005', userName: '伊藤健太', email: 'ito@example.com' },
      { userId: 'user-006', userName: '中村由美', email: 'nakamura@example.com' },
      { userId: 'user-007', userName: '小林翔太', email: 'kobayashi@example.com' },
      { userId: 'user-008', userName: '加藤裕子', email: 'kato@example.com' },
      { userId: 'user-009', userName: '山田太郎', email: 'yamada@example.com' },
      { userId: 'user-010', userName: '山口花美', email: 'yamaguchi@example.com' },
    ];

    // 全メンバーが未提出状態（提出記録がない）
    const submittedUserIds = new Set<string>();

    // 朝会開始時刻の30分前のタイムスタンプ（期限内）
    const executionTime = new Date('2024-12-16T08:30:00Z');

    const result = aggregateReportSubmissionStatus(
      {
        teamId,
        reportDate,
        requestUserId,
        includeDelayedSubmissions: true,
      },
      {
        teamId,
        totalMembers: allMembers.length,
        submittedUserIds,
        allMembers,
        reportDeadlineTime: new Date('2024-12-16T09:00:00Z'),
        currentTime: executionTime,
      }
    );

    // 期待値の計算
    const expectedTotalMembers = 10;
    const expectedSubmittedCount = 0;
    const expectedUnsubmittedCount = 10;
    const expectedDelayedSubmissionCount = 0;
    const expectedSubmissionRate = 0.0; // (0 / 10) * 100 = 0.0

    // アサーション
    expect(result.teamId).toBe(teamId);
    expect(result.reportDate).toBe(reportDate);
    expect(result.totalMembers).toBe(expectedTotalMembers);
    expect(result.submittedCount).toBe(expectedSubmittedCount);
    expect(result.unsubmittedCount).toBe(expectedUnsubmittedCount);
    expect(result.delayedSubmissionCount).toBe(expectedDelayedSubmissionCount);
    expect(result.submissionRate).toBe(expectedSubmissionRate);

    // 未提出メンバーリストの検証
    expect(result.unsubmittedMembers).toHaveLength(expectedUnsubmittedCount);

    // 全メンバーが未提出リストに含まれていることを確認
    const unsubmittedUserIds = new Set(result.unsubmittedMembers.map(m => m.userId));
    allMembers.forEach(member => {
      expect(unsubmittedUserIds.has(member.userId)).toBe(true);
    });

    // 各未提出メンバーの情報が正確に含まれていることを確認
    result.unsubmittedMembers.forEach(unsubmittedMember => {
      const originalMember = allMembers.find(m => m.userId === unsubmittedMember.userId);
      expect(originalMember).toBeDefined();
      expect(unsubmittedMember.userName).toBe(originalMember!.userName);
      expect(unsubmittedMember.email).toBe(originalMember!.email);
    });

    // 残り時間の検証（朝会開始30分前なので1800分）
    result.unsubmittedMembers.forEach(unsubmittedMember => {
      expect(unsubmittedMember.remainingMinutes).toBe(30);
    });

    // 集計実行時刻が記録されていることを確認
    expect(result.aggregatedAt).toBeDefined();
    const aggregatedAtTime = new Date(result.aggregatedAt);
    expect(aggregatedAtTime.getTime()).toBeLessThanOrEqual(executionTime.getTime() + 1000);
  });
});