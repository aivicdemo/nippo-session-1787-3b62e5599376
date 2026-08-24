import { runTx5Imp1Agent } from "../../src/agents/tx-5-imp-1/orchestrator";
import {
  type Tx5Imp1AgentInput,
  type Tx5Imp1AgentOutput,
  type ValidatedIssue,
  type ToolIntegrationResult,
  type ExecutionSummary,
} from "../../src/agents/tx-5-imp-1/types";

describe("tx-5-imp-1: 課題抽出から既存ツール連携・確認までの自律実行", () => {
  // SCEN-1276: [error] 既存ツール課題データ連携リトライ機能 - 連携処理開始前に外部ツールの接続状態が不正な場合、エラーとなる
  test("should fail with integration error when external tool connection is invalid before retry", async () => {
    const extracted_issue_id_001 = "issue-001";
    const extracted_issue_id_002 = "issue-002";

    const input: Tx5Imp1AgentInput = {
      extractedIssueIds: [extracted_issue_id_001, extracted_issue_id_002],
      validationMode: "auto",
      targetToolType: "jira",
      projectManagerId: "pm-user-123",
    };

    const mock_ai_client = {
      validateAndJudgePriority: jest.fn().mockResolvedValue({
        validatedIssues: [
          {
            issueId: extracted_issue_id_001,
            priorityScore: 75,
            priorityRank: "high",
            category: "品質",
            toolIssueId: null,
            validationStatus: "valid",
          } as ValidatedIssue,
          {
            issueId: extracted_issue_id_002,
            priorityScore: 50,
            priorityRank: "medium",
            category: "納期",
            toolIssueId: null,
            validationStatus: "valid",
          } as ValidatedIssue,
        ],
      }),
      performToolIntegration: jest.fn().mockRejectedValue(
        new Error("Tool connection timeout")
      ),
    };

    await expect(
      runTx5Imp1Agent(input, mock_ai_client)
    ).rejects.toThrow(/接続/);
  });
});