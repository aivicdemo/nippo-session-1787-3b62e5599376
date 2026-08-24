import { runTx8Imp1Agent } from "../../src/agents/tx-8-imp-1/orchestrator";
import { type Tx8Imp1AiClient } from "../../src/agents/tx-8-imp-1/orchestrator";

describe("課題の再発パターン分析機能", () => {
  test("SCEN-1920: 類似度判定の閾値が100を超えるときエラーになる", async () => {
    const analysisStartDate = "2024-01-01";
    const analysisEndDate = "2024-01-31";
    const teamIds = ["team-001", "team-002"];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = "manager-001";
    const similarityThreshold = 101;

    const stubAiClient: Tx8Imp1AiClient = {
      extractRecurringPatterns: async () => {
        return [];
      },
      classifyIssuesByPriority: async () => {
        return [];
      },
      generateVisualizationGraphs: async () => {
        return [];
      },
      sendReportEmail: async () => {
        return { sentAt: new Date().toISOString() };
      },
    };

    const input = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId,
      similarityThreshold,
    };

    await expect(() =>
      runTx8Imp1Agent(input, stubAiClient)
    ).rejects.toThrow(/類似度|閾値|0|100|範囲/);
  });
});