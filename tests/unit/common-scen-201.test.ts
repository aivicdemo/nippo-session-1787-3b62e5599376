import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx11Imp1Agent } from "../../src/agents/tx-11-imp-1/orchestrator";
import type {
  Tx11AgentInput,
  Tx11AgentOutput,
} from "../../src/agents/tx-11-imp-1/orchestrator";

interface MockAiAction {
  actionName: string;
  promptVersion: string;
  promptContent: string;
  timestamp: Date;
}

interface MockTx11Imp1AiClient {
  executeAction: jest.Mock<
    Promise<string>,
    [actionName: string, promptContent: string, promptVersion: string]
  >;
  recordedActions: MockAiAction[];
}

describe("Tx11Imp1Agent - Daily Report Collection and Reference Information Display", () => {
  let mockAiClient: MockTx11Imp1AiClient;
  let recordedActions: MockAiAction[];

  beforeEach(() => {
    recordedActions = [];

    mockAiClient = {
      executeAction: jest.fn(
        async (
          actionName: string,
          promptContent: string,
          promptVersion: string
        ): Promise<string> => {
          const action: MockAiAction = {
            actionName,
            promptVersion,
            promptContent,
            timestamp: new Date(),
          };
          recordedActions.push(action);

          if (actionName === "action-07") {
            return JSON.stringify({
              referenceItems: [
                {
                  occurredDate: "2024-01-15T09:30:00Z",
                  memberName: "member-a",
                  department: "engineering",
                  issue: "要件未確定による工程遅延",
                  resolution:
                    "ステークホルダーとの要件確定会議を即日実施",
                  daysRequired: 3,
                },
                {
                  occurredDate: "2024-01-08T10:15:00Z",
                  memberName: "member-a",
                  department: "engineering",
                  issue: "仕様書の曖昧さから実装工数が増加",
                  resolution: "要件仕様書の明確化と承認プロセスの導入",
                  daysRequired: 2,
                },
                {
                  occurredDate: "2023-12-28T14:00:00Z",
                  memberName: "colleague-a",
                  department: "engineering",
                  issue: "要件変更の追加工数が見積もりを超過",
                  resolution: "変更管理委員会による優先度判定と分解",
                  daysRequired: 4,
                },
              ],
              displayLimit: 3,
              filteredByDepartment: true,
              filteredByMember: false,
            });
          }

          if (actionName === "action-07-department-b") {
            return JSON.stringify({
              referenceItems: [
                {
                  occurredDate: "2024-01-12T11:00:00Z",
                  memberName: "member-b",
                  department: "marketing",
                  issue: "キャンペーン資料の承認遅延",
                  resolution: "承認者への事前レビュー申し入れ",
                  daysRequired: 1,
                },
              ],
              displayLimit: 3,
              filteredByDepartment: true,
              filteredByMember: false,
            });
          }

          return JSON.stringify({ success: true });
        }
      ),
      recordedActions,
    };
  });

  afterEach(() => {
    recordedActions = [];
  });

  // SCEN-201
  test("should display reference information from past similar issues when member accesses daily report creation screen", async () => {
    const executionTimestamp = new Date("2024-01-22T06:00:00Z");
    const teamId = "team-engineering";
    const reportDeadlineTime = "09:30";
    const managerEmail = "manager@company.example.com";

    const input: Tx11AgentInput = {
      executionTimestamp,
      teamId,
      reportDeadlineTime,
      managerEmail,
    };

    const output: Tx11AgentOutput = await runTx11Imp1Agent(
      input,
      mockAiClient as any
    );

    expect(output).toBeDefined();
    expect(output.submissionStatus).toBeDefined();
    expect(output.submissionStatus.totalMembers).toBeGreaterThan(0);
    expect(output.notificationsSent).toBeDefined();
    expect(Array.isArray(output.notificationsSent)).toBe(true);

    const action07Call = recordedActions.find((a) => a.actionName === "action-07");
    expect(action07Call).toBeDefined();
    expect(action07Call?.promptContent).toBeDefined();

    const promptContent = action07Call!.promptContent;
    expect(promptContent).toMatch(/過去課題/i || /similar/i);
    expect(promptContent).toMatch(/database/i || /参考/i);
    expect(promptContent).toMatch(/search/i || /検索/i);

    expect(mockAiClient.executeAction).toHaveBeenCalledWith(
      "action-07",
      expect.stringContaining(""),
      expect.any(String)
    );

    const allCalls = mockAiClient.executeAction.mock.calls;
    expect(allCalls.length).toBeGreaterThan(0);

    const action07Calls = allCalls.filter((call) => call[0] === "action-07");
    expect(action07Calls.length).toBeGreaterThanOrEqual(1);

    if (action07Calls.length > 0) {
      const firstAction07Call = action07Calls[0];
      const promptVersion = firstAction07Call[2];
      expect(promptVersion).toBeDefined();
      expect(typeof promptVersion).toBe("string");
    }

    expect(output.prioritizedIssues).toBeDefined();
    expect(Array.isArray(output.prioritizedIssues)).toBe(true);

    const unsubmittedMembers = output.submissionStatus.unsubmittedMembers;
    if (unsubmittedMembers && unsubmittedMembers.length > 0) {
      expect(unsubmittedMembers).toEqual(
        expect.arrayContaining([expect.any(String)])
      );
    }

    expect(output.summaryEmailSent).toBe(true);
  });
});