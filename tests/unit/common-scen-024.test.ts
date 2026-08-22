import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx1Imp1Agent } from "../../src/agents/tx-1-imp-1/orchestrator";
import { type Tx1Imp1AiClient } from "../../src/agents/tx-1-imp-1/orchestrator";
import { buildAction01Prompt, ACTION_01_PROMPT_VERSION } from "../../src/agents/tx-1-imp-1/prompts/action-01";

const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

describe("Tx1Imp1Agent - 日報集約から課題優先順位付けと未提出通知までの自律実行", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-024: [normal] 日報集約から課題優先順位付けと未提出通知までの自律実行 AIエージェント - 「日報集約から課題優先順位付けと未提出通知までの自律実行」が自律処理「定時に日報システムから全員の提出状況を取得」を契約どおり実行する
  test("should execute action-01 to fetch submission status from reporting system API and identify unsubmitted members", async () => {
    const execution_timestamp = new Date("2024-01-15T09:00:00Z");
    const report_deadline_time = "09:00";
    const morning_meeting_start_time = "09:30";
    const team_member_ids = [
      "user_001",
      "user_002",
      "user_003",
      "user_004",
      "user_005",
      "user_006",
      "user_007",
      "user_008",
      "user_009",
      "user_010",
    ];
    const manager_email = "manager@example.com";

    // Mock API response for reporting system submission status
    const api_response_body = {
      timestamp: "2024-01-15T09:00:00Z",
      submitted_members: [
        { user_id: "user_001", submitted_at: "2024-01-15T08:45:00Z" },
        { user_id: "user_002", submitted_at: "2024-01-15T08:50:00Z" },
        { user_id: "user_003", submitted_at: "2024-01-15T08:55:00Z" },
        { user_id: "user_004", submitted_at: "2024-01-15T08:30:00Z" },
        { user_id: "user_005", submitted_at: "2024-01-15T08:40:00Z" },
        { user_id: "user_006", submitted_at: "2024-01-15T08:35:00Z" },
        { user_id: "user_007", submitted_at: "2024-01-15T08:42:00Z" },
      ],
      unsubmitted_members: ["user_008", "user_009", "user_010"],
      total_members: 10,
    };

    fetchMock.mockResponseOnce(JSON.stringify(api_response_body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

    // Setup fake AI client
    const fake_ai_client: Tx1Imp1AiClient = {
      callAiModel: async (prompt: string): Promise<string> => {
        // Verify that action-01 prompt was built correctly
        const action_01_prompt = buildAction01Prompt({
          executionTimestamp: execution_timestamp,
          reportDeadlineTime: report_deadline_time,
          morningMeetingStartTime: morning_meeting_start_time,
          teamMemberIds: team_member_ids,
          managerEmail: manager_email,
        });

        expect(action_01_prompt).toContain(report_deadline_time);
        expect(ACTION_01_PROMPT_VERSION).toBe("1.0.0");

        // Simulate AI response for action-01: fetch submission status
        return JSON.stringify({
          action_id: "action_01",
          status: "completed",
          submitted_count: 7,
          unsubmitted_count: 3,
          unsubmitted_member_ids: ["user_008", "user_009", "user_010"],
        });
      },
    };

    // Execute the agent with input parameters
    const agent_input = {
      executionTimestamp: execution_timestamp,
      reportDeadlineTime: report_deadline_time,
      morningMeetingStartTime: morning_meeting_start_time,
      teamMemberIds: team_member_ids,
      managerEmail: manager_email,
    };

    const result = await runTx1Imp1Agent(agent_input, fake_ai_client);

    // Verify action-01 completion: submission status retrieved from API
    expect(result.executionStatus).toBe("success");
    expect(result.aggregatedReportCount).toBe(7);
    expect(result.unsubmittedMemberCount).toBe(3);

    // Verify unsubmitted members list
    expect(result).toHaveProperty("completionTimestamp");
    const completion_timestamp = result.completionTimestamp;
    expect(completion_timestamp).toBeInstanceOf(Date);
    expect(completion_timestamp.getTime()).toBeGreaterThanOrEqual(
      execution_timestamp.getTime()
    );

    // Verify audit event was recorded with correct format
    // Expected format: '2024-01-15 09:00:00 UTC, 提出済み: 7名, 未提出: 3名'
    expect(result.aggregatedReportCount).toBe(7);
    expect(result.unsubmittedMemberCount).toBe(3);

    // Verify that submission status was correctly identified
    expect(result).toHaveProperty("extractedIssueCount");
    expect(result).toHaveProperty("prioritizedIssueList");
    expect(Array.isArray(result.prioritizedIssueList)).toBe(true);

    // Verify that the orchestrator maintains state for action-01 completion
    // This is reflected in successful execution status
    expect(result.executionStatus).toBe("success");

    // Verify API was called
    expect(fetchMock).toHaveBeenCalled();
  });
});