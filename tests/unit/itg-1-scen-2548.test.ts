import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信し、報告期限までの時間を表示する機能', () => {
  // SCEN-2548: [normal] リマインド通知自動送信機能 - 報告期限までの残り時間がリマインド通知に正確に計算されて表示される
  test('報告期限までの残り時間が正確に計算されてリマインド通知に表示される', () => {
    const baseDate = new Date('2024-01-15T00:00:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');

    const stub_sendReminderNotification = jest.fn(async () => ({
      sentAt: new Date('2024-01-15T08:30:00Z'),
      status: 'sent' as const,
    }));

    const notificationServiceAdapterStub = {
      sendReminderNotification: stub_sendReminderNotification,
      scheduleNotification: jest.fn(async () => undefined),
      getDeliveryStatus: jest.fn(async () => ({ status: 'sent' as const })),
    };

    const scheduledTime_08_30 = new Date('2024-01-15T08:30:00Z');
    const input_08_30: SendDailyReportReminderInput = {
      scheduledTime: scheduledTime_08_30,
      teamIds: ['team-001'],
      reportDeadlineTime: reportDeadlineTime,
      notificationChannels: ['email'],
    };

    expect(stub_sendReminderNotification).not.toHaveBeenCalled();

    sendDailyReportReminder(
      input_08_30,
      notificationServiceAdapterStub,
    );

    expect(stub_sendReminderNotification).toHaveBeenCalled();
    const firstCall = stub_sendReminderNotification.mock.calls[0];
    expect(firstCall).toBeDefined();
    const firstPayload = firstCall[0];
    expect(firstPayload.remainingMinutes).toBe(30);

    stub_sendReminderNotification.mockClear();

    const scheduledTime_08_45 = new Date('2024-01-15T08:45:00Z');
    const input_08_45: SendDailyReportReminderInput = {
      scheduledTime: scheduledTime_08_45,
      teamIds: ['team-001'],
      reportDeadlineTime: reportDeadlineTime,
      notificationChannels: ['email'],
    };

    sendDailyReportReminder(
      input_08_45,
      notificationServiceAdapterStub,
    );

    expect(stub_sendReminderNotification).toHaveBeenCalled();
    const secondCall = stub_sendReminderNotification.mock.calls[0];
    expect(secondCall).toBeDefined();
    const secondPayload = secondCall[0];
    expect(secondPayload.remainingMinutes).toBe(15);

    stub_sendReminderNotification.mockClear();

    const scheduledTime_09_00 = new Date('2024-01-15T09:00:00Z');
    const input_09_00: SendDailyReportReminderInput = {
      scheduledTime: scheduledTime_09_00,
      teamIds: ['team-001'],
      reportDeadlineTime: reportDeadlineTime,
      notificationChannels: ['email'],
    };

    sendDailyReportReminder(
      input_09_00,
      notificationServiceAdapterStub,
    );

    expect(stub_sendReminderNotification).toHaveBeenCalled();
    const thirdCall = stub_sendReminderNotification.mock.calls[0];
    expect(thirdCall).toBeDefined();
    const thirdPayload = thirdCall[0];
    expect(thirdPayload.remainingMinutes).toBe(0);
  });
});