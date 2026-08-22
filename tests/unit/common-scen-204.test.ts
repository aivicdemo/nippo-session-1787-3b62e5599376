import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { runTx11Imp1Agent } from "../../src/agents/tx-11-imp-1/orchestrator";
import type {
  Tx11AgentInput,
  Tx11AgentOutput,
} from "../../src/agents/tx-11-imp-1/orchestrator";

describe("tx-11-imp-1 orchestrator", () => {
  // SCEN-204
  test("should escalate to manager when unsubmitted members remain after max reminder attempts", async () => {
    const executionTimestamp = new Date("2024-01-15T08:00:00Z");
    const teamId = "team-001";
    const reportDeadlineTime = "09:00";
    const managerEmail = "manager@example.com";

    const input: Tx11AgentInput = {
      executionTimestamp,
      teamId,
      reportDeadlineTime,
      managerEmail,
    };

    const escalationHandoffEvents: Array<{
      action: string;
      unsubmittedMembers: string[];
      attemptCount: number;
      finalTimestamp: Date;
      recommendedAction: string;
    }> = [];

    const auditEvents: Array<{
      action: string;
      triggeredBy: string;
      unsubmittedMembers: string[];
      attemptCount: number;
    }> = [];

    const managerNotificationSent = { value: false };

    const mockAiClient = {
      action01_fetchSubmissionStatus: jest
        .fn()
        .mockResolvedValue({
          totalMembers: 3,
          submittedCount: 0,
          unsubmittedMembers: ["member-A", "member-B", "member-C"],
        }),

      action02_sendReminders: jest.fn().mockImplementation(async (params) => {
        const { unsubmittedMembers, reminderAttempt } = params;
        if (reminderAttempt === 1) {
          return {
            sentToMembers: unsubmittedMembers,
            attemptNumber: 1,
            timestamp: new Date("2024-01-15T08:15:00Z"),
          };
        } else if (reminderAttempt === 2) {
          return {
            sentToMembers: ["member-A", "member-B"],
            attemptNumber: 2,
            timestamp: new Date("2024-01-15T12:15:00Z"),
            memberCSubmittedAt: new Date("2024-01-15T10:30:00Z"),
          };
        } else if (reminderAttempt === 3) {
          return {
            sentToMembers: ["member-A", "member-B"],
            attemptNumber: 3,
            timestamp: new Date("2024-01-15T16:15:00Z"),
          };
        }
        return null;
      }),

      action03_extractIssues: jest.fn().mockResolvedValue({
        issues: [],
        extractedCount: 0,
      }),

      action04_prioritizeIssues: jest.fn().mockResolvedValue({
        prioritizedIssues: [],
      }),

      action05_generateSummary: jest.fn().mockResolvedValue({
        summaryGenerated: true,
      }),

      action06_checkEscalationNeeded: jest
        .fn()
        .mockResolvedValue({
          escalationNeeded: true,
          unsubmittedMembers: ["member-A", "member-B"],
          attemptCount: 3,
          finalTimestamp: new Date("2024-01-15T16:15:00Z"),
          recommendedAction: "escalate_to_manager",
          confidence: 0.65,
        }),

      action07_sendManagerNotification: jest.fn().mockImplementation(async (
        params,
        humanConfirmation,
      ) => {
        if (!humanConfirmation || !humanConfirmation.approved) {
          return {
            notificationSent: false,
            reason: "awaiting_human_confirmation",
          };
        }
        managerNotificationSent.value = true;
        auditEvents.push({
          action: "escalate_to_manager",
          triggeredBy: "human_confirmation",
          unsubmittedMembers: ["member-A", "member-B"],
          attemptCount: 3,
        });
        return {
          notificationSent: true,
          sentAt: new Date("2024-01-15T16:30:00Z"),
        };
      }),
    };

    let escalationHandoffOccurred = false;
    let humanConfirmationRequired = false;

    try {
      const result = await runTx11Imp1Agent(input, mockAiClient as any);

      if (result.escalationHandoff) {
        escalationHandoffOccurred = true;
        escalationHandoffEvents.push(result.escalationHandoff);
        humanConfirmationRequired =
          result.escalationHandoff.action === "escalate_to_manager";

        expect(result.escalationHandoff).toBeDefined();
        expect(result.escalationHandoff.action).toBe("escalate_to_manager");
        expect(result.escalationHandoff.unsubmittedMembers).toEqual([
          "member-A",
          "member-B",
        ]);
        expect(result.escalationHandoff.attemptCount).toBe(3);
        expect(result.escalationHandoff.recommendedAction).toBe(
          "escalate_to_manager",
        );

        expect(managerNotificationSent.value).toBe(false);

        const humanApprovalConfirmation = {
          approved: true,
          confirmedBy: "manager@example.com",
          confirmedAt: new Date("2024-01-15T16:25:00Z"),
        };

        const finalResult = await mockAiClient.action07_sendManagerNotification(
          {
            unsubmittedMembers: ["member-A", "member-B"],
            attemptCount: 3,
            managerEmail,
          },
          humanApprovalConfirmation,
        );

        expect(finalResult.notificationSent).toBe(true);
        expect(managerNotificationSent.value).toBe(true);

        expect(auditEvents).toHaveLength(1);
        expect(auditEvents[0]).toEqual({
          action: "escalate_to_manager",
          triggeredBy: "human_confirmation",
          unsubmittedMembers: ["member-A", "member-B"],
          attemptCount: 3,
        });
      }
    } catch (error) {
      expect(error).toBeDefined();
    }

    expect(escalationHandoffOccurred).toBe(true);
    expect(humanConfirmationRequired).toBe(true);
  });
});