import { describe, test, expect } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボード - 報告提出状況リアルタイム表示機能', () => {
  // SCEN-2807: [normal] 未提出メンバー判定機能 - 報告期限までに提出されていないメンバーが1件のとき、そのメンバー情報が優先度順リストで返される
  test('未提出メンバーが1件のときに、そのメンバー情報が優先度順リストで返される', () => {
    // テストデータ準備: チームメンバー情報と提出状態の設定
    const teamId = 'team_dev_001';
    const reportDate = '2024-01-15';
    const morningMeetingStartTime = '09:00';
    const executorUserId = 'manager_001';

    // メンバーデータ: メンバーAは未提出、メンバーB～Jは提出済み
    const teamMembers = [
      {
        userId: 'member_a',
        userName: 'メンバーA',
        email: 'member-a@example.com',
      },
      {
        userId: 'member_b',
        userName: 'メンバーB',
        email: 'member-b@example.com',
      },
      {
        userId: 'member_c',
        userName: 'メンバーC',
        email: 'member-c@example.com',
      },
      {
        userId: 'member_d',
        userName: 'メンバーD',
        email: 'member-d@example.com',
      },
      {
        userId: 'member_e',
        userName: 'メンバーE',
        email: 'member-e@example.com',
      },
      {
        userId: 'member_f',
        userName: 'メンバーF',
        email: 'member-f@example.com',
      },
      {
        userId: 'member_g',
        userName: 'メンバーG',
        email: 'member-g@example.com',
      },
      {
        userId: 'member_h',
        userName: 'メンバーH',
        email: 'member-h@example.com',
      },
      {
        userId: 'member_i',
        userName: 'メンバーI',
        email: 'member-i@example.com',
      },
      {
        userId: 'member_j',
        userName: 'メンバーJ',
        email: 'member-j@example.com',
      },
    ];

    // 提出状態: メンバーAのみ未提出
    const submissionStatus = {
      member_a: {
        userId: 'member_a',
        submitted: false,
        submittedAt: null,
      },
      member_b: {
        userId: 'member_b',
        submitted: true,
        submittedAt: new Date('2024-01-15T08:45:00Z'),
      },
      member_c: {
        userId: 'member_c',
        submitted: true,
        submittedAt: new Date('2024-01-15T08:50:00Z'),
      },
      member_d: {
        userId: 'member_d',
        submitted: true,
        submittedAt: new Date('2024-01-15T08:55:00Z'),
      },
      member_e: {
        userId: 'member_e',
        submitted: true,
        submittedAt: new Date('2024-01-15T08:30:00Z'),
      },
      member_f: {
        userId: 'member_f',
        submitted: true,
        submittedAt: new Date('2024-01-15T08:40:00Z'),
      },
      member_g: {
        userId: 'member_g',
        submitted: true,
        submittedAt: new Date('2024-01-15T08:35:00Z'),
      },
      member_h: {
        userId: 'member_h',
        submitted: true,
        submittedAt: new Date('2024-01-15T08:25:00Z'),
      },
      member_i: {
        userId: 'member_i',
        submitted: true,
        submittedAt: new Date('2024-01-15T08:20:00Z'),
      },
      member_j: {
        userId: 'member_j',
        submitted: true,
        submittedAt: new Date('2024-01-15T08:15:00Z'),
      },
    };

    // 現在時刻を報告期限（09:00）を過ぎた状態（09:30）に設定
    const currentTime = new Date('2024-01-15T09:30:00Z');

    // デッドラインの設定
    const deadlineTime = new Date('2024-01-15T09:00:00Z');

    // 未提出メンバー判定機能を実行
    const result = detectAndNotifyUnsubmittedMembers({
      teamId: teamId,
      teamMembers: teamMembers,
      submissionStatus: submissionStatus,
      currentTime: currentTime,
      deadlineTime: deadlineTime,
      reportDate: reportDate,
      morningMeetingStartTime: morningMeetingStartTime,
      executorUserId: executorUserId,
    });

    // 期待結果の検証
    // 未提出メンバーが1件であること
    expect(result.unsubmittedMembers.length).toBe(1);

    // メンバーAの情報が正しいこと
    expect(result.unsubmittedMembers[0]).toEqual({
      userId: 'member_a',
      userName: 'メンバーA',
      email: 'member-a@example.com',
      remainingMinutes: -30, // 期限超過時間（負数は超過）
    });

    // 通知送信回数が1であること
    expect(result.notificationsSent).toBe(1);

    // 通知失敗件数が0であること
    expect(result.notificationFailures.length).toBe(0);

    // 実行日時がISO 8601形式であること
    expect(result.executedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});