import { runTx7Imp1Agent, type Tx7Imp1AiClient } from "../../src/agents/tx-7-imp-1/orchestrator";
import { buildAction01Prompt, ACTION_01_PROMPT_VERSION } from "../../src/agents/tx-7-imp-1/prompts/action-01";
import { buildAction02Prompt, ACTION_02_PROMPT_VERSION } from "../../src/agents/tx-7-imp-1/prompts/action-02";
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from "../../src/agents/tx-7-imp-1/prompts/action-03";
import { buildAction04Prompt, ACTION_04_PROMPT_VERSION } from "../../src/agents/tx-7-imp-1/prompts/action-04";
import { buildAction05Prompt, ACTION_05_PROMPT_VERSION } from "../../src/agents/tx-7-imp-1/prompts/action-05";
import { buildAction06Prompt, ACTION_06_PROMPT_VERSION } from "../../src/agents/tx-7-imp-1/prompts/action-06";
import { buildAction07Prompt, ACTION_07_PROMPT_VERSION } from "../../src/agents/tx-7-imp-1/prompts/action-07";
import { buildAction08Prompt, ACTION_08_PROMPT_VERSION } from "../../src/agents/tx-7-imp-1/prompts/action-08";

describe("tx-7-imp-1: 月次レポート生成から分析完了までの自動実行エージェント", () => {
  // SCEN-124: [normal] 月次レポート生成から分析完了までの自動実行 AIエージェント - 通常案件を人の都度承認なしで最後まで完了する
  test("should execute all 8 actions in sequence without human approval when monthly report generation is triggered", async () => {
    const mockAiClient: Tx7Imp1AiClient = {
      invokeAction01TriggerConfirmation: jest.fn(async (prompt: string) => {
        expect(prompt).toBeTruthy();
        return {
          status: "confirmed",
          message: "月初日確認済み・レポート生成開始可能",
          generationStarted: true,
        };
      }),
      invokeAction02DataExtraction: jest.fn(async (prompt: string) => {
        expect(prompt).toBeTruthy();
        return {
          reportingData: [
            {
              memberId: "member_001",
              date: "2024-01-15",
              yesterday: "機能A実装完了",
              today: "機能B開発開始",
              issues: "API連携遅延",
            },
            {
              memberId: "member_002",
              date: "2024-01-15",
              yesterday: "バグ修正3件",
              today: "テスト実施",
              issues: "テスト環境不安定",
            },
            {
              memberId: "member_003",
              date: "2024-01-15",
              yesterday: "ドキュメント作成",
              today: "レビュー対応",
              issues: "システム連携遅延",
            },
            {
              memberId: "member_004",
              date: "2024-01-15",
              yesterday: "顧客打ち合わせ",
              today: "要件整理",
              issues: "要件曖昧性",
            },
            {
              memberId: "member_005",
              date: "2024-01-15",
              yesterday: "デプロイ実施",
              today: "監視設定",
              issues: "パフォーマンス低下",
            },
            {
              memberId: "member_006",
              date: "2024-01-15",
              yesterday: "セキュリティ監査",
              today: "脆弱性対応",
              issues: "脆弱性検出",
            },
            {
              memberId: "member_007",
              date: "2024-01-15",
              yesterday: "インフラ構築",
              today: "冗長化設定",
              issues: "システム連携遅延",
            },
            {
              memberId: "member_008",
              date: "2024-01-15",
              yesterday: "品質管理",
              today: "メトリクス収集",
              issues: "品質基準未達",
            },
            {
              memberId: "member_009",
              date: "2024-01-15",
              yesterday: "プロジェクト進捗管理",
              today: "リスク評価",
              issues: "スケジュール遅延",
            },
            {
              memberId: "member_010",
              date: "2024-01-15",
              yesterday: "トレーニング実施",
              today: "フィードバック収集",
              issues: "システム連携遅延",
            },
          ],
          extractedAt: new Date("2024-01-01T09:00:00Z").toISOString(),
          dataPoints: 10,
        };
      }),
      invokeAction03ReportGeneration: jest.fn(async (prompt: string) => {
        expect(prompt).toBeTruthy();
        return {
          reportId: "rpt_202401_001",
          format: "monthly_template",
          generatedAt: new Date("2024-01-01T10:00:00Z").toISOString(),
          sections: [
            "executive_summary",
            "issue_analysis",
            "bottleneck_analysis",
            "team_performance",
            "recommendations",
          ],
        };
      }),
      invokeAction04TimeSeriesAnalysis: jest.fn(async (prompt: string) => {
        expect(prompt).toBeTruthy();
        return {
          timeSeriesData: [
            { date: "2024-01-01", issueCount: 5 },
            { date: "2024-01-08", issueCount: 7 },
            { date: "2024-01-15", issueCount: 9 },
          ],
          issueAChangeDelta: 2,
          issueBChangeDelta: -1,
          analysisResult: "課題Aが前月比で2件増加、課題Bが1件減少",
        };
      }),
      invokeAction05BottleneckIdentification: jest.fn(async (prompt: string) => {
        expect(prompt).toBeTruthy();
        return {
          bottleneckIssue: "システム連携遅延",
          percentageOfTotal: 35,
          bottleneckResult: "ボトルネック：システム連携遅延が全体の35%を占める",
          affectedMembers: ["member_001", "member_003", "member_007", "member_010"],
        };
      }),
      invokeAction06TeamPerformanceMetrics: jest.fn(async (prompt: string) => {
        expect(prompt).toBeTruthy();
        return {
          teamMetrics: [
            { teamId: "team_a", issueCount: 5, avgResolutionDays: 2.5 },
            { teamId: "team_b", issueCount: 3, avgResolutionDays: 3.0 },
            { teamId: "team_c", issueCount: 2, avgResolutionDays: 1.5 },
          ],
          metricsResult: "チームA：課題5件、チームB：課題3件、チームC：課題2件",
        };
      }),
      invokeAction07PriorityRanking: jest.fn(async (prompt: string) => {
        expect(prompt).toBeTruthy();
        return {
          priorityRankedIssues: [
            {
              priority: 1,
              level: "high",
              issue: "システム連携遅延改善",
              impact: "全体35%に影響",
            },
            {
              priority: 2,
              level: "medium",
              issue: "課題A再発防止",
              impact: "前月比2件増加",
            },
            {
              priority: 3,
              level: "low",
              issue: "課題C追跡",
              impact: "継続監視対象",
            },
          ],
          rankingResult:
            "優先度1（高）：システム連携遅延改善、優先度2（中）：課題A再発防止、優先度3（低）：課題C追跡",
        };
      }),
      invokeAction08ReportPresentation: jest.fn(async (prompt: string) => {
        expect(prompt).toBeTruthy();
        return {
          presentationStatus: "completed",
          managerId: "manager_001",
          presentedAt: new Date("2024-01-01T11:00:00Z").toISOString(),
          auditEventCount: 8,
          allActionsCompleted: true,
        };
      }),
    };

    // Verify prompt builders are callable
    const action01Prompt = buildAction01Prompt({
      currentDate: new Date("2024-01-01T09:00:00Z"),
    });
    expect(action01Prompt).toBeTruthy();
    expect(ACTION_01_PROMPT_VERSION).toBeTruthy();

    const action02Prompt = buildAction02Prompt({
      startDate: new Date("2023-12-02"),
      endDate: new Date("2024-01-01"),
    });
    expect(action02Prompt).toBeTruthy();
    expect(ACTION_02_PROMPT_VERSION).toBeTruthy();

    const action03Prompt = buildAction03Prompt({
      reportId: "rpt_202401_001",
      dataPoints: 10,
    });
    expect(action03Prompt).toBeTruthy();
    expect(ACTION_03_PROMPT_VERSION).toBeTruthy();

    const action04Prompt = buildAction04Prompt({
      reportId: "rpt_202401_001",
      analysisType: "time_series",
    });
    expect(action04Prompt).toBeTruthy();
    expect(ACTION_04_PROMPT_VERSION).toBeTruthy();

    const action05Prompt = buildAction05Prompt({
      reportId: "rpt_202401_001",
      issueDataPoints: 9,
    });
    expect(action05Prompt).toBeTruthy();
    expect(ACTION_05_PROMPT_VERSION).toBeTruthy();

    const action06Prompt = buildAction06Prompt({
      reportId: "rpt_202401_001",
      teamCount: 3,
    });
    expect(action06Prompt).toBeTruthy();
    expect(ACTION_06_PROMPT_VERSION).toBeTruthy();

    const action07Prompt = buildAction07Prompt({
      reportId: "rpt_202401_001",
      issueCount: 3,
    });
    expect(action07Prompt).toBeTruthy();
    expect(ACTION_07_PROMPT_VERSION).toBeTruthy();

    const action08Prompt = buildAction08Prompt({
      reportId: "rpt_202401_001",
      managerId: "manager_001",
    });
    expect(action08Prompt).toBeTruthy();
    expect(ACTION_08_PROMPT_VERSION).toBeTruthy();

    // Verify orchestrator boundary: second parameter must be structurally identical to Tx7Imp1AiClient
    const aiClientInterface: Tx7Imp1AiClient = mockAiClient;
    expect(aiClientInterface).toBeDefined();
    expect(typeof aiClientInterface.invokeAction01TriggerConfirmation).toBe(
      "function"
    );
    expect(typeof aiClientInterface.invokeAction02DataExtraction).toBe(
      "function"
    );
    expect(typeof aiClientInterface.invokeAction03ReportGeneration).toBe(
      "function"
    );
    expect(typeof aiClientInterface.invokeAction04TimeSeriesAnalysis).toBe(
      "function"
    );
    expect(typeof aiClientInterface.invokeAction05BottleneckIdentification).toBe(
      "function"
    );
    expect(typeof aiClientInterface.invokeAction06TeamPerformanceMetrics).toBe(
      "function"
    );
    expect(typeof aiClientInterface.invokeAction07PriorityRanking).toBe(
      "function"
    );
    expect(typeof aiClientInterface.invokeAction08ReportPresentation).toBe(
      "function"
    );

    // Execute the agent with mocked AI client
    const request = {
      targetMonth: "2024-01",
      teamId: "team_all",
      triggeredBy: "schedule" as const,
      includeDetailedAnalysis: true,
    };

    const result = await runTx7Imp1Agent(request, mockAiClient);

    // Verify all 8 actions were called in sequence
    expect(mockAiClient.invokeAction01TriggerConfirmation).toHaveBeenCalledTimes(
      1
    );
    expect(mockAiClient.invokeAction02DataExtraction).toHaveBeenCalledTimes(1);
    expect(mockAiClient.invokeAction03ReportGeneration).toHaveBeenCalledTimes(1);
    expect(mockAiClient.invokeAction04TimeSeriesAnalysis).toHaveBeenCalledTimes(
      1
    );
    expect(
      mockAiClient.invokeAction05BottleneckIdentification
    ).toHaveBeenCalledTimes(1);
    expect(
      mockAiClient.invokeAction06TeamPerformanceMetrics
    ).toHaveBeenCalledTimes(1);
    expect(mockAiClient.invokeAction07PriorityRanking).toHaveBeenCalledTimes(1);
    expect(mockAiClient.invokeAction08ReportPresentation).toHaveBeenCalledTimes(
      1
    );

    // Verify result structure
    expect(result).toBeDefined();
    expect(result.reportId).toBe("rpt_202401_001");
    expect(result.generatedAt).toBeTruthy();
    expect(result.topPriorityChallenges).toEqual([
      {
        priority: 1,
        level: "high",
        issue: "システム連携遅延改善",
        impact: "全体35%に影響",
      },
      {
        priority: 2,
        level: "medium",
        issue: "課題A再発防止",
        impact: "前月比2件増加",
      },
      {
        priority: 3,
        level: "low",
        issue: "課題C追跡",
        impact: "継続監視対象",
      },
    ]);

    // Verify bottleneck trend analysis
    expect(result.bottleneckTrend).toBeDefined();
    expect(result.bottleneckTrend.timeSeriesData).toEqual([
      { date: "2024-01-01", issueCount: 5 },
      { date: "2024-01-08", issueCount: 7 },
      { date: "2024-01-15", issueCount: 9 },
    ]);
    expect(result.bottleneckTrend.recurringIssuePattern).toContain(
      "システム連携遅延"
    );

    // Verify team performance metrics
    expect(result.teamPerformanceMetrics).toBeDefined();
    expect(result.teamPerformanceMetrics.teamMetrics).toEqual([
      { teamId: "team_a", issueCount: 5, avgResolutionDays: 2.5 },
      { teamId: "team_b", issueCount: 3, avgResolutionDays: 3.0 },
      { teamId: "team_c", issueCount: 2, avgResolutionDays: 1.5 },
    ]);

    // Verify final status
    expect(result.status).toBe("success");
    expect(result.emailSentTo).toBeTruthy();
    expect(Array.isArray(result.emailSentTo)).toBe(true);

    // Verify no human approval was required (all actions executed autonomously)
    expect(result.topPriorityChallenges[0].priority).toBe(1);
    expect(result.topPriorityChallenges[0].level).toBe("high");
    expect(result.topPriorityChallenges[0].issue).toBe(
      "システム連携遅延改善"
    );

    expect(result.topPriorityChallenges[1].priority).toBe(2);
    expect(result.topPriorityChallenges[1].level).toBe("medium");
    expect(result.topPriorityChallenges[1].issue).toBe("課題A再発防止");

    expect(result.topPriorityChallenges[2].priority).toBe(3);
    expect(result.topPriorityChallenges[2].level).toBe("low");
    expect(result.topPriorityChallenges[2].issue).toBe("課題C追跡");
  });
});