import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import { type DetectUnsubmittedMembersInput, type DetectUnsubmittedMembersOutput } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー催促通知機能', () => {
  // SCEN-2861
  test('朝会開始予定時刻が報告期限時刻より後の場合、ValidationErrorをスローする', () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        sentAt: new Date('2024-01-15T08:30:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue(true),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'pending' }),
    };

    const input: DetectUnsubmittedMembersInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      morningMeetingStartTime: '08:00',
      executorUserId: 'user-manager-001',
    };

    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const morningMeetingStartTime = new Date('2024-01-15T08:00:00Z');

    expect(() =>
      detectAndNotifyUnsubmittedMembers(
        input,
        mockNotificationServiceAdapter,
        reportDeadlineTime,
        morningMeetingStartTime,
      ),
    ).toThrow(/朝会開始時刻|期限時刻|矛盾/);

    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});