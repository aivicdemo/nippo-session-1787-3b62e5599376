import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { runTx1Imp1Agent } from "../../src/agents/tx-1-imp-1/orchestrator";
import type {
  Tx1Imp1AgentInput,
  Tx1Imp1AgentOutput,
  Tx1Imp1AiClient,
} from "../../src/agents/tx-1-imp-1/orchestrator";

describe("Tx1Imp1Agent - AI Output Validation and Error Handling", () => {
  test("SCEN-034: Rejects malformed AI output at Action 1 and halts with audit trail", async () => {
    // Setup: Fixed timestamps and execution context
    const executionTimestamp = new Date("2024-01-15T08:00:00Z");
    const reportDeadlineTime = "09:00";
    const morningMeetingStartTime = "09:30";
    const teamMemberIds = ["user001", "user002", "user003"];
    const managerEmail = "manager@example.com";

    // Input for the orchestrator
    const input: Tx1Imp1AgentInput = {
      executionTimestamp,
      reportDeadlineTime,
      morningMeetingStartTime,
      teamMemberIds,
      managerEmail,
    };

    // Mock AI client that returns malformed output
    // Action 1 is expected to return submitted employee IDs, but instead returns
    // submittedEmployeeIds as a string instead of an array
    const malformedAiClient: Tx1Imp1AiClient = {
      invokeAction01: jest.fn(async () => ({
        submittedEmployeeIds: "user001,user002", // INVALID: should be string[], not string
        aggregatedReports: [
          {
            employeeId: "user001",
            reportContent: "Progress on task A",
            submittedAt: new Date("2024-01-15T08:30:00Z"),
          },
          {
            employeeId: "user002",
            reportContent: "Progress on task B",
            submittedAt: new Date("2024-01-15T08:35:00Z"),
          },
        ],
      })),
      invokeAction02: jest.fn(async () => ({
        unsubmittedEmployeeIds: ["user003"],
        notificationsSent: 1,
      })),
      invokeAction03: jest.fn(async () => ({
        extractedIssues: [],
      })),
      invokeAction04: jest.fn(async () => ({
        prioritizedIssues: [],
      })),
      invokeAction05: jest.fn(async () => ({
        reportGenerated: true,
      })),
      invokeAction06: jest.fn(async () => ({
        emailSent: true,
      })),
      recordAuditLog: jest.fn(async () => {}),
      notifyManager: jest.fn(async () => {}),
    };

    // Execute the orchestrator with malformed AI client
    const result = await runTx1Imp1Agent(input, malformedAiClient);

    // Verify that the output indicates validation failure
    expect(result.executionStatus).toBe("failure");

    // Verify that the error message contains the specific validation error
    expect(result).toHaveProperty("errorDetails");
    if (result.errorDetails) {
      expect(result.errorDetails.message).toMatch(
        /submittedEmployeeIds.*array|type.*mismatch/i
      );
    }

    // Verify that the state is halted awaiting human review
    expect(result).toHaveProperty("agentState");
    if (result.agentState) {
      expect(result.agentState).toBe("HALTED_AWAITING_HUMAN_REVIEW");
    }

    // Verify that audit log was recorded with correct information
    expect(malformedAiClient.recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: expect.any(String),
        action: "Action-01",
        errorType: "MALFORMED_OUTPUT",
        rejectionReason: expect.stringMatching(/type_mismatch|array/i),
        promptVersion: expect.any(String),
        executionTimestamp: executionTimestamp.toISOString(),
      })
    );

    // Verify that manager was notified about the hold
    expect(malformedAiClient.notifyManager).toHaveBeenCalledWith(
      expect.objectContaining({
        managerEmail,
        messageType: "VALIDATION_FAILURE_HOLD",
        subject: expect.stringMatching(/保留中|hold|pending/i),
        body: expect.stringMatching(/妥当性確認|確認が必要|human review/i),
      })
    );

    // Verify that subsequent actions were NOT invoked
    // Action 2 (notify unsubmitted) should not be called
    expect(malformedAiClient.invokeAction02).not.toHaveBeenCalled();

    // Action 3 (extract issues) should not be called
    expect(malformedAiClient.invokeAction03).not.toHaveBeenCalled();

    // Action 4 (prioritize issues) should not be called
    expect(malformedAiClient.invokeAction04).not.toHaveBeenCalled();

    // Action 5 (generate report) should not be called
    expect(malformedAiClient.invokeAction05).not.toHaveBeenCalled();

    // Action 6 (send email) should not be called
    expect(malformedAiClient.invokeAction06).not.toHaveBeenCalled();

    // Verify that output contains information for next steps
    expect(result).toHaveProperty("completionTimestamp");
    expect(result.completionTimestamp).toBeInstanceOf(Date);

    // Verify that none of the success metrics are populated
    expect(result.aggregatedReportCount).toBe(0);
    expect(result.unsubmittedMemberCount).toBe(0);
    expect(result.extractedIssueCount).toBe(0);
    expect(result.prioritizedIssueList).toEqual([]);
    expect(result.summaryEmailSent).toBe(false);
  });
});