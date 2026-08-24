import { runTx8Imp1Agent } from "../../src/agents/tx-8-imp-1/orchestrator";

describe("ボトルネック変化パターン可視化レポート生成機能", () => {
  // SCEN-1989
  test("課題の影響度スコアが欠落しているとき、レポート生成がエラーになる", async () => {
    // Arrange: モックAIクライアントとスタブサービスアダプタを構成
    const mockAiClient = {
      analyzeRecurringPatterns: jest.fn(),
      generateVisualizationGraphs: jest.fn(),
    };

    const stubTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: "デプロイ失敗", frequency: 3 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(null), // 影響度スコアがnullで返す
      classifyIssueSeverity: jest.fn().mockResolvedValue("high"),
    };

    const mockAuditLogger = {
      log: jest.fn(),
    };

    // 影響度スコアが欠落した課題データセット
    const issueDatasetWithMissingImpactScore = [
      {
        issueId: "ISS-001",
        keyword: "デプロイ失敗",
        occurrenceCount: 3,
        impactScore: null, // 影響度スコアが欠落
        affectedDate: "2024-01-15",
      },
      {
        issueId: "ISS-002",
        keyword: "ネットワーク遅延",
        occurrenceCount: 2,
        impactScore: null, // 影響度スコアが欠落
        affectedDate: "2024-01-16",
      },
    ];

    const input = {
      analysisStartDate: "2024-01-01T00:00:00Z",
      analysisEndDate: "2024-01-31T23:59:59Z",
      teamIds: ["TEAM-001"],
      minimumRecurrenceThreshold: 3,
      recipientManagerId: "MGR-001",
    };

    // Act & Assert: エラーがthrowされることを検証
    try {
      await runTx8Imp1Agent(input, mockAiClient, stubTextAnalysisAdapter, mockAuditLogger);
      fail("エラーがthrowされるべきですが、正常に完了しました");
    } catch (error) {
      // エラーオブジェクトの構造を検証
      expect(error).toHaveProperty("name", "ImpactScoreMissingError");
      expect(error).toHaveProperty(
        "message",
        expect.stringContaining("課題の影響度スコアが欠落しています")
      );
      expect(error).toHaveProperty(
        "message",
        expect.stringContaining("レポート生成処理は中断されました")
      );
      expect(error).toHaveProperty(
        "message",
        expect.stringContaining("影響度スコアが0-100の数値である課題データのみを入力してください")
      );
      expect(error).toHaveProperty("code", "ERR_IMPACT_SCORE_MISSING_IN_BOTTLENECK_REPORT");
      expect(error).toHaveProperty("affectedIssueIds");
      expect(Array.isArray(error.affectedIssueIds)).toBe(true);
      expect(error.affectedIssueIds).toContain("ISS-001");
      expect(error.affectedIssueIds).toContain("ISS-002");
    }

    // 監査ログが記録されたことを検証
    expect(mockAuditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "report_generation_failed",
        contractId: "tx_8_imp_1",
        reason: "missing_impact_score",
        affectedIssueCount: 2,
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
        userId: "MGR-001",
      })
    );

    // 不完全なレポートファイルが生成されないことを検証
    expect(mockAiClient.generateVisualizationGraphs).not.toHaveBeenCalled();
  });
});