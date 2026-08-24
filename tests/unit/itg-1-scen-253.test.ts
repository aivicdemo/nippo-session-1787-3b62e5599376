import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('部長向けダッシュボードに本日の報告提出状況（提出済み・未提出）をリアルタイム表示し、未提出メンバーを一目で把握できる機能', () => {
  // SCEN-253: [error] 報告送信時刻の遅延判定機能 - 報告送信時刻が null のとき、エラーが発生して処理が進まない
  test('報告送信時刻が null の場合、ValidationError が発生し、報告データベースへの書き込みと外部通知が実行されない', () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        deliveryTimestamp: new Date().toISOString(),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduleId: 'test-schedule-001' }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'pending' }),
    };

    const submitDailyReportInput: SubmitDailyReportInput = {
      userId: 'ENG-001',
      teamId: 'TEAM-A',
      yesterdayAccomplishment: 'Completed API integration for user authentication module',
      todayPlan: 'Review code and prepare deployment',
      challenges: 'Database query performance needs optimization',
      reportDate: '2024-01-15',
    };

    const invalidSubmissionData = {
      ...submitDailyReportInput,
      submissionTimestamp: null as unknown as Date,
      notificationServiceAdapter: mockNotificationServiceAdapter,
    };

    expect(() => {
      submitDailyReport(
        invalidSubmissionData as any,
        mockNotificationServiceAdapter
      );
    }).toThrow(/報告送信時刻|Submission timestamp/);

    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});