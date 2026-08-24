import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { runTx1Imp1Agent } from "../../src/agents/tx-1-imp-1/orchestrator";
import type {
  Tx1Imp1AgentInput,
  Tx1Imp1AgentOutput,
} from "../../src/agents/tx-1-imp-1/orchestrator";
import type { Tx1Imp1AiClient } from "../../src/agents/tx-1-imp-1/orchestrator";

describe("tx-1-imp-1: 日報集約から課題優先順位付けと未提出通知までの自律実行", () => {
  // SCEN-3085
  test("should complete autonomous agent execution from report aggregation through completion notification to department head", async () => {
    // Setup: Prepare audit log mock storage
    const auditLogs: Array<{
      agentId: string;
      action: string;
      timestamp: string;
      result: string;
      recipient?: string;
      messageId?: string;
    }> = [];

    // Setup: Create stub AI client that implements Tx1Imp1AiClient interface
    const stubAiClient: Tx1Imp1AiClient = {
      setupAgent: jest.fn(async (config) => {
        return {
          actionPromptVersions: {
            action_01: "ACTION_01_PROMPT_VERSION_1.0",
            action_02: "ACTION_02_PROMPT_VERSION_1.0",
            action_03: "ACTION_03_PROMPT_VERSION_1.0",
            action_04: "ACTION_04_PROMPT_VERSION_1.0",
            action_05: "ACTION_05_PROMPT_VERSION_1.0",
            action_06: "ACTION_06_PROMPT_VERSION_1.0",
          },
          initialized: true,
        };
      }),

      executeAction: jest.fn(async (actionId, prompt, context) => {
        if (actionId === "action_01") {
          // Action 1: Retrieve report submission status from all members
          return {
            actionId: "action_01",
            executionStatus: "completed",
            result: {
              totalMembers: 10,
              submittedReports: 8,
              unsubmittedMembers: [
                { userId: "member_09", userName: "田中太郎", email: "tanaka@example.com" },
                { userId: "member_10", userName: "鈴木花子", email: "suzuki@example.com" },
              ],
            },
          };
        }

        if (actionId === "action_02") {
          // Action 2: Detect unsubmitted members and prepare notification
          return {
            actionId: "action_02",
            executionStatus: "completed",
            result: {
              unsubmittedCount: 2,
              notificationPrepared: true,
              targetUserIds: ["member_09", "member_10"],
            },
          };
        }

        if (actionId === "action_03") {
          // Action 3: Send automatic reminder notifications
          return {
            actionId: "action_03",
            executionStatus: "completed",
            result: {
              notificationsSent: 2,
              deliveryStatus: {
                member_09: "delivered",
                member_10: "delivered",
              },
            },
          };
        }

        if (actionId === "action_04") {
          // Action 4: Extract issues from submitted reports
          return {
            actionId: "action_04",
            executionStatus: "completed",
            result: {
              extractedIssues: [
                {
                  issueId: "issue_001",
                  keyword: "API応答遅延",
                  frequency: 3,
                  severity: "high",
                },
                {
                  issueId: "issue_002",
                  keyword: "テストカバレッジ不足",
                  frequency: 2,
                  severity: "medium",
                },
                {
                  issueId: "issue_003",
                  keyword: "ドキュメント更新遅延",
                  frequency: 1,
                  severity: "low",
                },
              ],
            },
          };
        }

        if (actionId === "action_05") {
          // Action 5: Assign priority scores to extracted issues
          return {
            actionId: "action_05",
            executionStatus: "completed",
            result: {
              prioritizedIssues: [
                {
                  issueId: "issue_001",
                  keyword: "API応答遅延",
                  priorityScore: 85,
                  priorityRank: "high",
                  colorCode: "red",
                },
                {
                  issueId: "issue_002",
                  keyword: "テストカバレッジ不足",
                  priorityScore: 65,
                  priorityRank: "medium",
                  colorCode: "yellow",
                },
                {
                  issueId: "issue_003",
                  keyword: "ドキュメント更新遅延",
                  priorityScore: 35,
                  priorityRank: "low",
                  colorCode: "green",
                },
              ],
              morningMeetingMaterialId: "material_20240115_001",
            },
          };
        }

        if (actionId === "action_06") {
          // Action 6: Send completion notification to department head
          const departmentHeadNotificationPayload = {
            recipientId: "manager_001",
            materialId: "material_20240115_001",
            completionTimestamp: "2024-01-15T09:15:00Z",
            statusMessage: "朝会資料が完成しました。ご確認ください。",
          };

          // Record audit log
          const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          auditLogs.push({
            agentId: "tx-1-imp-1",
            action: "send_notification_to_department_head",
            timestamp: "2024-01-15T09:15:00Z",
            result: "success",
            recipient: "manager_001",
            messageId: messageId,
          });

          return {
            actionId: "action_06",
            executionStatus: "completed",
            result: {
              notificationSent: true,
              recipientId: departmentHeadNotificationPayload.recipientId,
              materialId: departmentHeadNotificationPayload.materialId,
              messageId: messageId,
              deliveryStatus: "delivered",
              sentTimestamp: departmentHeadNotificationPayload.completionTimestamp,
            },
          };
        }

        throw new Error(`Unknown action: ${actionId}`);
      }),

      sendNotificationToDepartmentHead: jest.fn(async (payload) => {
        return {
          success: true,
          messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          deliveryStatus: "delivered",
        };
      }),
    };

    // Prepare test input
    const agentInput: Tx1Imp1AgentInput = {
      executionTimestamp: new Date("2024-01-15T09:00:00Z"),
      reportDeadlineTime: new Date("2024-01-15T09:00:00Z"),
      morningMeetingStartTime: new Date("2024-01-15T09:30:00Z"),
      targetTeamIds: ["team_001", "team_002"],
      managerUserId: "manager_001",
    };

    // Execute agent orchestrator
    const output: Tx1Imp1AgentOutput = await runTx1Imp1Agent(
      agentInput,
      stubAiClient as unknown as Tx1Imp1AiClient
    );

    // Verify setupAgent was called to retrieve prompt versions
    expect(stubAiClient.setupAgent).toHaveBeenCalled();
    const setupCall = (stubAiClient.setupAgent as jest.Mock).mock.calls[0];
    expect(setupCall).toBeDefined();

    // Verify all autonomous actions were executed in order
    expect(stubAiClient.executeAction).toHaveBeenCalledTimes(6);

    const executeCalls = (stubAiClient.executeAction as jest.Mock).mock.calls;
    expect(executeCalls[0][0]).toBe("action_01"); // Retrieve reports
    expect(executeCalls[1][0]).toBe("action_02"); // Detect unsubmitted
    expect(executeCalls[2][0]).toBe("action_03"); // Send notifications
    expect(executeCalls[3][0]).toBe("action_04"); // Extract issues
    expect(executeCalls[4][0]).toBe("action_05"); // Assign priorities
    expect(executeCalls[5][0]).toBe("action_06"); // Send completion notification

    // Verify final state: orchestrator returns success status
    expect(output.executionStatus).toBe("success");
    expect(output.morningMeetingMaterialUrl).toBe("material_20240115_001");

    // Verify report aggregation summary
    expect(output.reportAggregationSummary.totalTeamMembers).toBe(10);
    expect(output.reportAggregationSummary.submittedCount).toBe(8);
    expect(output.reportAggregationSummary.unsubmittedMembers).toHaveLength(2);
    expect(output.reportAggregationSummary.unsubmittedMembers[0].userId).toBe("member_09");
    expect(output.reportAggregationSummary.unsubmittedMembers[1].userId).toBe("member_10");

    // Verify prioritized issues list (3 issues extracted and prioritized)
    expect(output.prioritizedIssuesList).toHaveLength(3);

    // Verify first issue (highest priority)
    expect(output.prioritizedIssuesList[0].keyword).toBe("API応答遅延");
    expect(output.prioritizedIssuesList[0].priorityScore).toBe(85);
    expect(output.prioritizedIssuesList[0].rank).toBe("high");
    expect(output.prioritizedIssuesList[0].colorCode).toBe("red");

    // Verify second issue (medium priority)
    expect(output.prioritizedIssuesList[1].keyword).toBe("テストカバレッジ不足");
    expect(output.prioritizedIssuesList[1].priorityScore).toBe(65);
    expect(output.prioritizedIssuesList[1].rank).toBe("medium");
    expect(output.prioritizedIssuesList[1].colorCode).toBe("yellow");

    // Verify third issue (lowest priority)
    expect(output.prioritizedIssuesList[2].keyword).toBe("ドキュメント更新遅延");
    expect(output.prioritizedIssuesList[2].priorityScore).toBe(35);
    expect(output.prioritizedIssuesList[2].rank).toBe("low");
    expect(output.prioritizedIssuesList[2].colorCode).toBe("green");

    // Verify unsubmitted members notification was sent
    expect(output.unsubmittedMembersNotified).toBe(true);

    // Verify execution timestamp is recorded
    expect(output.executionTimestamp).toBeDefined();

    // Verify audit logs contain the send_notification_to_department_head action
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].agentId).toBe("tx-1-imp-1");
    expect(auditLogs[0].action).toBe("send_notification_to_department_head");
    expect(auditLogs[0].result).toBe("success");
    expect(auditLogs[0].recipient).toBe("manager_001");
    expect(auditLogs[0].timestamp).toBe("2024-01-15T09:15:00Z");
    expect(auditLogs[0].messageId).toBeDefined();

    // Verify sendNotificationToDepartmentHead was called with correct payload
    expect(stubAiClient.sendNotificationToDepartmentHead).toHaveBeenCalled();
    const notificationCall = (
      stubAiClient.sendNotificationToDepartmentHead as jest.Mock
    ).mock.calls[0];
    expect(notificationCall[0]).toEqual(
      expect.objectContaining({
        recipientId: "manager_001",
        materialId: "material_20240115_001",
        statusMessage: "朝会資料が完成しました。ご確認ください。",
      })
    );

    // Verify completion notification delivery status
    expect(output.executionStatus).toBe("success");
  });
});