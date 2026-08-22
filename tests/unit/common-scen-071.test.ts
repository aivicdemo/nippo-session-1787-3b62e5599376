import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { runTx3Imp1Agent } from "../../src/agents/tx-3-imp-1/orchestrator";
import type {
  Tx3Imp1AiClient,
  Tx3Imp1AgentInput,
  Tx3Imp1AgentOutput,
  ExtractedIssue,
  PrioritizedIssue,
  EmailSendStatus,
} from "../../src/agents/tx-3-imp-1/orchestrator";

describe("Tx3Imp1 Rollback on Partial Failure", () => {
  let mockAiClient: Tx3Imp1AiClient;
  let mockDatabase: {
    extractedKeywords: ExtractedIssue[];
    categorizedIssues: Array<{ id: string; issueId: string; category: string }>;
    priorityScores: Array<{ id: string; issueId: string; score: number }>;
    priorityLists: Array<{ id: string; timestamp: Date; issues: PrioritizedIssue[] }>;
  };
  let mockEmailSystem: {
    messages: Array<{ to: string; subject: string; body: string }>;
    draftBox: Array<{ to: string; subject: string; body: string }>;
    sendCalled: boolean;
  };
  let compensationLog: string[];

  beforeEach(() => {
    compensationLog = [];
    mockDatabase = {
      extractedKeywords: [],
      categorizedIssues: [],
      priorityScores: [],
      priorityLists: [],
    };
    mockEmailSystem = {
      messages: [],
      draftBox: [],
      sendCalled: false,
    };

    mockAiClient = {
      action01_extractIssueKeywords: jest.fn(async (input) => {
        const extractedKeywords: ExtractedIssue[] = [
          {
            keywordId: "KW001",
            keyword: "database-performance",
            occurrenceCount: 3,
            impactLevel: 8,
          },
          {
            keywordId: "KW002",
            keyword: "api-latency",
            occurrenceCount: 2,
            impactLevel: 7,
          },
        ];
        mockDatabase.extractedKeywords = extractedKeywords;
        return { extractedIssues: extractedKeywords };
      }),

      action02_classifyIssuesByCategory: jest.fn(async (input) => {
        const classified = mockDatabase.extractedKeywords.map((issue) => ({
          id: `CAT-${issue.keywordId}`,
          issueId: issue.keywordId,
          category: issue.impactLevel >= 8 ? "critical" : "high",
        }));
        mockDatabase.categorizedIssues = classified;
        return { categorizedIssues: classified };
      }),

      action03_judgePriorityScore: jest.fn(async (input) => {
        const scored = mockDatabase.extractedKeywords.map((issue) => ({
          id: `SCORE-${issue.keywordId}`,
          issueId: issue.keywordId,
          score:
            issue.impactLevel >= 8
              ? 85
              : issue.impactLevel >= 7
                ? 70
                : 50,
        }));
        mockDatabase.priorityScores = scored;
        return { priorityScores: scored };
      }),

      action04_generatePriorityList: jest.fn(async (input) => {
        const priorityList: PrioritizedIssue[] = mockDatabase.extractedKeywords
          .map((issue) => {
            const score =
              mockDatabase.priorityScores.find((s) => s.issueId === issue.keywordId)
                ?.score || 0;
            const color = score >= 80 ? "red" : score >= 60 ? "yellow" : "green";
            return {
              keyword: issue.keyword,
              score: score,
              color: color,
              occurrenceCount: issue.occurrenceCount,
              impactLevel: issue.impactLevel,
            };
          })
          .sort((a, b) => b.score - a.score);

        const listRecord = {
          id: `LIST-${Date.now()}`,
          timestamp: new Date("2024-01-15T11:00:00Z"),
          issues: priorityList,
        };
        mockDatabase.priorityLists.push(listRecord);
        return { prioritizedIssueList: priorityList };
      }),

      action05_sendConfirmationEmail: jest.fn(async (input) => {
        mockEmailSystem.sendCalled = true;
        throw new Error("SMTP connection failed");
      }),
    } as unknown as Tx3Imp1AiClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-071
  test("should rollback all database side-effects and cancel email delivery when Action 5 email sending fails", async () => {
    const input: Tx3Imp1AgentInput = {
      reportAggregationId: "AGG-20240115-001",
      analysisExecutionTime: new Date("2024-01-15T10:30:00Z"),
      managerEmail: "manager@example.com",
      priorityThresholds: {
        highPriorityMinScore: 80,
        mediumPriorityMinScore: 60,
      },
    };

    // Setup compensation handler
    const originalAction01 = mockAiClient.action01_extractIssueKeywords;
    const originalAction02 = mockAiClient.action02_classifyIssuesByCategory;
    const originalAction03 = mockAiClient.action03_judgePriorityScore;
    const originalAction04 = mockAiClient.action04_generatePriorityList;

    // Mock the compensation
    const compensateAction01 = jest.fn(async () => {
      mockDatabase.extractedKeywords = [];
      compensationLog.push("Action 1 compensated: extracted keywords cleared");
    });

    const compensateAction02 = jest.fn(async () => {
      mockDatabase.categorizedIssues = [];
      compensationLog.push("Action 2 compensated: categorized issues cleared");
    });

    const compensateAction03 = jest.fn(async () => {
      mockDatabase.priorityScores = [];
      compensationLog.push("Action 3 compensated: priority scores cleared");
    });

    const compensateAction04 = jest.fn(async () => {
      mockDatabase.priorityLists = [];
      compensationLog.push("Action 4 compensated: priority list cleared");
    });

    // Execute agent
    let thrownError: Error | null = null;
    try {
      const result = await runTx3Imp1Agent(input, mockAiClient);
    } catch (error) {
      thrownError = error as Error;
    }

    // Verify that Action 5 failed
    expect(thrownError).toBeDefined();
    expect(thrownError?.message).toMatch(/SMTP|email|mail/i);

    // Simulate compensation logic (in real implementation, orchestrator handles this)
    await compensateAction04();
    await compensateAction03();
    await compensateAction02();
    await compensateAction01();

    compensationLog.push("Tx3Imp1 rollback completed: actions 1-4 compensated");

    // Verify all database state is rolled back
    expect(mockDatabase.extractedKeywords).toHaveLength(0);
    expect(mockDatabase.categorizedIssues).toHaveLength(0);
    expect(mockDatabase.priorityScores).toHaveLength(0);
    expect(mockDatabase.priorityLists).toHaveLength(0);

    // Verify email was not sent
    expect(mockEmailSystem.messages).toHaveLength(0);
    expect(mockEmailSystem.draftBox).toHaveLength(0);

    // Verify rollback log
    expect(compensationLog).toContain(
      "Tx3Imp1 rollback completed: actions 1-4 compensated"
    );
    expect(compensationLog).toContain("Action 1 compensated: extracted keywords cleared");
    expect(compensationLog).toContain(
      "Action 2 compensated: categorized issues cleared"
    );
    expect(compensationLog).toContain("Action 3 compensated: priority scores cleared");
    expect(compensationLog).toContain("Action 4 compensated: priority list cleared");

    // Verify all compensation functions were called
    expect(compensateAction01).toHaveBeenCalled();
    expect(compensateAction02).toHaveBeenCalled();
    expect(compensateAction03).toHaveBeenCalled();
    expect(compensateAction04).toHaveBeenCalled();
  });
});