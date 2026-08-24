import { runTx8Imp1Agent } from "../../src/agents/tx-8-imp-1/orchestrator";
import type {
  Tx8AgentInput,
  Tx8AgentOutput,
  RecurringIssuePattern,
  VisualizationGraph,
} from "../../src/agents/tx-8-imp-1/types";
import type { Tx8Imp1AiClient } from "../../src/agents/tx-8-imp-1/ai-client";

describe("課題の再発パターン分析機能", () => {
  // SCEN-1922
  test("時系列パターン計算時に課題の発生日時が未指定のときエラーになる", async () => {
    const analysisStartDate = "2024-11-15T00:00:00Z";
    const analysisEndDate = "2024-12-15T00:00:00Z";
    const recipientManagerId = "mgr-001";

    const stubAiClient: Tx8Imp1AiClient = {
      analyzeRecurrencePattern: jest.fn(async (input) => {
        const issue = {
          issueId: "ISSUE-001",
          issueName: "ログイン機能の不具合",
          occurrenceDateTime: null,
          keyword: "ログイン",
        };

        if (issue.occurrenceDateTime === null) {
          throw new Error(
            "課題の発生日時が指定されていません。時系列パターン分析を実行できません。課題ID: ISSUE-001"
          );
        }

        return {
          reportId: "report-001",
          recurringIssuePatterns: [],
          visualizationGraphs: [],
          emailSentAt: new Date().toISOString(),
        };
      }),
    };

    const input: Tx8AgentInput = {
      analysisStartDate,
      analysisEndDate,
      recipientManagerId,
    };

    await expect(runTx8Imp1Agent(input, stubAiClient)).rejects.toThrow(
      /発生日時/
    );
  });
});