import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボードの報告提出状況リアルタイム表示', () => {
  // SCEN-1620
  test('[normal] 未提出メンバー抽出機能 - 報告提出状況から未提出メンバー 1 人を抽出し、1 人の未提出者がリストに含まれる', async () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const morningMeetingStartTime = '09:00';
    const executorUserId = 'manager-001';

    // テストデータ: 10名のチームメンバー
    // memberA～memberIは報告を提出済み、memberJのみ未提出
    const unsubmittedMembers = [
      {
        userId: 'member-010',
        userName: 'memberJ',
        email: 'memberJ@example.com',
        remainingMinutes: -30,
      },
    ];

    const notificationsSent = 1;
    const notificationFailures: Array<{
      userId: string;
      failureReason: string;
    }> = [];

    const input = {
      teamId,
      reportDate,
      morningMeetingStartTime,
      executorUserId,
    };

    const result = await detectAndNotifyUnsubmittedMembers(input);

    // 期待結果: 未提出メンバー抽出結果に memberJ が1件含まれている
    expect(result.unsubmittedMembers).toHaveLength(1);
    expect(result.unsubmittedMembers[0].userId).toBe('member-010');
    expect(result.unsubmittedMembers[0].userName).toBe('memberJ');
    expect(result.unsubmittedMembers[0].email).toBe('memberJ@example.com');

    // 抽出されたメンバー数は1人である
    expect(result.unsubmittedMembers.length).toBe(1);

    // リマインド通知が1件送信された
    expect(result.notificationsSent).toBe(notificationsSent);

    // 通知送信失敗がない
    expect(result.notificationFailures).toEqual(notificationFailures);

    // 処理実行日時がISO 8601形式で記録されている
    expect(result.executedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});