import { ensureDashboardDataFreshness } from "../../src/logic/manager-dashboard";

describe("ダッシュボード データ保持期間管理・自動削除機能", () => {
  // SCEN-2131
  test("保持期間満了日時直前（1秒未満）のデータが削除対象外として判定される", async () => {
    // 設定値
    const retentionDaysConfig = 90;
    const baseTimeUtc = new Date("2026-01-01T00:00:00.000Z");
    const expirationBoundaryUtc = new Date("2026-03-31T23:59:59.999Z");

    // テストレコード定義
    // retentionDays 90日の場合、保持期間満了日時は baseTime + 90日 = 2026-03-31T23:59:59.999Z
    const recordACreatedAt = new Date("2025-11-02T23:59:59.999Z"); // 満了日時の1秒未満前
    const recordBCreatedAt = new Date("2025-11-02T23:59:59.998Z"); // 満了日時の2秒未満前
    const recordCCreatedAt = new Date("2025-11-02T23:59:58.000Z"); // 満了日時の1秒を超える前

    const testRecords = [
      {
        recordId: "RECORD-A",
        createdAt: recordACreatedAt,
        content: "Test data A - within 1 second margin",
      },
      {
        recordId: "RECORD-B",
        createdAt: recordBCreatedAt,
        content: "Test data B - within 2 seconds margin",
      },
      {
        recordId: "RECORD-C",
        createdAt: recordCCreatedAt,
        content: "Test data C - exceeds retention period",
      },
    ];

    const mockDatabase = {
      records: [...testRecords],
      deletionLogs: [] as Array<{
        recordId: string;
        action: string;
        reason: string;
        timestamp: string;
      }>,
    };

    const mockDatabaseAdapter = {
      queryRecordsByDateRange: async (startDate: Date, endDate: Date) => {
        return mockDatabase.records.filter(
          (record) =>
            record.createdAt >= startDate && record.createdAt <= endDate
        );
      },
      deleteRecordById: async (recordId: string) => {
        const index = mockDatabase.records.findIndex(
          (r) => r.recordId === recordId
        );
        if (index !== -1) {
          mockDatabase.records.splice(index, 1);
        }
      },
      logDeletion: async (
        recordId: string,
        action: string,
        reason: string
      ) => {
        mockDatabase.deletionLogs.push({
          recordId,
          action,
          reason,
          timestamp: new Date().toISOString(),
        });
      },
    };

    // 実行対象関数のパラメータ
    const input = {
      userId: "manager-001",
      teamId: "team-A",
      reportDate: "2026-01-01",
      retentionDaysConfig,
      baseTimeUtc,
      expirationBoundaryUtc,
      databaseAdapter: mockDatabaseAdapter,
    };

    // 関数実行
    const result = await ensureDashboardDataFreshness(input);

    // 期待結果の検証
    // 1. レコードA、Bが削除対象外として判定され、データベースに存在することを確認
    const remainingRecordIds = mockDatabase.records.map((r) => r.recordId);
    expect(remainingRecordIds).toContain("RECORD-A");
    expect(remainingRecordIds).toContain("RECORD-B");

    // 2. レコードCは削除対象となり、データベースから削除されていることを確認
    expect(remainingRecordIds).not.toContain("RECORD-C");

    // 3. 自動削除ジョブのログが正しく記録されていることを確認
    const deletionLogForC = mockDatabase.deletionLogs.find(
      (log) => log.recordId === "RECORD-C"
    );
    expect(deletionLogForC).toBeDefined();
    expect(deletionLogForC?.action).toBe("削除実行");

    // 4. レコードA、Bについて削除対象外の判定理由がログに記録されていることを確認
    const deletionLogForA = mockDatabase.deletionLogs.find(
      (log) => log.recordId === "RECORD-A"
    );
    const deletionLogForB = mockDatabase.deletionLogs.find(
      (log) => log.recordId === "RECORD-B"
    );
    expect(deletionLogForA).toBeDefined();
    expect(deletionLogForA?.action).toBe("削除対象外");
    expect(deletionLogForA?.reason).toMatch(/保持期間/);

    expect(deletionLogForB).toBeDefined();
    expect(deletionLogForB?.action).toBe("削除対象外");
    expect(deletionLogForB?.reason).toMatch(/保持期間/);

    // 5. 関数戻り値の検証
    expect(result.isDataFresh).toBe(true);
    expect(result.lastUpdateTimestamp).toBe(baseTimeUtc.toISOString());
    expect(result.displayTimestamp).toBeDefined();
    expect(result.stalenessSeconds).toBeGreaterThanOrEqual(0);
    expect(result.deletedRecordCount).toBe(1); // レコードCのみ削除
    expect(result.retainedRecordCount).toBe(2); // レコードA、B保持
  });
});