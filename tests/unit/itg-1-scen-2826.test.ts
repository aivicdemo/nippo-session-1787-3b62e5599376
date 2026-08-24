import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー優先度リスト取得', () => {
  // SCEN-2826
  test('提出状況ステータスが無効な値のメンバーが含まれるとき、エラーが発生する', () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: 'user-001',
        status: 'sent' as const,
        sentAt: new Date('2024-01-15T09:00:00Z'),
        errorMessage: null,
      }),
      scheduleNotification: jest.fn().mockResolvedValue(undefined),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'sent' as const,
        sentAt: new Date('2024-01-15T09:00:00Z'),
      }),
    };

    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '09:00',
      executorUserId: 'user-exec-001',
    };

    const memberDataWithInvalidStatus = [
      {
        userId: 'user-001',
        userName: 'Alice',
        email: 'alice@example.com',
        submissionStatus: 'submitted' as const,
      },
      {
        userId: 'user-002',
        userName: 'Bob',
        email: 'bob@example.com',
        submissionStatus: 'invalid_status' as any,
      },
      {
        userId: 'user-003',
        userName: 'Charlie',
        email: 'charlie@example.com',
        submissionStatus: null as any,
      },
    ];

    expect(() => {
      detectAndNotifyUnsubmittedMembers(
        input,
        mockNotificationServiceAdapter,
        memberDataWithInvalidStatus
      );
    }).toThrow(/Invalid submission status value/);

    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});