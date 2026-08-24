import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { ReportSubmissionInput, ReportSubmissionRecord } from '../../src/logic/daily-report-management';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信', () => {
  // SCEN-072
  test('日報送信期限判定機能 - ユーザーIDが空文字のとき処理が進まずエラーを返す', () => {
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const invalidInput: ReportSubmissionInput = {
      reportId: 'report-001',
      userId: '',
      submissionTimestamp: new Date('2024-01-15T09:00:00Z'),
      reportContent: {
        yesterdayAccomplishment: 'Completed feature A',
        todayPlan: 'Start feature B',
        challenges: 'Integration issue',
      },
    };

    expect(() => {
      submitDailyReport(invalidInput, mockNotificationAdapter);
    }).toThrow(/INVALID_USER_ID/);

    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(mockNotificationAdapter.scheduleNotification).not.toHaveBeenCalled();
    expect(mockNotificationAdapter.getDeliveryStatus).not.toHaveBeenCalled();
  });
});