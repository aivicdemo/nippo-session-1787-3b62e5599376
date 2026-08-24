import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import { type DetectUnsubmittedMembersInput, type DetectUnsubmittedMembersOutput } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー催促通知機能', () => {
  // SCEN-2866
  test('通知方法が空文字列のとき、催促方法の決定に失敗する', async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input: DetectUnsubmittedMembersInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'admin-001',
    };

    // 通知方法を空文字列として無効に設定するテストケース
    // (通常は notificationChannels パラメータとして渡される想定)
    const invalidNotificationChannels: string[] = [''];

    expect(() => {
      detectAndNotifyUnsubmittedMembers(
        input,
        mockNotificationServiceAdapter,
        invalidNotificationChannels as any
      );
    }).toThrow(/通知方法/);

    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});