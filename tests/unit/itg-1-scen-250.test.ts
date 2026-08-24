import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('部長向けダッシュボード - 本日の報告提出状況リアルタイム表示', () => {
  test('SCEN-250: 報告送信時刻が期限と同一時刻の場合、遅延フラグが false で記録される', async () => {
    // 報告期限を当日09:00:00に設定
    const reportDeadline = new Date('2024-01-15T09:00:00Z');
    
    // 報告送信時刻を期限と同一の09:00:00に設定
    const submissionTimestamp = new Date('2024-01-15T09:00:00Z');
    
    // テスト用報告データ
    const reportInput: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-a',
      yesterdayAccomplishment: '前日のタスクを完了しました。',
      todayPlan: '本日のタスク計画を立案します。',
      challenges: '現在の課題について記述します。',
      reportDate: '2024-01-15'
    };

    // モックされたNotificationServiceAdapter
    const notificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: 'sent' }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: true })
    };

    // submitDailyReportを呼び出し（実装側で期限比較を行う想定）
    const response: SubmitDailyReportOutput = await submitDailyReport(
      reportInput,
      notificationServiceAdapter,
      submissionTimestamp,
      reportDeadline
    );

    // APIレスポンスのisDelayedフラグが false であることを確認
    expect(response.isWithinDeadline).toBe(true);
    expect(response.reportId).toBeDefined();
    expect(typeof response.reportId).toBe('string');
    expect(response.submissionTimestamp).toBe(submissionTimestamp.toISOString());
  });
});