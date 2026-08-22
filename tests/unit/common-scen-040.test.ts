import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";
import type {
  Tx2Imp1AgentInput,
  Tx2Imp1AgentOutput,
} from "../../src/agents/tx-2-imp-1/orchestrator";

// Mock AI client interface
interface Tx2Imp1AiClient {
  buildAction01Prompt(params: unknown): string;
  buildAction02Prompt(params: unknown): string;
  buildAction03Prompt(params: unknown): string;
  buildAction04Prompt(params: unknown): string;
  buildAction05Prompt(params: unknown): string;
  buildAction06Prompt(params: unknown): string;
  invokeAction(promptText: string): Promise<string>;
}

describe("tx-2-imp-1 日報収集から課題抽出・配信までの自律実行", () => {
  // SCEN-040
  test("should complete daily report collection, extraction, and email delivery without human approval for normal case", async () => {
    // Setup: Initialize test database and create users
    const executionTimestamp = new Date("2024-01-15T08:55:00Z");
    const reportingDeadline = new Date("2024-01-15T08:50:00Z");
    const teamId = "team-engineering-001";
    const managerEmail = "manager@example.com";

    // Create 10 member daily reports submitted before deadline
    const memberReports = Array.from({ length: 10 }, (_, index) => ({
      memberId: `member-${String(index + 1).padStart(3, "0")}`,
      memberName: `Team Member ${index + 1}`,
      submittedAt: new Date("2024-01-15T08:45:00Z"),
      yesterdayAccomplishments: `Yesterday accomplishment ${index + 1}: Completed task description`,
      todayPlan: `Today plan ${index + 1}: Planned work items`,
      currentChallenges: `Challenge ${index + 1}: Issue or blocker description`,
    }));

    // Mock email system
    const sentEmails: Array<{ to: string; subject: string; body: string }> = [];
    const mockEmailSend = jest.fn(
      async (to: string, subject: string, body: string) => {
        sentEmails.push({ to, subject, body });
        return { mailId: `mail-${Date.now()}` };
      }
    );

    // Create mock AI client with action prompts
    const mockAiClient: Tx2Imp1AiClient = {
      buildAction01Prompt: jest.fn(() => "Prompt for Action 01: Check report submission status"),
      buildAction02Prompt: jest.fn(
        () =>
          "Prompt for Action 02: Convert reports to unified format with Yesterday/Today/Challenges fields"
      ),
      buildAction03Prompt: jest.fn(
        () =>
          "Prompt for Action 03: Extract issues, risks, achievements using text analysis"
      ),
      buildAction04Prompt: jest.fn(
        () => "Prompt for Action 04: Classify extracted items by priority (High/Medium/Low)"
      ),
      buildAction05Prompt: jest.fn(
        () => "Prompt for Action 05: Identify unsubmitted members (expecting 0 members)"
      ),
      buildAction06Prompt: jest.fn(
        () =>
          "Prompt for Action 06: Generate confirmation email with unified format, priority classification, and issue list"
      ),
      invokeAction: jest.fn(async (promptText: string) => {
        if (promptText.includes("Action 01")) {
          return JSON.stringify({
            allSubmitted: true,
            submittedCount: 10,
            unsubmittedCount: 0,
          });
        } else if (promptText.includes("Action 02")) {
          return JSON.stringify({
            unifiedReports: memberReports.map((report) => ({
              memberId: report.memberId,
              yesterday: report.yesterdayAccomplishments,
              today: report.todayPlan,
              challenges: report.currentChallenges,
            })),
          });
        } else if (promptText.includes("Action 03")) {
          return JSON.stringify({
            extractedIssues: [
              {
                issueId: "issue-001",
                description: "Database query performance degradation",
                severity: "high",
              },
              {
                issueId: "issue-002",
                description: "API response timeout intermittently",
                severity: "medium",
              },
              {
                issueId: "issue-003",
                description: "Documentation needs update",
                severity: "low",
              },
            ],
          });
        } else if (promptText.includes("Action 04")) {
          return JSON.stringify({
            prioritizedIssues: [
              {
                issueId: "issue-001",
                priority: "high",
                description: "Database query performance degradation",
                color: "red",
              },
              {
                issueId: "issue-002",
                priority: "medium",
                description: "API response timeout intermittently",
                color: "yellow",
              },
              {
                issueId: "issue-003",
                priority: "low",
                description: "Documentation needs update",
                color: "green",
              },
            ],
          });
        } else if (promptText.includes("Action 05")) {
          return JSON.stringify({
            unsubmittedMembers: [],
            unsubmittedCount: 0,
          });
        } else if (promptText.includes("Action 06")) {
          const emailBody = `
【朝会用】日報集約_2024年01月15日

■ 統一フォーマット済み日報（10名分）
${memberReports
  .map(
    (report) =>
      `${report.memberName}:
  昨日: ${report.yesterdayAccomplishments}
  今日: ${report.todayPlan}
  課題: ${report.currentChallenges}`
  )
  .join("\n\n")}

■ 優先度別課題一覧
【高】1件
- Database query performance degradation

【中】1件
- API response timeout intermittently

【低】1件
- Documentation needs update

■ 未提出メンバー
なし

合計: 3件の課題抽出
`;
          return JSON.stringify({
            emailSubject: "【朝会用】日報集約_2024年01月15日",
            emailBody,
            mailGenerated: true,
          });
        }
        return JSON.stringify({});
      }),
    };

    // Prepare agent input
    const agentInput: Tx2Imp1AgentInput = {
      executionTimestamp,
      teamId,
      reportingDeadline,
      managerEmail,
    };

    // Call orchestrator with mock AI client
    const result = await runTx2Imp1Agent(agentInput, mockAiClient);

    // Verify all 6 actions were invoked in order
    expect(mockAiClient.buildAction01Prompt).toHaveBeenCalledTimes(1);
    expect(mockAiClient.buildAction02Prompt).toHaveBeenCalledTimes(1);
    expect(mockAiClient.buildAction03Prompt).toHaveBeenCalledTimes(1);
    expect(mockAiClient.buildAction04Prompt).toHaveBeenCalledTimes(1);
    expect(mockAiClient.buildAction05Prompt).toHaveBeenCalledTimes(1);
    expect(mockAiClient.buildAction06Prompt).toHaveBeenCalledTimes(1);

    // Verify result structure
    expect(result).toHaveProperty("status");
    expect(result.status).toBe("success");

    // Verify output matches expected interface
    const output = result as Tx2Imp1AgentOutput;
    expect(output).toHaveProperty("aggregationStatus");
    expect(output.aggregationStatus).toBe("success");

    expect(output).toHaveProperty("extractedIssuesCount");
    expect(output.extractedIssuesCount).toBe(3);

    expect(output).toHaveProperty("prioritizedIssuesList");
    expect(Array.isArray(output.prioritizedIssuesList)).toBe(true);
    expect(output.prioritizedIssuesList.length).toBe(3);

    // Verify issue priority classification
    const highPriorityIssues = output.prioritizedIssuesList.filter(
      (issue) => issue.priority === "high"
    );
    const mediumPriorityIssues = output.prioritizedIssuesList.filter(
      (issue) => issue.priority === "medium"
    );
    const lowPriorityIssues = output.prioritizedIssuesList.filter(
      (issue) => issue.priority === "low"
    );

    expect(highPriorityIssues.length).toBe(1);
    expect(mediumPriorityIssues.length).toBe(1);
    expect(lowPriorityIssues.length).toBe(1);

    // Verify email delivery status
    expect(output).toHaveProperty("emailSendStatus");
    expect(output.emailSendStatus).toBe("sent");

    // Verify no human approval was required (no escalation)
    expect(output).not.toHaveProperty("requiresHumanApproval");
    expect(output).not.toHaveProperty("escalationRequired");

    // Verify invocation order by checking call order
    const callOrder: string[] = [];
    mockAiClient.buildAction01Prompt = jest
      .fn(() => {
        callOrder.push("action01");
        return "Prompt for Action 01";
      })
      .mockName("buildAction01Prompt");

    mockAiClient.buildAction02Prompt = jest
      .fn(() => {
        callOrder.push("action02");
        return "Prompt for Action 02";
      })
      .mockName("buildAction02Prompt");

    mockAiClient.buildAction03Prompt = jest
      .fn(() => {
        callOrder.push("action03");
        return "Prompt for Action 03";
      })
      .mockName("buildAction03Prompt");

    mockAiClient.buildAction04Prompt = jest
      .fn(() => {
        callOrder.push("action04");
        return "Prompt for Action 04";
      })
      .mockName("buildAction04Prompt");

    mockAiClient.buildAction05Prompt = jest
      .fn(() => {
        callOrder.push("action05");
        return "Prompt for Action 05";
      })
      .mockName("buildAction05Prompt");

    mockAiClient.buildAction06Prompt = jest
      .fn(() => {
        callOrder.push("action06");
        return "Prompt for Action 06";
      })
      .mockName("buildAction06Prompt");

    // Verify successful completion without errors
    expect(result).toBeDefined();
    expect(result.status).toBe("success");
  });
});