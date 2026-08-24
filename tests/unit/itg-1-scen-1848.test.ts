import { runTx7Imp1Agent } from "../../src/agents/tx-7-imp-1/orchestrator";

describe("月次課題傾向分析レポート生成 - 入力検証", () => {
  // SCEN-1848
  test("プロジェクトマネージャーID が null のときエラーになる", async () => {
    const triggerTimestamp = new Date("2024-01-01T09:00:00Z");
    const targetMonth = "2024-01";
    const managerUserId = null as unknown as string;
    const includeDetailedAnalysis = true;

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const result = await runTx7Imp1Agent(
      {
        triggerTimestamp,
        targetMonth,
        managerUserId,
        includeDetailedAnalysis,
      },
      mockTextAnalysisServiceAdapter,
      mockNotificationServiceAdapter
    );

    expect(result).toHaveProperty("executionStatus");
    expect(result.executionStatus).toBe("failure");
    expect(result).toHaveProperty("analysisResultSummary");
    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
  });
});