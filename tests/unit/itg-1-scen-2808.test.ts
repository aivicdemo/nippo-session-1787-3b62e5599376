import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー判定機能', () => {
  // SCEN-2808
  test('報告期限までに提出されていないメンバーが複数件のとき、全メンバー情報が優先度順リストで返される', () => {
    // 報告期限を「本日09:00」に設定
    const reportDeadline = new Date('2024-01-15T09:00:00Z');
    
    // 現在時刻を「本日09:30」（期限超過）に設定
    const currentTime = new Date('2024-01-15T09:30:00Z');
    
    // 未提出メンバーデータを用意（優先度スコア順：C > A > B）
    const unsubmittedMembers = [
      {
        userId: 'user-a',
        userName: 'メンバーA',
        email: 'member-a@example.com',
        priorityScore: 85,
        remainingMinutes: -30
      },
      {
        userId: 'user-b',
        userName: 'メンバーB',
        email: 'member-b@example.com',
        priorityScore: 72,
        remainingMinutes: -30
      },
      {
        userId: 'user-c',
        userName: 'メンバーC',
        email: 'member-c@example.com',
        priorityScore: 93,
        remainingMinutes: -30
      }
    ];

    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'executor-001',
      unsubmittedMembers,
      reportDeadline,
      currentTime
    };

    const result = detectAndNotifyUnsubmittedMembers(input);

    // 返却されるメンバーリストは3件
    expect(result.unsubmittedMembers).toHaveLength(3);

    // 優先度スコア順（降順）に [メンバーC（93）, メンバーA（85）, メンバーB（72）]
    expect(result.unsubmittedMembers[0]).toEqual({
      userId: 'user-c',
      userName: 'メンバーC',
      email: 'member-c@example.com',
      priorityScore: 93,
      remainingMinutes: -30
    });

    expect(result.unsubmittedMembers[1]).toEqual({
      userId: 'user-a',
      userName: 'メンバーA',
      email: 'member-a@example.com',
      priorityScore: 85,
      remainingMinutes: -30
    });

    expect(result.unsubmittedMembers[2]).toEqual({
      userId: 'user-b',
      userName: 'メンバーB',
      email: 'member-b@example.com',
      priorityScore: 72,
      remainingMinutes: -30
    });

    // 実行日時がISO 8601形式で記録されている
    expect(result.executedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);

    // 送信されたリマインド通知件数は3件
    expect(result.notificationsSent).toBe(3);

    // 通知送信失敗がないことを確認
    expect(result.notificationFailures).toEqual([]);
  });
});