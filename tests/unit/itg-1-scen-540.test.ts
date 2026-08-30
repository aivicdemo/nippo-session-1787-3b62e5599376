import { calculateProductivityMetrics } from "../../src/logic/productivity-metrics-calculation";

describe("朝会報告管理システム", () => {
  test("SCEN-540: 課題キーワード辞書が空のときにデフォルト分類で処理して生産性指標を計算する", () => {
    // Arrange
    const aggregationStartDate = new Date("2024-01-01T00:00:00Z");
    const aggregationEndDate = new Date("2024-01-31T23:59:59Z");
    const targetTeamIds = ["team-001"];
    const excludeOutliers = false;
    const issueKeywords: string[] = [];

    const dailyReportsData = [
      {
        memberId: "M001",
        submittedAt: new Date("2024-01-01T09:00:00Z"),
        issues: ["サーバーダウン"],
        status: "open" as const,
      },
      {
        memberId: "M002",
        submittedAt: new Date("2024-01-02T09:00:00Z"),
        issues: ["レスポンス遅延"],
        status: "open" as const,
      },
      {
        memberId: "M001",
        submittedAt: new Date("2024-01-03T09:00:00Z"),
        issues: ["サーバーダウン"],
        status: "resolved" as const,
      },
      {
        memberId: "M003",
        submittedAt: new Date("2024-01-05T09:00:00Z"),
        issues: ["デプロイ失敗"],
        status: "open" as const,
      },
      {
        memberId: "M002",
        submittedAt: new Date("2024-01-08T09:00:00Z"),
        issues: ["レスポンス遅延"],
        status: "resolved" as const,
      },
    ];

    const warnSpy = jest.spyOn(console, "warn").mockImplementation();

    // Act
    const result = calculateProductivityMetrics(
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      excludeOutliers,
      issueKeywords,
      dailyReportsData
    );

    // Assert
    expect(result).toBeDefined();
    expect(result.issueResolutionSpeed).toBe(55.0);
    expect(result.reportSubmissionRate).toBe(85.0);
    expect(result.issueRecurrenceRate).toBe(20.0);
    expect(result.teamProductivityScore).toBe(72.5);
    expect(result.detectedAnomalies).toEqual([]);
    expect(result.dataQualityAssessment).toEqual({
      completenessPercentage: 95,
      extractionAccuracy: 88,
      isReportable: true,
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/課題分類用のキーワードが設定されていません/)
    );

    warnSpy.mockRestore();
  });
});