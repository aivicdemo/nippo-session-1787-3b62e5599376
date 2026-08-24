import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';
import type {
  DashboardDataFreshnessInput,
  DashboardDataFreshnessOutput,
} from '../../src/logic/manager-dashboard';

describe('朝会報告管理システム - ダッシュボードデータ鮮度管理', () => {
  // SCEN-2137
  test('保持期間超過データが自動削除され、保持期間内データが全件残存すること', async () => {
    // Setup: テスト環境のメモリDBを初期化
    const retentionDays = 90;
    const currentDate = new Date('2024-12-15T09:00:00Z');
    const maxStorageRecords = 10950;
    const expiredRecordCount = 1000;
    const withinRetentionRecordCount = 9950;
    const totalExpectedAfterDeletion = withinRetentionRecordCount;

    // 保持期間を超過したデータ（91日以上前）を作成
    const expiredRecords = Array.from({ length: expiredRecordCount }, (_, idx) => ({
      reportId: `expired-report-${idx}`,
      reporterId: `user-${idx % 10}`,
      submissionStatus: 'submitted' as const,
      submissionTimestamp: new Date(
        currentDate.getTime() - (retentionDays + 1) * 24 * 60 * 60 * 1000
      ).toISOString(),
    }));

    // 保持期間内のデータ（90日以内）を作成
    const withinRetentionRecords = Array.from(
      { length: withinRetentionRecordCount },
      (_, idx) => ({
        reportId: `active-report-${idx}`,
        reporterId: `user-${idx % 10}`,
        submissionStatus: 'submitted' as const,
        submissionTimestamp: new Date(
          currentDate.getTime() - Math.floor(Math.random() * retentionDays) * 24 * 60 * 60 * 1000
        ).toISOString(),
      })
    );

    const allRecords = [...expiredRecords, ...withinRetentionRecords];

    // Mock NotificationServiceAdapter - 呼び出されないことを検証
    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    // 削除前のストレージ使用量を計算（記録用）
    const avgRecordSizeBytes = 250;
    const storageBytesBeforeDeletion = allRecords.length * avgRecordSizeBytes;

    // ensureDashboardDataFreshness を呼び出し
    const input: DashboardDataFreshnessInput = {
      userId: 'manager-001',
      teamId: 'team-001',
      reportDate: '2024-12-15',
      maxStalenessSeconds: 300,
    };

    const output: DashboardDataFreshnessOutput = await ensureDashboardDataFreshness(
      input,
      {
        retentionDays,
        currentDate,
        notificationServiceAdapter: notificationServiceAdapterStub,
        databaseQueryFn: async (query: string) => {
          // 削除前: 全レコード数をカウント
          if (query.includes('COUNT(*)') && !query.includes('WHERE')) {
            return { count: allRecords.length };
          }
          // 保持期間内のデータをクエリ（91日以内）
          if (query.includes('WHERE') && query.includes(`>= '${currentDate}' - INTERVAL '${retentionDays} days'`)) {
            return { count: withinRetentionRecordCount };
          }
          // 保持期間超過のデータをクエリ（91日以上前）
          if (query.includes('WHERE') && query.includes(`< '${currentDate}' - INTERVAL '${retentionDays} days'`)) {
            return { count: 0 }; // 削除後は0件
          }
          return { count: 0 };
        },
        deleteExpiredRecordsFn: async (beforeDate: Date) => {
          // 実際の削除をシミュレート：91日以上前のレコード1000件を削除
          const deletedCount = expiredRecordCount;
          return {
            deletedCount,
            deletionLog: `${deletedCount} records deleted successfully`,
            storageBytesFreed: deletedCount * avgRecordSizeBytes,
          };
        },
      }
    );

    // 検証 1: deletedCount が 1000 であることを確認
    expect(output.deletedCount).toBe(expiredRecordCount);

    // 検証 2: 削除ログが正しいメッセージを含むこと
    expect(output.deletionLog).toMatch(/1000 records deleted successfully/);

    // 検証 3: ストレージ解放サイズが正しく計算されていること
    const expectedStorageFreedBytes = expiredRecordCount * avgRecordSizeBytes;
    expect(output.storageBytesFreed).toBe(expectedStorageFreedBytes);

    // 検証 4: 削除後の残存レコード件数が 9950 であること
    expect(output.remainingRecordCount).toBe(totalExpectedAfterDeletion);

    // 検証 5: NotificationServiceAdapter が呼び出されていないこと（削除は自動実行）
    expect(notificationServiceAdapterStub.sendReminderNotification).not.toHaveBeenCalled();
    expect(notificationServiceAdapterStub.scheduleNotification).not.toHaveBeenCalled();

    // 検証 6: isDataFresh フラグが正しく設定されていること
    expect(output.isDataFresh).toBe(true);

    // 検証 7: 最終更新時刻が記録されていること（ISO 8601 形式）
    expect(output.lastUpdateTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // 検証 8: 表示時刻が記録されていること
    expect(output.displayTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // 検証 9: データ遅延時間が 0 または許容範囲内であること
    expect(output.stalenessSeconds).toBeLessThanOrEqual(300);
  });
});