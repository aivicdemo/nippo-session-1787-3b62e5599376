import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー優先度リスト取得 - エラーハンドリング', () => {
  test('SCEN-2816: チームメンバー一覧が空のとき、エラーが発生する', () => {
    // 前提: チームメンバー一覧が空の状態
    const teamMembers: any[] = [];
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const morningMeetingStartTime = '09:00';
    const executorUserId = 'user-001';

    // NotificationServiceAdapter をスタブに置き換え
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        sentAt: new Date('2024-01-15T09:00:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue(true),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: 0, failed: 0 }),
    };

    // 実行: チームメンバー一覧が空の状態で関数を実行
    expect(() => {
      detectAndNotifyUnsubmittedMembers(
        {
          teamId,
          reportDate,
          morningMeetingStartTime,
          executorUserId,
          teamMembers,
        },
        mockNotificationServiceAdapter
      );
    }).toThrow(/チームメンバー一覧/);
  });
});