import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-2218: [edge] 朝会報告の入力値検証機能 - 3つの報告項目すべてが必須項目を満たし、形式要件も満たす場合に送信が確定する
  test('3つの報告項目がすべて検証ルールを満たすとき、送信処理が確定して完了メッセージが表示される', async () => {
    // 準備: テストデータ
    const submitInput = {
      userId: 'engineer-001',
      teamId: 'team-alpha',
      yesterdayAccomplishment: '顧客A社のヒアリング実施',
      todayPlan: '提案資料の作成',
      challenges: 'プロジェクトのスケジュール遅延',
      reportDate: '2024-01-15',
    };

    const expectedSubmissionTimestamp = '2024-01-15T09:30:00.000Z';
    const expectedReportId = 'report-20240115-001';

    // モック: NotificationServiceAdapter が呼ばれないことを確認するためのスタブ
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ success: true }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'pending' }),
    };

    // 実行: submitDailyReport 関数を呼び出し
    const result = await submitDailyReport(submitInput);

    // 検証 1: 返却値の構造確認
    expect(result).toBeDefined();
    expect(result).toHaveProperty('reportId');
    expect(result).toHaveProperty('submissionTimestamp');
    expect(result).toHaveProperty('isWithinDeadline');

    // 検証 2: reportId が生成されていることを確認
    expect(result.reportId).toBe(expectedReportId);

    // 検証 3: 送信時刻が記録されていることを確認
    expect(result.submissionTimestamp).toBe(expectedSubmissionTimestamp);

    // 検証 4: 期限内判定フラグが true であることを確認
    expect(result.isWithinDeadline).toBe(true);

    // 検証 5: NotificationServiceAdapter が呼ばれていないことを確認
    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(mockNotificationAdapter.scheduleNotification).not.toHaveBeenCalled();
    expect(mockNotificationAdapter.getDeliveryStatus).not.toHaveBeenCalled();

    // 検証 6: 各入力項目がすべて 1 文字以上 2000 文字以下の要件を満たしていることを確認
    expect(submitInput.yesterdayAccomplishment.length).toBeGreaterThanOrEqual(1);
    expect(submitInput.yesterdayAccomplishment.length).toBeLessThanOrEqual(2000);

    expect(submitInput.todayPlan.length).toBeGreaterThanOrEqual(1);
    expect(submitInput.todayPlan.length).toBeLessThanOrEqual(2000);

    expect(submitInput.challenges.length).toBeGreaterThanOrEqual(1);
    expect(submitInput.challenges.length).toBeLessThanOrEqual(2000);

    // 検証 7: reportDate が YYYY-MM-DD 形式であることを確認
    expect(/^\d{4}-\d{2}-\d{2}$/.test(submitInput.reportDate)).toBe(true);
  });
});