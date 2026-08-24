import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('日報送信期限判定機能 - エラーハンドリング', () => {
  test('SCEN-070: 朝会開始時刻が不正な日付形式のときエラーを返す', () => {
    // モックの NotificationServiceAdapter を定義
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    // 不正な日付形式のパターンを複数テスト
    const invalidDateFormats = [
      '2026-13-45',
      '2026/02/30',
      'invalid-date',
      'null',
      '2026-02-31',
      '',
      'not-a-date',
    ];

    // 各不正な日付形式に対してテストを実行
    invalidDateFormats.forEach((invalidDate) => {
      const inputData: SubmitDailyReportInput = {
        userId: 'user-001',
        teamId: 'team-001',
        yesterdayAccomplishment: 'テスト実施',
        todayPlan: 'テスト検証',
        challenges: 'テスト課題',
        reportDate: '2026-01-15',
      };

      // 朝会開始時刻として不正な日付を渡す
      const morningMeetingStartTime = invalidDate;

      // 不正な日付形式での処理実行を期待してエラーを取得
      let thrownError: Error | null = null;
      try {
        submitDailyReport(inputData, mockNotificationServiceAdapter);
      } catch (error) {
        thrownError = error as Error;
      }

      // エラーが発生したことを検証
      expect(() => {
        throw thrownError;
      }).toThrow(/日付形式|朝会開始時刻|形式/);

      // NotificationServiceAdapter の sendReminderNotification が呼ばれないことを確認
      expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();

      // NotificationServiceAdapter の scheduleNotification が呼ばれないことを確認
      expect(mockNotificationServiceAdapter.scheduleNotification).not.toHaveBeenCalled();
    });

    // モックのリセット
    mockNotificationServiceAdapter.sendReminderNotification.mockClear();
    mockNotificationServiceAdapter.scheduleNotification.mockClear();

    // null を朝会開始時刻として渡すケースをテスト
    const inputDataWithNullTime: SubmitDailyReportInput = {
      userId: 'user-002',
      teamId: 'team-002',
      yesterdayAccomplishment: '業務実施',
      todayPlan: '計画実行',
      challenges: '課題報告',
      reportDate: '2026-01-16',
    };

    expect(() => {
      submitDailyReport(inputDataWithNullTime, mockNotificationServiceAdapter, null as any);
    }).toThrow(/日付形式|必須|朝会開始時刻/);

    // null パターンでも外部通知が送信されないことを確認
    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(mockNotificationServiceAdapter.scheduleNotification).not.toHaveBeenCalled();
  });
});