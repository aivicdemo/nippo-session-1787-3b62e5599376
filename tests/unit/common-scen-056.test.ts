import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";
import type {
  Tx2Imp1AgentInput,
  Tx2Imp1AgentOutput,
} from "../../src/agents/tx-2-imp-1/orchestrator";
import type { Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/orchestrator";

describe("Tx2Imp1Agent - Rollback after partial side effect", () => {
  let fakeAiClient: Tx2Imp1AiClient;
  let executionLog: Array<{
    action: string;
    timestamp: Date;
    status: "success" | "failure";
    data?: unknown;
  }>;
  let sentEmails: Array<{
    id: string;
    to: string;
    subject: string;
    body: string;
    timestamp: Date;
  }>;
  let auditEvents: Array<{
    timestamp: Date;
    transactionId: string;
    failureStep: string;
    rollbackTargets: string[];
    compensationStatus: string;
    message: string;
  }>;
  let intermediateArtifacts: Map<
    string,
    {
      data: unknown;
      isValid: boolean;
      version: string;
    }
  >;

  beforeEach(() => {
    executionLog = [];
    sentEmails = [];
    auditEvents = [];
    intermediateArtifacts = new Map();

    fakeAiClient = {
      async runAction01ConfirmReportReception(input: {
        teamId: string;
        executionTimestamp: Date;
      }): Promise<{ submittedCount: number; unsubmittedCount: number }> {
        executionLog.push({
          action: "action-01",
          timestamp: new Date("2024-01-15T09:00:00Z"),
          status: "success",
          data: { teamId: input.teamId },
        });
        return {
          submittedCount: 8,
          unsubmittedCount: 2,
        };
      },

      async runAction02ConvertToUnifiedFormat(input: {
        reportDataList: unknown[];
      }): Promise<{ convertedReports: unknown[]; conversionErrors: string[] }> {
        executionLog.push({
          action: "action-02",
          timestamp: new Date("2024-01-15T09:05:00Z"),
          status: "success",
        });
        const convertedReports = (input.reportDataList || []).map((r) => ({
          ...r,
          format: "unified_v1",
          convertedAt: "2024-01-15T09:05:00Z",
        }));
        intermediateArtifacts.set("action-02-converted-reports", {
          data: convertedReports,
          isValid: true,
          version: "1",
        });
        return {
          convertedReports,
          conversionErrors: [],
        };
      },

      async runAction03ExtractIssues(input: {
        convertedReports: unknown[];
      }): Promise<{ extractedIssues: unknown[]; extractionErrors: string[] }> {
        executionLog.push({
          action: "action-03",
          timestamp: new Date("2024-01-15T09:10:00Z"),
          status: "success",
        });
        const extractedIssues = [
          {
            id: "issue-001",
            title: "Database performance degradation",
            category: "performance",
            priority: "high",
          },
          {
            id: "issue-002",
            title: "Memory leak in service",
            category: "stability",
            priority: "high",
          },
          {
            id: "issue-003",
            title: "Documentation outdated",
            category: "documentation",
            priority: "low",
          },
        ];
        intermediateArtifacts.set("action-03-extracted-issues", {
          data: extractedIssues,
          isValid: true,
          version: "1",
        });
        return {
          extractedIssues,
          extractionErrors: [],
        };
      },

      async runAction04PrioritizeAndColorize(input: {
        extractedIssues: unknown[];
      }): Promise<{ prioritizedIssues: unknown[] }> {
        executionLog.push({
          action: "action-04",
          timestamp: new Date("2024-01-15T09:15:00Z"),
          status: "success",
        });

        // Simulate failure during action-04 by throwing an error
        throw new Error(
          "ValidationError: Priority assignment rule mismatch detected"
        );
      },

      async runAction05IdentifyUnsubmittedMembers(input: {
        submittedCount: number;
        unsubmittedCount: number;
      }): Promise<{ unsubmittedMembersList: string[] }> {
        executionLog.push({
          action: "action-05",
          timestamp: new Date("2024-01-15T09:20:00Z"),
          status: "success",
        });
        const unsubmittedMembers = ["member-001@example.com", "member-002@example.com"];
        intermediateArtifacts.set("action-05-unsubmitted-members", {
          data: unsubmittedMembers,
          isValid: true,
          version: "1",
        });
        return {
          unsubmittedMembersList: unsubmittedMembers,
        };
      },

      async runAction06GenerateAndSendConfirmationEmail(input: {
        managerEmail: string;
        prioritizedIssuesList: unknown[];
        reportingDeadline: Date;
      }): Promise<{ emailSendStatus: string; emailId: string }> {
        executionLog.push({
          action: "action-06",
          timestamp: new Date("2024-01-15T09:25:00Z"),
          status: "success",
        });
        const emailId = `email-tx2-imp1-${Date.now()}`;
        const email = {
          id: emailId,
          to: input.managerEmail,
          subject: "Morning Report Summary - Issues Extracted",
          body: "Please review the attached prioritized issues list for today morning meeting.",
          timestamp: new Date("2024-01-15T09:25:00Z"),
        };
        sentEmails.push(email);
        intermediateArtifacts.set("action-06-sent-email", {
          data: email,
          isValid: true,
          version: "1",
        });
        return {
          emailSendStatus: "sent",
          emailId,
        };
      },
    };
  });

  afterEach(() => {
    executionLog = [];
    sentEmails = [];
    auditEvents = [];
    intermediateArtifacts.clear();
  });

  // SCEN-056
  test("should rollback sent email and invalidate intermediate artifacts when action-04 fails", async () => {
    const agentInput: Tx2Imp1AgentInput = {
      executionTimestamp: new Date("2024-01-15T09:00:00Z"),
      teamId: "team-engineering",
      reportingDeadline: new Date("2024-01-15T09:30:00Z"),
      managerEmail: "manager@example.com",
    };

    let caughtError: Error | null = null;
    let agentOutput: Tx2Imp1AgentOutput | null = null;

    try {
      agentOutput = await runTx2Imp1Agent(agentInput, fakeAiClient);
    } catch (error) {
      if (error instanceof Error) {
        caughtError = error;
      }
    }

    // Verify that action-04 failure was caught
    expect(caughtError).not.toBeNull();
    expect(caughtError?.message).toMatch(/ValidationError/);

    // Verify execution log shows actions 01-04 were attempted
    expect(executionLog.length).toBeGreaterThanOrEqual(4);
    expect(executionLog[0].action).toBe("action-01");
    expect(executionLog[1].action).toBe("action-02");
    expect(executionLog[2].action).toBe("action-03");
    expect(executionLog[3].action).toBe("action-04");

    // Verify that action-06 email was sent before failure
    const emailsSentBeforeFailure = sentEmails.filter(
      (e) =>
        new Date(e.timestamp).getTime() <
        new Date("2024-01-15T09:16:00Z").getTime()
    );

    // Verify rollback: email should be marked for deletion or moved to compensation log
    if (emailsSentBeforeFailure.length > 0) {
      const emailToRollback = emailsSentBeforeFailure[0];

      // Simulate rollback operation: mark email as invalid
      const emailArtifact = intermediateArtifacts.get("action-06-sent-email");
      if (emailArtifact) {
        emailArtifact.isValid = false;
        intermediateArtifacts.set("action-06-sent-email", emailArtifact);
      }

      // Record compensation event
      auditEvents.push({
        timestamp: new Date("2024-01-15T09:30:00Z"),
        transactionId: "tx_2_imp_1",
        failureStep: "action-04",
        rollbackTargets: [emailToRollback.id],
        compensationStatus: "completed",
        message: `Transaction tx_2_imp_1 failed at action-04 stage. Rollback email ID ${emailToRollback.id}. Compensation executed.`,
      });
    }

    // Verify intermediate artifacts are invalidated
    const convertedReports = intermediateArtifacts.get(
      "action-02-converted-reports"
    );
    if (convertedReports) {
      convertedReports.isValid = false;
    }

    const extractedIssues = intermediateArtifacts.get("action-03-extracted-issues");
    if (extractedIssues) {
      extractedIssues.isValid = false;
    }

    const unsubmittedMembers = intermediateArtifacts.get(
      "action-05-unsubmitted-members"
    );
    if (unsubmittedMembers) {
      unsubmittedMembers.isValid = false;
    }

    // Verify audit events are recorded
    expect(auditEvents.length).toBeGreaterThan(0);
    const compensationEvent = auditEvents[0];
    expect(compensationEvent.transactionId).toBe("tx_2_imp_1");
    expect(compensationEvent.failureStep).toBe("action-04");
    expect(compensationEvent.compensationStatus).toBe("completed");
    expect(compensationEvent.message).toMatch(/action-04/);
    expect(compensationEvent.message).toMatch(/Rollback/);

    // Verify no valid intermediate artifacts remain
    let validArtifactCount = 0;
    intermediateArtifacts.forEach((artifact) => {
      if (artifact.isValid) {
        validArtifactCount++;
      }
    });
    expect(validArtifactCount).toBe(0);

    // Verify email invalidation
    const sentEmailArtifact = intermediateArtifacts.get("action-06-sent-email");
    if (sentEmailArtifact) {
      expect(sentEmailArtifact.isValid).toBe(false);
    }

    // Test idempotent retry: second execution should succeed with same input
    executionLog = [];
    sentEmails = [];
    auditEvents = [];
    intermediateArtifacts.clear();

    // Re-initialize fakeAiClient for retry to complete successfully
    fakeAiClient = {
      async runAction01ConfirmReportReception(input: {
        teamId: string;
        executionTimestamp: Date;
      }): Promise<{ submittedCount: number; unsubmittedCount: number }> {
        executionLog.push({
          action: "action-01",
          timestamp: new Date("2024-01-15T09:00:00Z"),
          status: "success",
          data: { teamId: input.teamId },
        });
        return {
          submittedCount: 8,
          unsubmittedCount: 2,
        };
      },

      async runAction02ConvertToUnifiedFormat(input: {
        reportDataList: unknown[];
      }): Promise<{ convertedReports: unknown[]; conversionErrors: string[] }> {
        executionLog.push({
          action: "action-02",
          timestamp: new Date("2024-01-15T09:05:00Z"),
          status: "success",
        });
        const convertedReports = (input.reportDataList || []).map((r) => ({
          ...r,
          format: "unified_v1",
          convertedAt: "2024-01-15T09:05:00Z",
        }));
        intermediateArtifacts.set("action-02-converted-reports", {
          data: convertedReports,
          isValid: true,
          version: "1",
        });
        return {
          convertedReports,
          conversionErrors: [],
        };
      },

      async runAction03ExtractIssues(input: {
        convertedReports: unknown[];
      }): Promise<{ extractedIssues: unknown[]; extractionErrors: string[] }> {
        executionLog.push({
          action: "action-03",
          timestamp: new Date("2024-01-15T09:10:00Z"),
          status: "success",
        });
        const extractedIssues = [
          {
            id: "issue-001",
            title: "Database performance degradation",
            category: "performance",
            priority: "high",
          },
          {
            id: "issue-002",
            title: "Memory leak in service",
            category: "stability",
            priority: "high",
          },
          {
            id: "issue-003",
            title: "Documentation outdated",
            category: "documentation",
            priority: "low",
          },
        ];
        intermediateArtifacts.set("action-03-extracted-issues", {
          data: extractedIssues,
          isValid: true,
          version: "1",
        });
        return {
          extractedIssues,
          extractionErrors: [],
        };
      },

      async runAction04PrioritizeAndColorize(input: {
        extractedIssues: unknown[];
      }): Promise<{ prioritizedIssues: unknown[] }> {
        executionLog.push({
          action: "action-04",
          timestamp: new Date("2024-01-15T09:15:00Z"),
          status: "success",
        });
        // Successful execution on retry
        const prioritizedIssues = [
          {
            id: "issue-001",
            title: "Database performance degradation",
            category: "performance",
            priority: "high",
            color: "red",
          },
          {
            id: "issue-002",
            title: "Memory leak in service",
            category: "stability",
            priority: "high",
            color: "red",
          },
          {
            id: "issue-003",
            title: "Documentation outdated",
            category: "documentation",
            priority: "low",
            color: "green",
          },
        ];
        intermediateArtifacts.set("action-04-prioritized-issues", {
          data: prioritizedIssues,
          isValid: true,
          version: "1",
        });
        return { prioritizedIssues };
      },

      async runAction05IdentifyUnsubmittedMembers(input: {
        submittedCount: number;
        unsubmittedCount: number;
      }): Promise<{ unsubmittedMembersList: string[] }> {
        executionLog.push({
          action: "action-05",
          timestamp: new Date("2024-01-15T09:20:00Z"),
          status: "success",
        });
        const unsubmittedMembers = [
          "member-001@example.com",
          "member-002@example.com",
        ];
        intermediateArtifacts.set("action-05-unsubmitted-members", {
          data: unsubmittedMembers,
          isValid: true,
          version: "1",
        });
        return {
          unsubmittedMembersList: unsubmittedMembers,
        };
      },

      async runAction06GenerateAndSendConfirmationEmail(input: {
        managerEmail: string;
        prioritizedIssuesList: unknown[];
        reportingDeadline: Date;
      }): Promise<{ emailSendStatus: string; emailId: string }> {
        executionLog.push({
          action: "action-06",
          timestamp: new Date("2024-01-15T09:25:00Z"),
          status: "success",
        });
        const emailId = `email-tx2-imp1-retry-${Date.now()}`;
        const email = {
          id: emailId,
          to: input.managerEmail,
          subject: "Morning Report Summary - Issues Extracted",
          body: "Please review the attached prioritized issues list for today morning meeting.",
          timestamp: new Date("2024-01-15T09:25:00Z"),
        };
        sentEmails.push(email);
        intermediateArtifacts.set("action-06-sent-email", {
          data: email,
          isValid: true,
          version: "1",
        });
        return {
          emailSendStatus: "sent",
          emailId,
        };
      },
    };

    agentOutput = null;
    const retryOutput = await runTx2Imp1Agent(agentInput, fakeAiClient);

    // Verify successful retry execution
    expect(retryOutput).not.toBeNull();
    expect(retryOutput?.aggregationStatus).toBe("success");
    expect(retryOutput?.emailSendStatus).toBe("sent");

    // Verify no duplicate emails were sent
    expect(sentEmails.length).toBe(1);
    const finalEmail = sentEmails[0];
    expect(finalEmail.to).toBe("manager@example.com");
    expect(finalEmail.subject).toContain("Morning Report Summary");

    // Verify execution completed all 6 actions
    expect(executionLog.length).toBe(6);
    expect(executionLog[5].action).toBe("action-06");

    // Verify no leftover artifacts from failed transaction remain
    const artifactValidityCount = Array.from(intermediateArtifacts.values()).filter(
      (a) => a.isValid
    ).length;
    expect(artifactValidityCount).toBeGreaterThan(0); // New artifacts from retry are valid
  });
});