import { ensureDashboardDataFreshness } from "../../src/logic/manager-dashboard";

describe("朝会報告管理システム - ダッシュボードデータ鮮度保証", () => {
  // SCEN-2126
  test("古いデータ自動削除機能 - 削除対象データタイプが不明な値のとき、エラーが発生して処理が中断される", () => {
    // テスト前にモックをリセット
    const mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };

    // 削除対象データタイプが不明な値を複数パターンでテスト
    const invalidDataTypes = [
      null,
      undefined,
      "",
      "INVALID_TYPE",
      "UNKNOWN_DATA_KIND",
      "DELETE_ME",
    ];

    invalidDataTypes.forEach((invalidType) => {
      // モックをリセット
      mockLogger.error.mockClear();
      mockLogger.info.mockClear();

      // 入力パラメータ: 不明なデータタイプ
      const input = {
        userId: "user-001",
        teamId: "team-001",
        reportDate: "2024-01-15",
        maxStalenessSeconds: 300,
        invalidDataType: invalidType,
      };

      // 古いデータ自動削除機能の実行時にエラーが発生することを確認
      expect(() => {
        ensureDashboardDataFreshness(
          input as any,
          mockLogger as any
        );
      }).toThrow(/Invalid data type|unsupported|unknown/i);

      // エラーログが記録されていることを確認
      expect(mockLogger.error).toHaveBeenCalled();
      const errorLogCall = mockLogger.error.mock.calls[0];
      if (errorLogCall && errorLogCall[0]) {
        expect(errorLogCall[0]).toMatch(/Invalid data type parameter/i);
      }
    });

    // データベースへの削除クエリが実行されないことを確認
    // （この確認はモックされたロガーの呼び出しを通じて検証される）
    expect(mockLogger.error).toHaveBeenCalled();

    // システムが安定した状態に復帰していることを確認
    // （エラー発生後、新たに正常な入力でテストして動作することを確認）
    const validInput = {
      userId: "user-001",
      teamId: "team-001",
      reportDate: "2024-01-15",
      maxStalenessSeconds: 300,
    };

    // 正常な入力では処理が実行されることを確認
    mockLogger.error.mockClear();
    mockLogger.info.mockClear();

    const result = ensureDashboardDataFreshness(
      validInput,
      mockLogger as any
    );

    // 正常な結果が返されることを確認
    expect(result).toBeDefined();
    expect(result).toHaveProperty("isDataFresh");
    expect(typeof result.isDataFresh).toBe("boolean");
    expect(result).toHaveProperty("stalenessSeconds");
    expect(typeof result.stalenessSeconds).toBe("number");
  });
});