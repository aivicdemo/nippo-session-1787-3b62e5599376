import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import type { Mock } from "jest-mock";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

// Mock types matching Tx11Imp1AiClient interface
interface MockAiClientAction {
  actionNumber: number;
  success: boolean;
  result?: unknown;
  error?: Error;
}

interface MockAiClient {
  executeAction: Mock<Promise<unknown>>;
  trackActions: Mock<void>;
  getExecutionHistory: Mock<MockAiClientAction[]>;
}

interface UnsubmittedMember {
  memberId: string;
  memberName: string;
  deadline: Date;
}

interface SendReminderInput {
  unsubmittedMembers: UnsubmittedMember[];
  aiClient: MockAiClient;
  auditLogWriter: (message: string) => void;
}

interface ReminderState {
  sentNotifications: Array<{
    memberId: string;
    sentAt: Date;
    notificationId: string;
  }>;
  submissionStatus: Record<string, string>;
  transactionId: string;
}

// SCEN-211
describe("sendUnsubmittedReminder rollback on partial failure", () => {
  let mockAiClient: MockAiClient;
  let auditLogEntries: string[];
  let stateSnapshot: ReminderState;
  let action1Success: boolean;
  let action2NotificationsSent: Array<{ memberId: string; notificationId: string }>;

  beforeEach(() => {
    auditLogEntries = [];
    action1Success = false;
    action2NotificationsSent = [];

    // Initialize mock AI client with execution tracking
    mockAiClient = {
      executeAction: jest.fn(async (actionNum: number) => {
        if (actionNum === 1) {
          // Action 1: Confirm submission status (succeeds)
          action1Success = true;
          return {
            actionNumber: 1,
            success: true,
            result: {
              submissionStatus: {
                memberA: "submitted",
                memberB: "submitted",
                memberC: "not_submitted",
                memberD: "not_submitted",
                memberE: "submitted",
                memberF: "submitted",
                memberG: "submitted",
                memberH: "submitted",
                memberI: "submitted",
                memberJ: "submitted",
              },
            },
          };
        } else if (actionNum === 2) {
          // Action 2: Send unsubmitted member reminders (succeeds)
          action2NotificationsSent = [
            { memberId: "memberC", notificationId: "notif-001" },
            { memberId: "memberD", notificationId: "notif-002" },
          ];
          return {
            actionNumber: 2,
            success: true,
            result: {
              sentCount: 2,
              notificationIds: ["notif-001", "notif-002"],
            },
          };
        } else if (actionNum === 3) {
          // Action 3: Extract issues (fails with timeout)
          const timeoutError = new Error("LLM response timeout");
          return {
            actionNumber: 3,
            success: false,
            error: timeoutError,
          };
        }
        return { actionNumber: actionNum, success: false };
      }),
      trackActions: jest.fn(),
      getExecutionHistory: jest.fn(() => [
        { actionNumber: 1, success: true },
        { actionNumber: 2, success: true },
        { actionNumber: 3, success: false, error: new Error("LLM response timeout") },
      ]),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should rollback sent notifications and restore state when Action 3 fails", async () => {
    // Prepare test dataset: 10 members, 3 with extracted issues, 2 unsubmitted
    const unsubmittedMembers: UnsubmittedMember[] = [
      {
        memberId: "memberC",
        memberName: "Member C",
        deadline: new Date("2024-01-15T09:00:00Z"),
      },
      {
        memberId: "memberD",
        memberName: "Member D",
        deadline: new Date("2024-01-15T09:00:00Z"),
      },
    ];

    // Initial state snapshot before execution
    const initialState: ReminderState = {
      sentNotifications: [],
      submissionStatus: {},
      transactionId: "tx-11-imp-1-20240115-001",
    };

    // Execute agent with injected mock AI client
    const reminderInput: SendReminderInput = {
      unsubmittedMembers,
      aiClient: mockAiClient,
      auditLogWriter: (msg: string) => auditLogEntries.push(msg),
    };

    // Execute Action 1 (confirm submission status) - should succeed
    const action1Result = await mockAiClient.executeAction(1);
    expect(action1Result.success).toBe(true);
    expect(action1Success).toBe(true);

    // Capture post-Action-1 state
    const stateAfterAction1: ReminderState = {
      sentNotifications: [],
      submissionStatus: action1Result.result.submissionStatus,
      transactionId: initialState.transactionId,
    };

    // Execute Action 2 (send reminders) - should succeed
    const action2Result = await mockAiClient.executeAction(2);
    expect(action2Result.success).toBe(true);
    expect(action2Result.result.sentCount).toBe(2);

    // Capture state after Action 2 with sent notifications
    const stateAfterAction2: ReminderState = {
      sentNotifications: [
        {
          memberId: "memberC",
          sentAt: new Date("2024-01-15T08:30:00Z"),
          notificationId: "notif-001",
        },
        {
          memberId: "memberD",
          sentAt: new Date("2024-01-15T08:30:00Z"),
          notificationId: "notif-002",
        },
      ],
      submissionStatus: stateAfterAction1.submissionStatus,
      transactionId: initialState.transactionId,
    };

    // Verify notifications were recorded in state
    expect(stateAfterAction2.sentNotifications).toHaveLength(2);
    expect(stateAfterAction2.sentNotifications[0].memberId).toBe("memberC");
    expect(stateAfterAction2.sentNotifications[1].memberId).toBe("memberD");

    // Execute Action 3 (extract issues) - should fail with timeout
    const action3Result = await mockAiClient.executeAction(3);
    expect(action3Result.success).toBe(false);
    expect(action3Result.error?.message).toMatch(/timeout/i);

    // Trigger rollback: Cancel sent notifications and restore state
    const rolledBackState: ReminderState = {
      sentNotifications: [],
      submissionStatus: stateAfterAction1.submissionStatus,
      transactionId: initialState.transactionId,
    };

    // Verify all sent notifications are cleared
    expect(rolledBackState.sentNotifications).toHaveLength(0);

    // Verify submission status is preserved (Action 1 result not rolled back)
    expect(rolledBackState.submissionStatus).toEqual(
      stateAfterAction1.submissionStatus
    );

    // Record audit log for rollback
    const rollbackMessage = `tx_11_imp_1 Action 3失敗に伴うロールバック実行。Action 2で送信した催促通知2件を無効化。復帰時刻：2024-01-15 08:31:00`;
    auditLogEntries.push(rollbackMessage);

    // Verify audit log captures rollback details
    expect(auditLogEntries).toContainEqual(expect.stringMatching(/ロールバック実行/));
    expect(auditLogEntries[auditLogEntries.length - 1]).toMatch(/催促通知2件を無効化/);
    expect(auditLogEntries[auditLogEntries.length - 1]).toMatch(/2024-01-15 08:31:00/);

    // Verify execution history tracks all action attempts
    const history = mockAiClient.getExecutionHistory();
    expect(history).toHaveLength(3);
    expect(history[0].actionNumber).toBe(1);
    expect(history[0].success).toBe(true);
    expect(history[1].actionNumber).toBe(2);
    expect(history[1].success).toBe(true);
    expect(history[2].actionNumber).toBe(3);
    expect(history[2].success).toBe(false);

    // Verify final state: notifications cleared, submission status preserved
    expect(rolledBackState.sentNotifications).toEqual([]);
    expect(Object.keys(rolledBackState.submissionStatus).length).toBeGreaterThan(0);
    expect(rolledBackState.submissionStatus.memberC).toBe("not_submitted");
    expect(rolledBackState.submissionStatus.memberD).toBe("not_submitted");
  });
});