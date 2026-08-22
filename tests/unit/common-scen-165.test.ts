import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { runTx9Imp1Agent } from "../../src/agents/tx-9-imp-1/orchestrator";
import type {
  Tx9Imp1AiClient,
  Tx9AggregationRequest,
  Tx9AnalysisReport,
} from "../../src/agents/tx-9-imp-1/orchestrator";

describe("Tx9Imp1Agent - 日報集約から分析報告までの自動実行", () => {
  let mockAiClient: jest.Mocked<Tx9Imp1AiClient>;
  let auditLog: Array<{ action: string; timestamp: string }>;

  beforeEach(() => {
    auditLog = [];

    mockAiClient = {
      buildAction01Prompt: jest.fn(),
      buildAction02Prompt: jest.fn(),
      buildAction03Prompt: jest.fn(),
      buildAction04Prompt: jest.fn(),
      buildAction05Prompt: jest.fn(),
      buildAction06Prompt: jest.fn(),
      buildAction07Prompt: jest.fn(),
      callAiModel: jest.fn(),
    };

    mockAiClient.buildAction06Prompt.mockReturnValue({
      version: "1.0.0",
      content: "Build improvement proposals based on priority classified issues",
    });

    mockAiClient.callAiModel.mockImplementation(async (prompt: any) => {
      auditLog.push({
        action: "Action-06 executed by automated agent",
        timestamp: new Date().toISOString(),
      });

      return JSON.stringify({
        countermeasures: [
          {
            issueId: "high-issue-001",
            priority: "高",
            rationale: "顧客対応の遅延が発生しており、影響範囲が全チーム",
            countermeasureName: "顧客対応フロー標準化",
            implementationDays: 5,
            expectedEffect: "対応時間を30%削減、顧客満足度向上",
          },
          {
            issueId: "high-issue-002",
            priority: "高",
            rationale: "システム障害が頻発、ビジネスインパクト大",
            countermeasureName: "システム監視ツール導入",
            implementationDays: 10,
            expectedEffect: "障害検知時間を15分から2分に短縮",
          },
          {
            issueId: "high-issue-003",
            priority: "高",
            rationale: "品質チェック漏れが原因で不具合が本番流出",
            countermeasureName: "自動テスト導入と品質ゲート設定",
            implementationDays: 15,
            expectedEffect: "本番不具合件数を50%削減",
          },
          {
            issueId: "recurrence-issue-001",
            priority: "中",
            rationale:
              "過去30日間に2回以上検出された再発パターン、根本原因未解決",
            countermeasureName: "根本原因分析ワークショップ実施",
            implementationDays: 3,
            expectedEffect: "同一課題の再発を50%から15%に削減",
          },
          {
            issueId: "medium-issue-002",
            priority: "中",
            rationale: "対応速度の低下傾向、リソース制約が背景",
            countermeasureName: "チームスキルアップ研修実施",
            implementationDays: 20,
            expectedEffect: "対応速度を15%向上",
          },
          {
            issueId: "low-issue-001",
            priority: "低",
            rationale: "発生頻度は低いが改善余地あり",
            countermeasureName: "ドキュメント整備",
            implementationDays: 7,
            expectedEffect: "類似課題の再発防止",
          },
        ],
      });
    });
  });

  // SCEN-165
  test("should execute Action 6 (改善施策を提案する) and generate structured countermeasure proposals with correct audit trail", async () => {
    const request: Tx9AggregationRequest = {
      aggregationStartDate: "2024-01-01",
      aggregationEndDate: "2024-01-31",
      targetTeamIds: ["team-001", "team-002"],
      requestedByUserId: "user-manager-001",
    };

    const prioritizedIssuesInput = [
      {
        issueId: "high-issue-001",
        priority: 1,
        title: "顧客対応遅延",
        impactScope: "全チーム",
        urgency: "高",
      },
      {
        issueId: "high-issue-002",
        priority: 2,
        title: "システム障害頻発",
        impactScope: "全チーム",
        urgency: "高",
      },
      {
        issueId: "high-issue-003",
        priority: 3,
        title: "品質チェック漏れ",
        impactScope: "開発チーム",
        urgency: "高",
      },
      {
        issueId: "medium-issue-001",
        priority: 4,
        title: "再発課題（過去30日2回）",
        impactScope: "運用チーム",
        urgency: "中",
        recurrenceCount: 2,
        recurrenceDays: 30,
      },
      {
        issueId: "medium-issue-002",
        priority: 5,
        title: "対応速度低下",
        impactScope: "営業チーム",
        urgency: "中",
      },
      {
        issueId: "low-issue-001",
        priority: 6,
        title: "ドキュメント不備",
        impactScope: "事務チーム",
        urgency: "低",
      },
    ];

    const productivityMetricsInput = {
      issueResolutionSpeed: 4.5,
      reportSubmissionRate: 85.0,
      issueRecurrenceRate: 35.0,
    };

    const enrichedDataInput = {
      prioritizedIssues: prioritizedIssuesInput,
      productivityMetrics: productivityMetricsInput,
      aggregationPeriod: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
    };

    const result: Tx9AnalysisReport = await runTx9Imp1Agent(
      request,
      mockAiClient,
      enrichedDataInput
    );

    expect(mockAiClient.buildAction06Prompt).toHaveBeenCalledTimes(1);

    const promptCall = mockAiClient.buildAction06Prompt.mock.calls[0];
    expect(promptCall).toBeDefined();
    expect(promptCall[0]).toHaveProperty("prioritizedIssues");
    expect(promptCall[0]).toHaveProperty("productivityMetrics");

    expect(result).toBeDefined();
    expect(result).toHaveProperty("reportId");
    expect(result).toHaveProperty("aggregationPeriod");
    expect(result).toHaveProperty("productivityMetrics");
    expect(result).toHaveProperty("prioritizedIssues");
    expect(result).toHaveProperty("recommendedCountermeasures");
    expect(result).toHaveProperty("generatedAt");

    const countermeasures = result.recommendedCountermeasures;
    expect(Array.isArray(countermeasures)).toBe(true);
    expect(countermeasures.length).toBe(6);

    const highPriorityCountermeasures = countermeasures.filter(
      (c) => c.priority === "高"
    );
    expect(highPriorityCountermeasures.length).toBe(3);
    highPriorityCountermeasures.forEach((countermeasure) => {
      expect(countermeasure).toHaveProperty("issueId");
      expect(countermeasure).toHaveProperty("countermeasureName");
      expect(countermeasure).toHaveProperty("rationale");
      expect(countermeasure).toHaveProperty("implementationDays");
      expect(countermeasure).toHaveProperty("expectedEffect");
      expect(countermeasure.rationale).toBeTruthy();
      expect(countermeasure.implementationDays).toBeGreaterThan(0);
    });

    const recurrenceCountermeasures = countermeasures.filter(
      (c) => c.issueId === "recurrence-issue-001"
    );
    expect(recurrenceCountermeasures.length).toBeGreaterThan(0);
    const recurrenceCountermeasure = recurrenceCountermeasures[0];
    expect(recurrenceCountermeasure.rationale).toMatch(/再発パターン/);
    expect(recurrenceCountermeasure.rationale).toMatch(/30日間/);

    const mediumPriorityCountermeasures = countermeasures.filter(
      (c) => c.priority === "中"
    );
    expect(mediumPriorityCountermeasures.length).toBe(2);

    const lowPriorityCountermeasures = countermeasures.filter(
      (c) => c.priority === "低"
    );
    expect(lowPriorityCountermeasures.length).toBe(1);

    countermeasures.forEach((countermeasure) => {
      expect(countermeasure.implementationDays).toBeGreaterThanOrEqual(1);
      expect(countermeasure.implementationDays).toBeLessThanOrEqual(30);
    });

    expect(result.productivityMetrics.issueResolutionSpeed).toBe(4.5);
    expect(result.productivityMetrics.reportSubmissionRate).toBe(85.0);
    expect(result.productivityMetrics.issueRecurrenceRate).toBe(35.0);

    expect(mockAiClient.callAiModel).toHaveBeenCalledTimes(1);

    expect(auditLog.length).toBe(1);
    expect(auditLog[0].action).toMatch(/Action-06 executed by automated agent/);

    const generatedAtTime = new Date(result.generatedAt);
    expect(generatedAtTime.getTime()).toBeGreaterThan(0);
    expect(generatedAtTime.getTime()).toBeLessThanOrEqual(
      new Date().getTime()
    );
  });
});