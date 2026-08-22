import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { runTx1Imp1Agent } from "../../src/agents/tx-1-imp-1/orchestrator";
import type {
  Tx1Imp1AgentInput,
  Tx1Imp1AgentOutput,
} from "../../src/agents/tx-1-imp-1/orchestrator";

// Mock AI client interface
interface Tx1Imp1AiClient {
  aggregateReports: (
    executionTimestamp: Date,
    teamMemberIds: string[]
  ) => Promise<{ aggregatedCount: number; unsubmittedMembers: string[] }>;
  extractIssues: (
    reportData: Array<{ memberId: string; content: string }>
  ) => Promise<
    Array<{ id: string; title: string; description: string; severity: string }>
  >;
  prioritizeIssues: (
    issues: Array<{ id: string; title: string; severity: string }>
  ) => Promise<
    Array<{
      id: string;
      title: string;
      priority: number;
      reason: string;
    }>
  >;
  generateMorningMeetingMaterial: (
    prioritizedIssues: Array<{ id: string; priority: number }>
  ) => Promise<{ materialId: string; content: string }>;
}

// Mock database interface
interface MockDatabase {
  unsubmittedNotificationsSent: number;
  extractedIssuesCount: number;
  generatedMaterialsCount: number;
  managerNotificationsSent: number;
  mailSendAPICallCount: number;
  auditLogs: Array<{
    timestamp: Date;
    executionId: string;
    action: string;
    isDuplicateDetected: boolean;
  }>;
}

// Mock mail service
interface MockMailService {
  sendUnsubmittedReminder: jest.Mock;
  sendManagerNotification: jest.Mock;
  getCallCount: () => number;
}

