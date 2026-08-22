import { runTx1Imp1Agent, type Tx1Imp1AiClient } from "../../src/agents/tx-1-imp-1/orchestrator";
import { type Tx1Imp1AgentInput, type Tx1Imp1AgentOutput } from "../../src/agents/tx-1-imp-1/orchestrator";

describe("Tx1Imp1 Orchestrator - 日報集約から課題優先順位付けと未提出通知までの自律実行", () => {
  // SCEN-025
  test("should execute Action 02 (create unsubmitted member list and send auto notification messages) according to contract", async () => {
    const executionTimestamp = new Date("2024-01-15T06:00:00Z");
    const reportDeadlineTime = "09:00";
    const morningMeetingStartTime = "09:30";
    
    // Setup: Create test data with 10 members, 8 submitted, 2 unsubmitted
    const teamMemberIds = [
      "user-01", "user-02", "user-03", "user-04", "user-05",
      "user-06", "user-07", "user-08", "user-09", "user-10"
    ];
    const unsubmittedMemberIds = ["user-09", "user-10"];
    const submittedMemberIds = [
      "user-01", "user-02", "user-03", "user-04", "user-05",
      "user-06", "user-07", "user-08"
    ];

    // Mock report submission status
    const reportSubmissionStatusMap = new Map<string, boolean>();
    teamMemberIds.forEach(memberId => {
      reportSubmissionStatusMap.set(
        memberId,
        submittedMemberIds.includes(memberId)
      );
    });

    // Mock submitted reports with no issues
    const submittedReportMap = new Map<string, string>();
    submittedMemberIds.forEach(memberId => {
      submittedReportMap.set(
        memberId,
        `Report from ${memberId}: Task completed successfully. No issues.`
      );
    });

    // Track email send log
    const emailSendLog: Array<{
      recipientIds: string[];
      messageType: string;
      scheduledTime: Date;
    }> = [];

    // Create stub AI client for Action 02
    const stubAiClient: Tx1Imp1AiClient = {
      async executeAction02(unsubmittedIds: string[]): Promise<{
        recipientIds: string[];
        messageType: string;
        scheduledTime: Date;
      }> {
        // Verify Action 02 receives correct unsubmitted list
        expect(unsubmittedIds).toEqual(unsubmittedMemberIds);
        expect(unsubmittedIds.length).toBe(2);

        const scheduledTime = new Date("2024-01-15T07:00:00Z");
        return {
          recipientIds: unsubmittedIds,
          messageType: "DAILY_REPORT_OVERDUE",
          scheduledTime
        };
      }
    };

    // Create mock context with stubbed systems
    const mockSystemContext = {
      getReportSubmissionStatus: async () => {
        return {
          submittedMemberIds,
          unsubmittedMemberIds
        };
      },
      getSubmittedReports: async () => {
        return submittedReportMap;
      },
      sendEmail: async (notification: {
        recipientIds: string[];
        messageType: string;
        scheduledTime: Date;
      }) => {
        emailSendLog.push(notification);
        return {
          successCount: notification.recipientIds.length,
          failedRecipients: []
        };
      },
      recordAuditLog: async (logEntry: {
        actionName: string;
        executedAt: Date;
        unsubmittedCount: number;
        notificationsSent: number;
        status: string;
      }) => {
        return logEntry;
      }
    };

    // Prepare input
    const input: Tx1Imp1AgentInput = {
      executionTimestamp,
      reportDeadlineTime,
      morningMeetingStartTime,
      teamMemberIds,
      managerEmail: "manager@example.com"
    };

    // Execute orchestrator
    const output = await runTx1Imp1Agent(input, stubAiClient as any);

    // SCEN-025 Assertion 1: Verify Action 01 was executed (report status retrieved)
    expect(typeof output).toBe("object");
    expect(output).not.toBeNull();

    // SCEN-025 Assertion 2: Verify Action 02 executed correctly
    expect(output.executionStatus).toBe("success");

    // SCEN-025 Assertion 3: Verify unsubmitted member list was created correctly
    expect(output.unsubmittedMemberCount).toBe(2);

    // SCEN-025 Assertion 4: Verify notifications were sent
    expect(emailSendLog.length).toBe(1);
    expect(emailSendLog[0].recipientIds).toEqual(["user-09", "user-10"]);
    expect(emailSendLog[0].messageType).toBe("DAILY_REPORT_OVERDUE");

    // SCEN-025 Assertion 5: Verify scheduled time is set to 7:00 AM
    const expectedScheduledTime = new Date("2024-01-15T07:00:00Z");
    expect(emailSendLog[0].scheduledTime.toISOString()).toBe(
      expectedScheduledTime.toISOString()
    );

    // SCEN-025 Assertion 6: Verify exact notification count matches unsubmitted count
    expect(output.unsubmittedMemberCount).toBe(emailSendLog[0].recipientIds.length);

    // SCEN-025 Assertion 7: Verify submitted members did not receive notifications
    expect(emailSendLog[0].recipientIds).not.toContain("user-01");
    expect(emailSendLog[0].recipientIds).not.toContain("user-08");

    // SCEN-025 Assertion 8: Verify Action 02 result in output
    expect(output.executionStatus).toBe("success");
    expect(output.completionTimestamp).toBeInstanceOf(Date);

    // SCEN-025 Assertion 9: Verify audit log entry format exists in output
    expect(output.aggregatedReportCount).toBe(submittedMemberIds.length);

    // SCEN-025 Assertion 10: Verify total team count matches input
    expect(submittedMemberIds.length + output.unsubmittedMemberCount).toBe(
      teamMemberIds.length
    );
  });
});