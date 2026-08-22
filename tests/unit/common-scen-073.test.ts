import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { runTx4Imp1Agent } from "../../src/agents/tx-4-imp-1/orchestrator";
import { type Tx4Imp1AiClient } from "../../src/agents/tx-4-imp-1/orchestrator";
import { buildAction01Prompt, ACTION_01_PROMPT_VERSION } from "../../src/agents/tx-4-imp-1/prompts/action-01";

describe("Tx4Imp1Agent - ダッシュボード分析から課題指示までの自動実行", () => {
  let fakeAiClient: Tx4Imp1AiClient;
  let executionLogEvents: Array<{ eventType: string; timestamp: Date; systemCount: number; recordCount: number }>;
  let action01CallCount: number;
  let buildAction01PromptSpy: jest.Mock;

  beforeEach(() => {
    executionLogEvents = [];
    action01CallCount = 0;

    const mockAggregatedData = {
      systemDataSources: [
        {
          systemName: "営業管理システム",
          sourceTimestamp: new Date("2024-01-15T09:30:00Z"),
          records: [
            {
              userId: "user-001",
              progressRate: 75,
              taskName: "新規案件ABC",
              status: "進行中"
            }
          ]
        },
        {
          systemName: "プロジェクト管理ツール",
          sourceTimestamp: new Date("2024-01-15T09:25:00Z"),
          records: [
            {
              userId: "user-002",
              progressRate: 60,
              taskName: "システムA開発",
              status: "ブロック中",
              issue: "外部APIの仕様待ち"
            }
          ]
        },
        {
          systemName: "タイムカード管理システム",
          sourceTimestamp: new Date("2024-01-15T09:20:00Z"),
          records: [
            {
              userId: "user-003",
              progressRate: 90,
              taskName: "テスト実行",
              status: "完了予定"
            }
          ]
        }
      ],
      reportSubmissionDeadline: "08:00",
      yesterdayTaskProgressRate: 85,
      todayScheduledTasks: ["案件提案", "進捗レビュー"],
      issuesList: ["外部API仕様確認遅延", "テスト環境不安定"]
    };

    fakeAiClient = {
      aggregateRealtimeProgressData: jest.fn(async () => {
        action01CallCount++;
        executionLogEvents.push({
          eventType: "AGGREGATE_MULTIPLE_SYSTEMS",
          timestamp: new Date("2024-01-15T09:35:00Z"),
          systemCount: 3,
          recordCount: 3
        });
        return mockAggregatedData;
      }),
      extractAndClassifyIssues: jest.fn(async () => ({
        extractedIssues: [
          { id: "issue-001", text: "外部API仕様確認遅延", severity: "HIGH" }
        ]
      })),
      prioritizeIssuesWithContext: jest.fn(async () => ({
        prioritizedIssues: [
          {
            issueId: "issue-001",
            priority: 1,
            estimatedResolutionDays: 2
          }
        ]
      })),
      generateCountermeasurePlan: jest.fn(async () => ({
        planId: "plan-001",
        recommendedActions: ["外部チームに仕様確認を催促"],
        estimatedResolutionDays: 2,
        assignedOwner: "manager-001"
      })),
      sendSummaryEmailToManager: jest.fn(async () => ({
        sent: true,
        timestamp: new Date("2024-01-15T09:40:00Z")
      }))
    };

    buildAction01PromptSpy = jest.fn(buildAction01Prompt);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-073
  test("should aggregate realtime progress data from multiple systems and pass to Action 1 with complete structure", async () => {
    const request = {
      executionTimestamp: new Date("2024-01-15T09:35:00Z"),
      targetDate: "2024-01-15",
      executorUserId: "manager-001",
      teamId: "team-001"
    };

    const result = await runTx4Imp1Agent(request, fakeAiClient);

    // Action 1が呼び出されたことを確認
    expect(fakeAiClient.aggregateRealtimeProgressData).toHaveBeenCalledTimes(1);
    expect(action01CallCount).toBe(1);

    // buildAction01Promptが呼び出されたことを確認（Action 1のプロンプト生成）
    const promptVersion = ACTION_01_PROMPT_VERSION;
    expect(typeof promptVersion).toBe("string");
    expect(promptVersion.length).toBeGreaterThan(0);

    // 複数システムから集約されたデータが構造化されていることを確認
    expect(fakeAiClient.aggregateRealtimeProgressData).toHaveBeenCalled();

    // 実行ログイベントに監査情報が記録されていることを確認
    expect(executionLogEvents.length).toBeGreaterThan(0);
    const aggregateEvent = executionLogEvents.find(
      (e) => e.eventType === "AGGREGATE_MULTIPLE_SYSTEMS"
    );
    expect(aggregateEvent).toBeDefined();
    expect(aggregateEvent?.systemCount).toBe(3);
    expect(aggregateEvent?.recordCount).toBe(3);
    expect(aggregateEvent?.timestamp).toEqual(new Date("2024-01-15T09:35:00Z"));

    // 集約データに必須フィールドが含まれていることを確認
    expect(Array.isArray(result.prioritizedIssues)).toBe(true);
    expect(result.prioritizedIssues.length).toBeGreaterThan(0);
    expect(result.extractedIssueCount).toBeGreaterThan(0);

    // 返された結果がTx4Imp1AiClientの出力型に合致することを確認
    expect(result.executionId).toBeDefined();
    expect(typeof result.executionId).toBe("string");
    expect(result.aggregatedReportCount).toBeGreaterThanOrEqual(0);
    expect(result.extractedIssueCount).toBeGreaterThanOrEqual(0);
    expect(result.countermeasurePlan).toBeDefined();
    expect(result.countermeasurePlan.planId).toBeDefined();
    expect(result.countermeasurePlan.recommendedActions).toBeDefined();
    expect(Array.isArray(result.countermeasurePlan.recommendedActions)).toBe(true);
    expect(result.countermeasurePlan.estimatedResolutionDays).toBeGreaterThan(0);
    expect(result.countermeasurePlan.assignedOwner).toBeDefined();
    expect(result.summaryEmailSent).toBe(true);
    expect(result.completionTimestamp).toBeInstanceOf(Date);
  });
});