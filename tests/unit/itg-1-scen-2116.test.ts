import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('ensureDashboardDataFreshness', () => {
  // SCEN-2116: [normal] データ保持期間管理機能 - 削除対象データが複数件の場合、すべてが削除される
  test('should delete all reports older than retention period and their related notification logs', async () => {
    const retention_days = 90;
    const current_timestamp = new Date('2024-12-15T10:00:00Z');
    
    // 削除対象データ：現在から91〜95日前の5件
    const old_report_timestamps = [
      new Date(current_timestamp.getTime() - 91 * 24 * 60 * 60 * 1000),
      new Date(current_timestamp.getTime() - 92 * 24 * 60 * 60 * 1000),
      new Date(current_timestamp.getTime() - 93 * 24 * 60 * 60 * 1000),
      new Date(current_timestamp.getTime() - 94 * 24 * 60 * 60 * 1000),
      new Date(current_timestamp.getTime() - 95 * 24 * 60 * 60 * 1000),
    ];

    // 削除対象外データ：現在から89日前の1件（retention期間内）
    const retained_report_timestamp = new Date(current_timestamp.getTime() - 89 * 24 * 60 * 60 * 1000);

    // モック用のデータベース状態
    const mock_old_reports = old_report_timestamps.map((ts, idx) => ({
      reportId: `old-report-${idx + 1}`,
      reportDate: ts.toISOString().split('T')[0],
      submissionTimestamp: ts.toISOString(),
      reporterId: `engineer-${idx + 1}`,
      submissionStatus: 'submitted' as const,
    }));

    const mock_retained_report = {
      reportId: 'retained-report-1',
      reportDate: retained_report_timestamp.toISOString().split('T')[0],
      submissionTimestamp: retained_report_timestamp.toISOString(),
      reporterId: 'engineer-retained',
      submissionStatus: 'submitted' as const,
    };

    const mock_old_notification_logs = old_report_timestamps.flatMap((_, idx) => [
      {
        logId: `notification-log-${idx + 1}-a`,
        reportId: `old-report-${idx + 1}`,
        deliveryTimestamp: old_report_timestamps[idx].toISOString(),
        deliveryStatus: 'success',
      },
      {
        logId: `notification-log-${idx + 1}-b`,
        reportId: `old-report-${idx + 1}`,
        deliveryTimestamp: old_report_timestamps[idx].toISOString(),
        deliveryStatus: 'success',
      },
    ]);

    const mock_retained_notification_logs = [
      {
        logId: 'notification-log-retained-1',
        reportId: 'retained-report-1',
        deliveryTimestamp: retained_report_timestamp.toISOString(),
        deliveryStatus: 'success',
      },
    ];

    // テスト対象関数に渡す入力
    const input_data = {
      all_reports: [...mock_old_reports, mock_retained_report],
      all_notification_logs: [...mock_old_notification_logs, ...mock_retained_notification_logs],
      current_timestamp,
      retention_days,
    };

    const result = await ensureDashboardDataFreshness(input_data);

    // 期待される削除対象件数
    const expected_deleted_report_count = 5;
    const expected_deleted_notification_log_count = 10; // 5報告 × 2ログ
    const expected_retained_report_count = 1;
    const expected_retained_notification_log_count = 1;

    // アサーション：削除データ件数の検証
    expect(result.deleted_report_count).toBe(expected_deleted_report_count);
    expect(result.deleted_notification_log_count).toBe(expected_deleted_notification_log_count);

    // アサーション：保持データ件数の検証
    expect(result.retained_report_count).toBe(expected_retained_report_count);
    expect(result.retained_notification_log_count).toBe(expected_retained_notification_log_count);

    // アサーション：最終更新時刻が現在時刻として記録されている
    expect(result.last_execution_timestamp).toBe(current_timestamp.toISOString());

    // アサーション：削除実行ログの存在確認
    expect(result.deletion_log).toBeDefined();
    expect(result.deletion_log.cutoff_date).toBe(
      new Date(current_timestamp.getTime() - retention_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    expect(result.deletion_log.status).toBe('completed');
  });
});