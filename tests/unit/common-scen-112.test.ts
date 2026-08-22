import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx6Imp1Agent } from "../../src/agents/tx-6-imp-1/orchestrator";
import type {
  Tx6AgentInput,
  Tx6AgentOutput,
  PriorityIssue,
} from "../../src/agents/tx-6-imp-1/types";
import type { Tx6Imp1AiClient } from "../../src/agents/tx-6-imp-1/types";

const fetchMock = require("jest-fetch-mock");

describe("tx-6-imp-1 orchestrator", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.clearAllMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-112
  test("日報収集から分析レポート生成までの自動実行 - Action 6 が契約通りレポート形式で生成する", async () => {
    const executionTimestamp = new Date("2024-01-15T09:00:00Z");
    const analysisStartDate = "2024-01-08";
    const analysisEndDate = "2024-01-14";
    const teamId = "team-001";

    const input: Tx6AgentInput = {
      executionTimestamp,
      analysisStartDate,
      analysisEndDate,
      teamId,
    };

    const mockExtractedIssues = [
      {
        issueKeyword: "API応答遅延",
        occurrenceCount: 3,
        priorityScore: 85,
        priorityRank: "高",
      },
      {
        issueKeyword: "データベース接続エラー",
        occurrenceCount: 2,
        priorityScore: 80,
        priorityRank: "高",
      },
      {
        issueKeyword: "UI レイアウト崩れ",
        occurrenceCount: 1,
        priorityScore: 45,
        priorityRank: "中",
      },
      {
        issueKeyword: "ドキュメント不足",
        occurrenceCount: 1,
        priorityScore: 30,
        priorityRank: "低",
      },
      {
        issueKeyword: "テストカバレッジ低下",
        occurrenceCount: 2,
        priorityScore: 50,
        priorityRank: "中",
      },
    ];

    const mockAiClient: Tx6Imp1AiClient = {
      executeAction01: jest.fn().mockResolvedValue({
        reportId: "rpt-20240115-001",
        unsubmittedMembers: ["member-003"],
      }),

      executeAction02: jest.fn().mockResolvedValue({
        extractedIssues: mockExtractedIssues,
      }),

      executeAction03: jest.fn().mockResolvedValue({
        categorizedIssues: {
          infrastructure: ["API応答遅延", "データベース接続エラー"],
          frontend: ["UI レイアウト崩れ"],
          process: ["ドキュメント不足"],
          testing: ["テストカバレッジ低下"],
        },
      }),

      executeAction04: jest.fn().mockResolvedValue({
        frequencyAnalysis: {
          "API応答遅延": { occurrenceCount: 3, categoryKey: "infrastructure" },
          "データベース接続エラー": {
            occurrenceCount: 2,
            categoryKey: "infrastructure",
          },
          "UI レイアウト崩れ": {
            occurrenceCount: 1,
            categoryKey: "frontend",
          },
          "ドキュメント不足": {
            occurrenceCount: 1,
            categoryKey: "process",
          },
          "テストカバレッジ低下": {
            occurrenceCount: 2,
            categoryKey: "testing",
          },
        },
      }),

      executeAction05: jest.fn().mockResolvedValue({
        priorityScoreResults: mockExtractedIssues.map((issue) => ({
          issueKeyword: issue.issueKeyword,
          priorityScore: issue.priorityScore,
          priorityRank: issue.priorityRank,
        })),
      }),

      executeAction06: jest.fn().mockResolvedValue({
        reportId: "rpt-20240115-001",
        reportGeneratedAt: new Date("2024-01-15T09:05:30Z"),
        emailSentAt: new Date("2024-01-15T09:06:00Z"),
        extractedIssueCount: 5,
        topPriorityIssues: [
          {
            issueKeyword: "API応答遅延",
            occurrenceCount: 3,
            priorityScore: 85,
            priorityRank: "高",
          },
          {
            issueKeyword: "データベース接続エラー",
            occurrenceCount: 2,
            priorityScore: 80,
            priorityRank: "高",
          },
          {
            issueKeyword: "テストカバレッジ低下",
            occurrenceCount: 2,
            priorityScore: 50,
            priorityRank: "中",
          },
          {
            issueKeyword: "UI レイアウト崩れ",
            occurrenceCount: 1,
            priorityScore: 45,
            priorityRank: "中",
          },
          {
            issueKeyword: "ドキュメント不足",
            occurrenceCount: 1,
            priorityScore: 30,
            priorityRank: "低",
          },
        ],
      } as Tx6AgentOutput),
    };

    const result = await runTx6Imp1Agent(input, mockAiClient);

    expect(result).toBeDefined();
    expect(result.reportId).toBe("rpt-20240115-001");
    expect(result.reportGeneratedAt).toEqual(new Date("2024-01-15T09:05:30Z"));
    expect(result.emailSentAt).toEqual(new Date("2024-01-15T09:06:00Z"));

    expect(result.extractedIssueCount).toBe(5);

    expect(result.topPriorityIssues).toHaveLength(5);

    const topIssuesByRank = {
      高: result.topPriorityIssues.filter((i) => i.priorityRank === "高"),
      中: result.topPriorityIssues.filter((i) => i.priorityRank === "中"),
      低: result.topPriorityIssues.filter((i) => i.priorityRank === "低"),
    };
    expect(topIssuesByRank.高).toHaveLength(2);
    expect(topIssuesByRank.中).toHaveLength(2);
    expect(topIssuesByRank.低).toHaveLength(1);

    expect(result.topPriorityIssues[0].issueKeyword).toBe("API応答遅延");
    expect(result.topPriorityIssues[0].priorityScore).toBe(85);
    expect(result.topPriorityIssues[0].occurrenceCount).toBe(3);

    expect(result.topPriorityIssues[1].issueKeyword).toBe(
      "データベース接続エラー"
    );
    expect(result.topPriorityIssues[1].priorityScore).toBe(80);

    const isReportValidTimestamp =
      Math.abs(
        result.reportGeneratedAt.getTime() -
          new Date("2024-01-15T09:05:30Z").getTime()
      ) <= 5000;
    expect(isReportValidTimestamp).toBe(true);

    expect(mockAiClient.executeAction01).toHaveBeenCalledWith({
      executionTimestamp,
      analysisStartDate,
      analysisEndDate,
      teamId,
    });

    expect(mockAiClient.executeAction06).toHaveBeenCalled();

    const action06CallArgs = (mockAiClient.executeAction06 as jest.Mock).mock
      .calls[0];
    expect(action06CallArgs).toBeDefined();

    expect(
      action06CallArgs[0].extractedIssues ||
        action06CallArgs[0].frequencyAnalysis ||
        action06CallArgs[0].priorityScores
    ).toBeDefined();

    const personIdentifiablePatterns = [/member-\d{3}/, /部署/, /上司/];
    const reportString = JSON.stringify(result);
    const hasPersonalInfo = personIdentifiablePatterns.some((pattern) =>
      pattern.test(reportString)
    );
    const hasPersonalIdInIssues = result.topPriorityIssues.some((issue) =>
      personIdentifiablePatterns.some((pattern) =>
        pattern.test(issue.issueKeyword)
      )
    );
    expect(hasPersonalInfo).toBe(false);
    expect(hasPersonalIdInIssues).toBe(false);

    const reportIssueCount = result.topPriorityIssues.length;
    expect(reportIssueCount).toBe(result.extractedIssueCount);

    for (const issue of result.topPriorityIssues) {
      expect(["高", "中", "低"]).toContain(issue.priorityRank);
      expect(issue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);
      expect(issue.occurrenceCount).toBeGreaterThanOrEqual(1);
      expect(issue.issueKeyword).toBeTruthy();
      expect(typeof issue.issueKeyword).toBe("string");
    }

    const orderedByScore = [...result.topPriorityIssues].sort(
      (a, b) => b.priorityScore - a.priorityScore
    );
    expect(result.topPriorityIssues[0].priorityScore).toBeGreaterThanOrEqual(
      result.topPriorityIssues[result.topPriorityIssues.length - 1].priorityScore
    );

    expect(result.reportId).toMatch(/rpt-\d{8}-\d{3}/);
  });
});