describe("Tx1Imp1Agent Idempotent Retry", () => {
  let mockDb: MockDatabase;
  let mockMailService: MockMailService;
  let mockAiClient: jest.Mocked<Tx1Imp1AiClient>;
  let executionTimestamp: Date;
  let testInputData: Tx1Imp1AgentInput;

  beforeEach(() => {
    executionTimestamp = new Date("2024-01-15T09:00:00Z");

    mockDb = {
      unsubmittedNotificationsSent: 0,
      extractedIssuesCount: 0,
      generatedMaterialsCount: 0,
      managerNotificationsSent: 0,
      mailSendAPICallCount: 0,
      auditLogs: [],
    };

    mockMailService = {
      sendUnsubmittedReminder: jest.fn(async () => {
        mockDb.unsubmittedNotificationsSent += 1;
        mockDb.mailSendAPICallCount += 1;
      }),
      sendManagerNotification: jest.fn(async () => {
        mockDb.managerNotificationsSent += 1;
        mockDb.mailSendAPICallCount += 1;
      }),
      getCallCount: () => mockDb.mailSendAPICallCount,
    };

    mockAiClient = {
      aggregateReports: jest.fn(async () => ({
        aggregatedCount: 3,
        unsubmittedMembers: ["user-001", "user-002"],
      })),
      extractIssues: jest.fn(async () => [
        { id: "issue-001", title: "Bug in API", description: "desc1", severity: "high" },
        { id: "issue-002", title: "Performance lag", description: "desc2", severity: "medium" },
        { id: "issue-003", title: "Documentation missing", description: "desc3", severity: "low" },
      ]),
      prioritizeIssues: jest.fn(async (issues) => [
        { id: issues[0].id, title: issues[0].title, priority: 1, reason: "critical" },
        { id: issues[1].id, title: issues[1].title, priority: 2, reason: "significant" },
        { id: issues[2].id, title: issues[2].title, priority: 3, reason: "minor" },
      ]),
      generateMorningMeetingMaterial: jest.fn(async () => ({
        materialId: "material-001",
        content: "Generated morning meeting agenda",
      })),
    };

    testInputData = {
      executionTimestamp,
      reportDeadlineTime: "09:00",
      morningMeetingStartTime: "09:30",
      teamMemberIds: ["user-001", "user-002", "user-003"],
      managerEmail: "manager@company.com",
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-037
  test("should prevent duplicate writes and notifications on idempotent retry", async () => {
    // First execution
    const firstResult: Tx1Imp1AgentOutput = await runTx1Imp1Agent(
      testInputData,
      mockAiClient
    );

    // Verify first execution results
    expect(firstResult.executionStatus).toBe("success");
    expect(firstResult.aggregatedReportCount).toBe(3);
    expect(firstResult.unsubmittedMemberCount).toBe(2);
    expect(firstResult.extractedIssueCount).toBe(3);
    expect(firstResult.prioritizedIssueList).toHaveLength(5); // Top 5 issues (3 in this case)
    expect(firstResult.summaryEmailSent).toBe(true);

    // Record state after first execution
    const stateAfterFirstExecution = {
      unsubmittedNotificationsSent: mockDb.unsubmittedNotificationsSent,
      extractedIssuesCount: mockDb.extractedIssuesCount,
      generatedMaterialsCount: mockDb.generatedMaterialsCount,
      managerNotificationsSent: mockDb.managerNotificationsSent,
      mailSendAPICallCount: mockDb.mailSendAPICallCount,
    };

    // Simulate first execution state
    mockDb.unsubmittedNotificationsSent = 2;
    mockDb.extractedIssuesCount = 3;
    mockDb.generatedMaterialsCount = 1;
    mockDb.managerNotificationsSent = 1;
    mockDb.mailSendAPICallCount = 4;

    mockDb.auditLogs.push({
      timestamp: executionTimestamp,
      executionId: "exec-001",
      action: "COMPLETED",
      isDuplicateDetected: false,
    });

    // Reset mocks for second execution
    mockMailService.sendUnsubmittedReminder.mockClear();
    mockMailService.sendManagerNotification.mockClear();
    mockAiClient.aggregateReports.mockClear();
    mockAiClient.extractIssues.mockClear();
    mockAiClient.prioritizeIssues.mockClear();
    mockAiClient.generateMorningMeetingMaterial.mockClear();

    const mailCallCountBeforeSecondExec = mockDb.mailSendAPICallCount;

    // Second execution with identical input and timestamp
    const secondResult: Tx1Imp1AgentOutput = await runTx1Imp1Agent(
      testInputData,
      mockAiClient
    );

    // Verify second execution identifies as duplicate
    expect(secondResult.executionStatus).toBe("success");

    // Verify database state did not change
    expect(mockDb.unsubmittedNotificationsSent).toBe(2);
    expect(mockDb.extractedIssuesCount).toBe(3);
    expect(mockDb.generatedMaterialsCount).toBe(1);
    expect(mockDb.managerNotificationsSent).toBe(1);

    // Verify mail send API was not called in second execution
    expect(mockDb.mailSendAPICallCount).toBe(mailCallCountBeforeSecondExec);

    // Verify audit log records both executions
    expect(mockDb.auditLogs).toHaveLength(2);
    expect(mockDb.auditLogs[1]).toEqual({
      timestamp: executionTimestamp,
      executionId: expect.any(String),
      action: "COMPLETED",
      isDuplicateDetected: true,
    });

    // Verify second execution did not call AI methods
    expect(mockAiClient.aggregateReports).not.toHaveBeenCalled();
    expect(mockAiClient.extractIssues).not.toHaveBeenCalled();
    expect(mockAiClient.prioritizeIssues).not.toHaveBeenCalled();
    expect(mockAiClient.generateMorningMeetingMaterial).not.toHaveBeenCalled();

    // Verify mail service methods were not invoked
    expect(mockMailService.sendUnsubmittedReminder).not.toHaveBeenCalled();
    expect(mockMailService.sendManagerNotification).not.toHaveBeenCalled();

    // Verify completionTimestamp is set
    expect(secondResult.completionTimestamp).toBeDefined();
    expect(secondResult.completionTimestamp).toBeInstanceOf(Date);
  });
});