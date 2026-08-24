import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('定時リマインド送信機能', () => {
  // SCEN-366
  test('チームメンバーが0名の場合、リマインド通知は送信されない', async () => {
    const scheduledTime = new Date('2024-01-15T09:00:00Z');
    const reportDeadlineTime = new Date('2024-01-15T10:00:00Z');
    
    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        sentAt: scheduledTime,
        status: 'sent' as const,
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'pending' }),
    };
    
    const systemLogStub: string[] = [];
    const originalConsoleLog = console.log;
    console.log = jest.fn((message: string) => {
      systemLogStub.push(message);
    });

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['team-001'],
      reportDeadlineTime,
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      notificationServiceAdapterStub,
      { teamMembers: new Map(), notificationLog: [] }
    );

    expect(notificationServiceAdapterStub.sendReminderNotification).not.toHaveBeenCalled();
    expect(result.sentCount).toBe(0);
    expect(result.failedCount).toBe(0);
    expect(result.notificationDetails).toEqual([]);
    expect(systemLogStub.some((log) => /チームメンバー数.*0.*リマインド送信をスキップ/u.test(log))).toBe(true);

    console.log = originalConsoleLog;
  });
});