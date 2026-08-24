import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信し、報告期限までの時間を表示する機能', () => {
  // SCEN-086: [edge] 日報送信期限判定機能 - 月初日の朝会開始時刻1秒前に送信された日報が期限内と判定される
  test('月初日の朝会開始時刻1秒前に送信された日報は期限内と判定される', () => {
    const morningMeetingStartTime = new Date('2025-02-01T09:00:00Z');
    const submissionTimestamp = new Date('2025-02-01T08:59:59Z');

    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed API documentation and fixed 3 bugs in the authentication module.',
      todayPlan: 'Implement user profile endpoint and write unit tests for it.',
      challenges: 'Database query performance needs optimization for the report aggregation feature.',
      reportDate: '2025-02-01',
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        notificationId: 'notif-001',
        status: 'delivered',
        deliveredAt: new Date('2025-02-01T08:59:59Z').toISOString(),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'sched-001',
        scheduledFor: morningMeetingStartTime.toISOString(),
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        notificationId: 'notif-001',
        status: 'delivered',
      }),
    };

    const output: SubmitDailyReportOutput = submitDailyReport(
      input,
      submissionTimestamp,
      morningMeetingStartTime,
      mockNotificationServiceAdapter,
    );

    expect(output.isWithinDeadline).toBe(true);
    expect(output.reportId).toBeDefined();
    expect(output.submissionTimestamp).toBe(submissionTimestamp.toISOString());
  });
});