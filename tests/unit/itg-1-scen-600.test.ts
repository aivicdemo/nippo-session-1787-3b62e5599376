import { calculateProductivityMetrics, type ProductivityMetricsInput } from "../../src/logic/productivity-metrics-calculation";

describe("朝会報告管理システム - 生産性指標計算", () => {
  // SCEN-600: 目標提出率が0未満のときに0.9に自動調整される
  test("目標提出率が負の値のときに0.9にクランプして警告を出力し、正常に計算完了する", () => {
    // Arrange
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

    const input: ProductivityMetricsInput = {
      aggregationStartDate: new Date("2024-01-01"),
      aggregationEndDate: new Date("2024-01-31"),
      targetTeamIds: ["team-001"],
      targetAchievementRate: -0.5, // 境界条件: 0未満の無効値
    };

    // Act
    const result = calculateProductivityMetrics(input);

    // Assert
    // 警告メッセージが出力されたことを確認
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/目標提出率は0～1の範囲で指定してください。0\.9（90%）に自動調整します/)
    );

    // 計算結果が正常に完了していることを確認
    expect(result).toHaveProperty("reportSubmissionRate");
    expect(typeof result.reportSubmissionRate).toBe("number");
    expect(result.reportSubmissionRate).toBeGreaterThanOrEqual(0);
    expect(result.reportSubmissionRate).toBeLessThanOrEqual(100);

    // 生産性スコアが0～100の範囲内であることを確認
    expect(result.teamProductivityScore).toBeGreaterThanOrEqual(0);
    expect(result.teamProductivityScore).toBeLessThanOrEqual(100);

    // 必須フィールドがすべて存在することを確認
    expect(result).toHaveProperty("issueResolutionSpeed");
    expect(result).toHaveProperty("reportSubmissionRate");
    expect(result).toHaveProperty("issueRecurrenceRate");
    expect(result).toHaveProperty("teamProductivityScore");

    // クリーンアップ
    consoleWarnSpy.mockRestore();
  });
});