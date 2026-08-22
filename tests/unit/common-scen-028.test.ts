import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx1Imp1Agent } from "../../src/agents/tx-1-imp-1/orchestrator";
import type {
  Tx1Imp1AgentInput,
  Tx1Imp1AgentOutput,
  PrioritizedIssue,
} from "../../src/agents/tx-1-imp-1/types";

const fetchMock = require("jest-fetch-mock");

describe("Tx1Imp1Agent - 日報集約から課題優先順位付けと未提出通知までの自律実行", () => {
  // SCEN-028
  test("should generate morning meeting materials with prioritized issues ordered by priority score and escalation flags set correctly", async () => {
    fetchMock.resetMocks();

    const mockAiClient = {
      buildAction01Prompt: jest.fn().mockReturnValue({
        prompt: "Action 1 prompt",
        version: "1.0.0",
      }),
      buildAction02Prompt: jest.fn().mockReturnValue({
        prompt: "Action 2 prompt",
        version: "1.0.0",
      }),
      buildAction03Prompt: jest.fn().mockReturnValue({
        prompt: "Action 3 prompt",
        version: "1.0.0",
      }),
      buildAction04Prompt: jest.fn().mockReturnValue({
        prompt: "Action 4 prompt",
        version: "1.0.0",
      }),
      buildAction05Prompt: jest.fn().mockReturnValue({
        prompt: "Action 5 prompt for materials",
        version: "1.0.0",
      }),
      buildAction06Prompt: jest.fn().mockReturnValue({
        prompt: "Action 6 prompt for manager notification",
        version: "1.0.0",
      }),
      invokeAction01: jest.fn().mockResolvedValue({
        status: "success",
        unsubmittedMembers: [
          { userId: "user-005", email: "user5@example.com" },
        ],
      }),
      invokeAction02: jest.fn().mockResolvedValue({
        status: "success",
        notificationsSent: 1,
      }),
      invokeAction03: jest.fn().mockResolvedValue({
        status: "success",
        extractedIssues: [
          {
            issueId: "issue-001",
            title: "Database performance degradation",
            description: "Query response time exceeds 5 seconds",
            reportedBy: "user-001",
            reportedAt: new Date("2024-01-15T08:30:00Z"),
            category: "performance",
            keywords: ["database", "query", "performance"],
          },
          {
            issueId: "issue-002",
            title: "Database performance degradation",
            description: "Another report of slow queries",
            reportedBy: "user-002",
            reportedAt: new Date("2024-01-15T08:45:00Z"),
            category: "performance",
            keywords: ["database", "query", "performance"],
          },
          {
            issueId: "issue-003",
            title: "Critical security vulnerability found",
            description: "XSS vulnerability in user input handling",
            reportedBy: "user-003",
            reportedAt: new Date("2024-01-15T09:00:00Z"),
            category: "security",
            keywords: ["security", "vulnerability", "critical"],
          },
          {
            issueId: "issue-004",
            title: "Memory leak in background service",
            description: "Service memory usage increases over time",
            reportedBy: "user-004",
            reportedAt: new Date("2024-01-15T09:15:00Z"),
            category: "stability",
            keywords: ["memory", "leak", "stability"],
          },
        ],
      }),
      invokeAction04: jest.fn().mockResolvedValue({
        status: "success",
        prioritizedIssues: [
          {
            issueId: "issue-003",
            title: "Critical security vulnerability found",
            priority: 1,
            importanceScore: 100,
            urgencyScore: 95,
            owner: "user-003",
            estimatedResolutionMinutes: 180,
            isEscalated: true,
            escalationReason: "Critical severity",
            duplicateCount: 0,
          },
          {
            issueId: "issue-001",
            title: "Database performance degradation",
            priority: 2,
            importanceScore: 85,
            urgencyScore: 80,
            owner: "user-001",
            estimatedResolutionMinutes: 240,
            isEscalated: true,
            escalationReason: "Multiple reports (2)",
            duplicateCount: 1,
          },
          {
            issueId: "issue-004",
            title: "Memory leak in background service",
            priority: 3,
            importanceScore: 70,
            urgencyScore: 65,
            owner: "user-004",
            estimatedResolutionMinutes: 120,
            isEscalated: false,
            escalationReason: null,
            duplicateCount: 0,
          },
        ],
      }),
      invokeAction05: jest.fn().mockResolvedValue({
        status: "success",
        materialsId: "mat-20240115-001",
        generatedAt: new Date("2024-01-15T09:30:00Z"),
        materials: {
          id: "mat-20240115-001",
          generatedAt: "2024-01-15T09:30:00Z",
          sections: [
            {
              issueId: "issue-003",
              title: "Critical security vulnerability found",
              priority: 1,
              importanceScore: 100,
              urgencyScore: 95,
              owner: "user-003",
              estimatedResolutionMinutes: 180,
              isEscalated: true,
              escalationReason: "Critical severity",
            },
            {
              issueId: "issue-001",
              title: "Database performance degradation",
              priority: 2,
              importanceScore: 85,
              urgencyScore: 80,
              owner: "user-001",
              estimatedResolutionMinutes: 240,
              isEscalated: true,
              escalationReason: "Multiple reports (2)",
            },
            {
              issueId: "issue-004",
              title: "Memory leak in background service",
              priority: 3,
              importanceScore: 70,
              urgencyScore: 65,
              owner: "user-004",
              estimatedResolutionMinutes: 120,
              isEscalated: false,
              escalationReason: null,
            },
          ],
          summary:
            "本朝は重大セキュリティ脆弱性の即時対応が必須。DB性能低下は複数報告あり、優先対応が必要。メモリリーク問題は調査開始予定。",
        },
      }),
      invokeAction06: jest.fn().mockResolvedValue({
        status: "success",
        notificationSent: true,
        sentAt: new Date("2024-01-15T09:31:00Z"),
      }),
    };

    const input: Tx1Imp1AgentInput = {
      executionTimestamp: new Date("2024-01-15T09:00:00Z"),
      reportDeadlineTime: "09:00",
      morningMeetingStartTime: "09:30",
      teamMemberIds: ["user-001", "user-002", "user-003", "user-004", "user-005"],
      managerEmail: "manager@example.com",
    };

    const result: Tx1Imp1AgentOutput = await runTx1Imp1Agent(
      input,
      mockAiClient
    );

    expect(result).toBeDefined();
    expect(result.executionStatus).toBe("success");
    expect(result.aggregatedReportCount).toBeGreaterThanOrEqual(0);
    expect(result.unsubmittedMemberCount).toBe(1);
    expect(result.extractedIssueCount).toBe(4);
    expect(result.prioritizedIssueList).toBeDefined();
    expect(Array.isArray(result.prioritizedIssueList)).toBe(true);

    const prioritizedList = result.prioritizedIssueList;
    expect(prioritizedList.length).toBeGreaterThan(0);

    for (let i = 0; i < prioritizedList.length; i++) {
      const issue = prioritizedList[i];
      expect(issue.issueId).toBeDefined();
      expect(typeof issue.issueId).toBe("string");
      expect(issue.title).toBeDefined();
      expect(typeof issue.title).toBe("string");
      expect(issue.priority).toBeDefined();
      expect(typeof issue.priority).toBe("number");
      expect(issue.importanceScore).toBeDefined();
      expect(typeof issue.importanceScore).toBe("number");
      expect(issue.importanceScore).toBeGreaterThanOrEqual(0);
      expect(issue.importanceScore).toBeLessThanOrEqual(100);
      expect(issue.urgencyScore).toBeDefined();
      expect(typeof issue.urgencyScore).toBe("number");
      expect(issue.urgencyScore).toBeGreaterThanOrEqual(0);
      expect(issue.urgencyScore).toBeLessThanOrEqual(100);
      expect(issue.owner).toBeDefined();
      expect(typeof issue.owner).toBe("string");
      expect(issue.estimatedResolutionMinutes).toBeDefined();
      expect(typeof issue.estimatedResolutionMinutes).toBe("number");
      expect(issue.estimatedResolutionMinutes).toBeGreaterThan(0);

      if (i > 0) {
        const currentScore =
          prioritizedList[i].importanceScore *
          prioritizedList[i].urgencyScore;
        const prevScore =
          prioritizedList[i - 1].importanceScore *
          prioritizedList[i - 1].urgencyScore;
        expect(currentScore).toBeLessThanOrEqual(prevScore);
      }
    }

    const escalatedIssues = prioritizedList.filter(
      (issue) => issue.importanceScore * issue.urgencyScore >= 70 * 70
    );
    for (const escalatedIssue of escalatedIssues) {
      expect(escalatedIssue.isEscalated).toBe(true);
    }

    expect(result.summaryEmailSent).toBe(true);
    expect(result.completionTimestamp).toBeDefined();
    expect(result.completionTimestamp instanceof Date).toBe(true);

    expect(mockAiClient.buildAction01Prompt).toHaveBeenCalled();
    expect(mockAiClient.buildAction02Prompt).toHaveBeenCalled();
    expect(mockAiClient.buildAction03Prompt).toHaveBeenCalled();
    expect(mockAiClient.buildAction04Prompt).toHaveBeenCalled();
    expect(mockAiClient.buildAction05Prompt).toHaveBeenCalled();
    expect(mockAiClient.buildAction06Prompt).toHaveBeenCalled();

    expect(mockAiClient.invokeAction01).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "Action 1 prompt",
        version: "1.0.0",
      })
    );

    expect(mockAiClient.invokeAction02).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "Action 2 prompt",
        version: "1.0.0",
      })
    );

    expect(mockAiClient.invokeAction03).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "Action 3 prompt",
        version: "1.0.0",
      })
    );

    expect(mockAiClient.invokeAction04).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "Action 4 prompt",
        version: "1.0.0",
      })
    );

    expect(mockAiClient.invokeAction05).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "Action 5 prompt for materials",
        version: "1.0.0",
      })
    );

    expect(mockAiClient.invokeAction06).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "Action 6 prompt for manager notification",
        version: "1.0.0",
      })
    );
  });
});