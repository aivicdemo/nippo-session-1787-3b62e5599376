import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { runTx8Imp1Agent } from "../../src/agents/tx-8-imp-1/orchestrator";
import {
  buildAction01Prompt,
  ACTION_01_PROMPT_VERSION,
} from "../../src/agents/tx-8-imp-1/prompts/action-01";
import {
  buildAction02Prompt,
  ACTION_02_PROMPT_VERSION,
} from "../../src/agents/tx-8-imp-1/prompts/action-02";
import {
  buildAction03Prompt,
  ACTION_03_PROMPT_VERSION,
} from "../../src/agents/tx-8-imp-1/prompts/action-03";
import {
  buildAction04Prompt,
  ACTION_04_PROMPT_VERSION,
} from "../../src/agents/tx-8-imp-1/prompts/action-04";
import {
  buildAction05Prompt,
  ACTION_05_PROMPT_VERSION,
} from "../../src/agents/tx-8-imp-1/prompts/action-05";

describe("Tx8Imp1Agent - 課題検索から可視化レポート作成までの自動実行", () => {
  test("SCEN-3203: 朝会報告管理システムから課題データを抽出し、再発パターンを時系列分析して可視化レポートを自動生成する", async () => {
    const mockReportId = "report-20240115-001";
    const analysisStartDate = "2023-12-16";
    const analysisEndDate = "2024-01-15";
    const teamIds = ["team-001", "team-002"];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = "manager-001";

    const mockIssueDataset = [
      {
        issueId: "issue-001",
        reportDate: "2024-01-15T09:00:00Z",
        title: "データベース接続タイムアウト",
        status: "open",
      },
      {
        issueId: "issue-002",
        reportDate: "2024-01-12T10:30:00Z",
        title: "データベース接続タイムアウト",
        status: "open",
      },
      {
        issueId: "issue-003",
        reportDate: "2024-01-08T14:15:00Z",
        title: "データベース接続タイムアウト",
        status: "resolved",
      },
      {
        issueId: "issue-004",
        reportDate: "2024-01-14T11:00:00Z",
        title: "APIレスポンス遅延",
        status: "open",
      },
      {
        issueId: "issue-005",
        reportDate: "2024-01-10T16:45:00Z",
        title: "APIレスポンス遅延",
        status: "open",
      },
      {
        issueId: "issue-006",
        reportDate: "2024-01-05T08:30:00Z",
        title: "テストケース不足",
        status: "open",
      },
    ];

    const mockAiClientOutput = {
      action01ExtractedData: {
        issueCount: 6,
        periodCovered: {
          startDate: analysisStartDate,
          endDate: analysisEndDate,
        },
        categorizedIssues: [
          {
            category: "infrastructure",
            issues: ["issue-001", "issue-002", "issue-003"],
            count: 3,
          },
          {
            category: "performance",
            issues: ["issue-004", "issue-005"],
            count: 2,
          },
          {
            category: "quality",
            issues: ["issue-006"],
            count: 1,
          },
        ],
      },
      action02TimeSeriesAnalysis: {
        patterns: [
          {
            patternId: "pattern-001",
            patternName: "データベース接続タイムアウト",
            occurrences: [
              "2024-01-15T09:00:00Z",
              "2024-01-12T10:30:00Z",
              "2024-01-08T14:15:00Z",
            ],
            occurrenceCount: 3,
            timeSeriesPattern: "increasing_trend",
          },
          {
            patternId: "pattern-002",
            patternName: "APIレスポンス遅延",
            occurrences: [
              "2024-01-14T11:00:00Z",
              "2024-01-10T16:45:00Z",
            ],
            occurrenceCount: 2,
            timeSeriesPattern: "periodic",
          },
          {
            patternId: "pattern-003",
            patternName: "テストケース不足",
            occurrences: ["2024-01-05T08:30:00Z"],
            occurrenceCount: 1,
            timeSeriesPattern: "isolated",
          },
        ],
      },
      action03BottleneckAnalysis: {
        bottlenecks: [
          {
            changeId: "bottleneck-001",
            changeDescription:
              "データベース接続プールの枯渇によるタイムアウト連鎖",
            severity: "high",
            impactScore: 85,
            affectedPeriods: [
              {
                startDate: "2024-01-08",
                endDate: "2024-01-15",
              },
            ],
          },
          {
            changeId: "bottleneck-002",
            changeDescription:
              "APIエンドポイント負荷集中に伴うレスポンス遅延",
            severity: "medium",
            impactScore: 62,
            affectedPeriods: [
              {
                startDate: "2024-01-10",
                endDate: "2024-01-14",
              },
            ],
          },
        ],
      },
      action04VisualizationGraphs: [
        {
          graphType: "line",
          title: "データベース接続タイムアウト - 発生頻度の時系列推移",
          dataPoints: [
            { date: "2024-01-08", count: 1, severity: "high" },
            { date: "2024-01-10", count: 0, severity: "low" },
            { date: "2024-01-12", count: 1, severity: "high" },
            { date: "2024-01-15", count: 1, severity: "critical" },
          ],
        },
        {
          graphType: "bar",
          title: "課題カテゴリ別発生件数",
          dataPoints: [
            { category: "infrastructure", count: 3 },
            { category: "performance", count: 2 },
            { category: "quality", count: 1 },
          ],
        },
        {
          graphType: "heatmap",
          title: "曜日別・時間帯別の課題発生パターン",
          dataPoints: [
            { day: "Monday", hour: 9, intensity: 0.8 },
            { day: "Friday", hour: 11, intensity: 0.9 },
            { day: "Wednesday", hour: 16, intensity: 0.6 },
          ],
        },
      ],
      action05PrioritizedIssues: [
        {
          issueId: "issue-001",
          title: "データベース接続タイムアウト",
          priority: 1,
          priorityScore: 92,
          emphasis: true,
          recommendedAction: "接続プール増設と監視アラート導入",
        },
        {
          issueId: "issue-004",
          title: "APIレスポンス遅延",
          priority: 2,
          priorityScore: 68,
          emphasis: true,
          recommendedAction: "キャッシング戦略の導入",
        },
        {
          issueId: "issue-006",
          title: "テストケース不足",
          priority: 3,
          priorityScore: 35,
          emphasis: false,
          recommendedAction: "テスト自動化フレームワークの整備",
        },
      ],
    };

    const mockTx8Imp1AiClient = {
      callAction01ExtractIssues: jest.fn(async () => ({
        promptVersion: ACTION_01_PROMPT_VERSION,
        output: mockAiClientOutput.action01ExtractedData,
      })),
      callAction02AnalyzeTimeSeries: jest.fn(async () => ({
        promptVersion: ACTION_02_PROMPT_VERSION,
        output: mockAiClientOutput.action02TimeSeriesAnalysis,
      })),
      callAction03IdentifyBottlenecks: jest.fn(async () => ({
        promptVersion: ACTION_03_PROMPT_VERSION,
        output: mockAiClientOutput.action03BottleneckAnalysis,
      })),
      callAction04GenerateGraphs: jest.fn(async () => ({
        promptVersion: ACTION_04_PROMPT_VERSION,
        output: mockAiClientOutput.action04VisualizationGraphs,
      })),
      callAction05ExtractPriorities: jest.fn(async () => ({
        promptVersion: ACTION_05_PROMPT_VERSION,
        output: mockAiClientOutput.action05PrioritizedIssues,
      })),
    };

    const agentInput = {
      analysisStartDate,
      analysisEndDate,
      teamIds,
      minimumRecurrenceThreshold,
      recipientManagerId,
    };

    const result = await runTx8Imp1Agent(agentInput, mockTx8Imp1AiClient);

    expect(result).toBeDefined();
    expect(result.reportId).toBe(mockReportId);
    expect(result.recurringIssuePatterns).toBeDefined();
    expect(Array.isArray(result.recurringIssuePatterns)).toBe(true);
    expect(result.recurringIssuePatterns.length).toBeGreaterThanOrEqual(3);

    expect(result.recurringIssuePatterns[0]).toMatchObject({
      issueKeyword: "データベース接続タイムアウト",
      occurrenceCount: 3,
      timeSeriesPattern: "increasing_trend",
      priorityScore: expect.any(Number),
    });
    expect(result.recurringIssuePatterns[0].priorityScore).toBeGreaterThanOrEqual(
      0
    );
    expect(result.recurringIssuePatterns[0].priorityScore).toBeLessThanOrEqual(
      100
    );

    expect(result.recurringIssuePatterns[1]).toMatchObject({
      issueKeyword: "APIレスポンス遅延",
      occurrenceCount: 2,
      timeSeriesPattern: "periodic",
    });

    expect(result.visualizationGraphs).toBeDefined();
    expect(Array.isArray(result.visualizationGraphs)).toBe(true);
    expect(result.visualizationGraphs.length).toBeGreaterThan(0);

    expect(result.visualizationGraphs[0]).toMatchObject({
      graphType: expect.any(String),
      title: expect.any(String),
      dataPoints: expect.any(Array),
    });
    expect(
      ["line", "bar", "heatmap"].includes(result.visualizationGraphs[0].graphType)
    ).toBe(true);

    expect(result.emailSentAt).toBeDefined();
    const emailSentDate = new Date(result.emailSentAt);
    expect(emailSentDate.getTime()).toBeGreaterThan(0);

    expect(mockTx8Imp1AiClient.callAction01ExtractIssues).toHaveBeenCalledTimes(
      1
    );
    expect(mockTx8Imp1AiClient.callAction02AnalyzeTimeSeries).toHaveBeenCalledTimes(
      1
    );
    expect(mockTx8Imp1AiClient.callAction03IdentifyBottlenecks).toHaveBeenCalledTimes(
      1
    );
    expect(mockTx8Imp1AiClient.callAction04GenerateGraphs).toHaveBeenCalledTimes(
      1
    );
    expect(mockTx8Imp1AiClient.callAction05ExtractPriorities).toHaveBeenCalledTimes(
      1
    );
  });
});