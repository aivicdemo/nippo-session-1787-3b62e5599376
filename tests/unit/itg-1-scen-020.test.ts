import { runTx7Imp1Agent, type Tx7Imp1AiClient } from "../../src/agents/tx-7-imp-1/orchestrator";
import type {
  Tx7AgentInput,
  Tx7AgentOutput,
  MonthlyAnalysisResult,
  PrioritizedIssue,
} from "../../src/agents/tx-7-imp-1/orchestrator";

describe("Tx7Imp1Agent - Monthly Report Generation", () => {
  test("SCEN-020: runTx7Imp1Agent processes valid monthly report generation request and returns complete analysis result", async () => {
    // Prepare representative valid input for monthly report generation
    const input: Tx7AgentInput = {
      aggregationPeriodStart: new Date("2024-01-01T00:00:00Z"),
      aggregationPeriodEnd: new Date("2024-01-31T23:59:59Z"),
      targetTeamIds: ["team-001", "team-002"],
      reportOutputFormat: "日報サマリー",
      managerUserId: "manager-001",
    };

    // Mock aggregateReportsByPeriod to return complete daily report dataset
    const mockReportData = [
      {
        reportDate: "2024-01-15",
        employeeId: "emp-001",
        employeeName: "田中太郎",
        yesterday: "ユーザー認証機能の実装完了",
        today: "テストコード作成開始",
        issue: "データベース接続タイムアウト",
        submittedAt: "2024-01-15T08:00:00Z",
      },
      {
        reportDate: "2024-01-15",
        employeeId: "emp-002",
        employeeName: "佐藤花子",
        yesterday: "APIドキュメント作成",
        today: "レビューコメント対応",
        issue: "テスト環境不安定",
        submittedAt: "2024-01-15T08:15:00Z",
      },
      {
        reportDate: "2024-01-22",
        employeeId: "emp-001",
        employeeName: "田中太郎",
        yesterday: "テストコード作成完了",
        today: "本番環境デプロイ準備",
        issue: "ビルドエラー",
        submittedAt: "2024-01-22T08:10:00Z",
      },
      {
        reportDate: "2024-01-22",
        employeeId: "emp-002",
        employeeName: "佐藤花子",
        yesterday: "レビューコメント対応完了",
        today: "次タスク着手",
        issue: "ドキュメント更新遅延",
        submittedAt: "2024-01-22T08:20:00Z",
      },
      {
        reportDate: "2024-01-29",
        employeeId: "emp-001",
        employeeName: "田中太郎",
        yesterday: "本番環境デプロイ完了",
        today: "本番監視",
        issue: "パフォーマンス低下",
        submittedAt: "2024-01-29T08:05:00Z",
      },
      {
        reportDate: "2024-01-29",
        employeeId: "emp-002",
        employeeName: "佐藤花子",
        yesterday: "次タスク着手",
        today: "ユーザー対応",
        issue: "データベース接続タイムアウト",
        submittedAt: "2024-01-29T08:25:00Z",
      },
    ];

    // Mock MonthlyAnalysisResult with time series change, bottleneck progression, and team metrics
    const mockAnalysisResult: MonthlyAnalysisResult = {
      issueTimeSeriesChange: [
        {
          weekNumber: 1,
          issueName: "データベース接続タイムアウト",
          occurrenceCount: 1,
          resolutionRate: 0,
        },
        {
          weekNumber: 1,
          issueName: "テスト環境不安定",
          occurrenceCount: 1,
          resolutionRate: 0,
        },
        {
          weekNumber: 2,
          issueName: "ビルドエラー",
          occurrenceCount: 1,
          resolutionRate: 0.5,
        },
        {
          weekNumber: 2,
          issueName: "ドキュメント更新遅延",
          occurrenceCount: 1,
          resolutionRate: 0.3,
        },
        {
          weekNumber: 3,
          issueName: "パフォーマンス低下",
          occurrenceCount: 1,
          resolutionRate: 0.2,
        },
        {
          weekNumber: 3,
          issueName: "データベース接続タイムアウト",
          occurrenceCount: 1,
          resolutionRate: 0.4,
        },
      ],
      bottleneckProgression: [
        {
          period: "Week1",
          mainBottleneck: "インフラ整備不足",
          changePattern: "新規発生",
          severity: 7,
        },
        {
          period: "Week2",
          mainBottleneck: "ビルドプロセス不安定",
          changePattern: "拡大",
          severity: 6,
        },
        {
          period: "Week3",
          mainBottleneck: "パフォーマンス対応",
          changePattern: "変化",
          severity: 5,
        },
      ],
      teamPerformanceMetrics: [
        {
          teamId: "team-001",
          teamName: "開発チーム1",
          reportSubmissionRate: 100,
          averageIssueResolutionDays: 3.5,
          issueResolutionRate: 45,
          productivityScore: 78,
        },
        {
          teamId: "team-002",
          teamName: "開発チーム2",
          reportSubmissionRate: 100,
          averageIssueResolutionDays: 4.2,
          issueResolutionRate: 38,
          productivityScore: 72,
        },
      ],
    };

    // Mock PrioritizedIssue array ranked by priority score
    const mockPrioritizedIssues: PrioritizedIssue[] = [
      {
        issueKeyword: "データベース接続タイムアウト",
        frequency: 2,
        impactScore: 85,
        priorityScore: 82,
        affectedMembers: ["emp-001", "emp-002"],
      },
      {
        issueKeyword: "パフォーマンス低下",
        frequency: 1,
        impactScore: 72,
        priorityScore: 68,
        affectedMembers: ["emp-001"],
      },
      {
        issueKeyword: "ビルドエラー",
        frequency: 1,
        impactScore: 68,
        priorityScore: 64,
        affectedMembers: ["emp-001"],
      },
      {
        issueKeyword: "ドキュメント更新遅延",
        frequency: 1,
        impactScore: 55,
        priorityScore: 52,
        affectedMembers: ["emp-002"],
      },
      {
        issueKeyword: "テスト環境不安定",
        frequency: 1,
        impactScore: 60,
        priorityScore: 48,
        affectedMembers: ["emp-002"],
      },
    ];

    // Create mock AI client interface
    const mockAiClient = {
      aggregateReportsByPeriod: jest
        .fn()
        .mockResolvedValue(mockReportData),
      generateMonthlyAnalysisReport: jest
        .fn()
        .mockResolvedValue(mockAnalysisResult),
      validateReportQuality: jest
        .fn()
        .mockResolvedValue({ reportValidationStatus: "approved" }),
      generateAndSendManagerConfirmationEmail: jest
        .fn()
        .mockResolvedValue({ confirmationEmailSent: true }),
      extractAndRankIssueKeywords: jest
        .fn()
        .mockResolvedValue(mockPrioritizedIssues),
    };

    // Call runTx7Imp1Agent with prepared input
    const result = await runTx7Imp1Agent(input, mockAiClient as any);

    // Verify Tx7AgentOutput object meets specification
    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe("string");
    expect(result.reportId.length).toBeGreaterThan(0);

    expect(result.analysisResult).toBeDefined();
    expect(result.analysisResult.issueTimeSeriesChange).toBeDefined();
    expect(Array.isArray(result.analysisResult.issueTimeSeriesChange)).toBe(
      true
    );
    expect(result.analysisResult.issueTimeSeriesChange.length).toBeGreaterThan(
      0
    );

    expect(result.analysisResult.bottleneckProgression).toBeDefined();
    expect(
      Array.isArray(result.analysisResult.bottleneckProgression)
    ).toBe(true);
    expect(
      result.analysisResult.bottleneckProgression.length
    ).toBeGreaterThan(0);

    expect(result.analysisResult.teamPerformanceMetrics).toBeDefined();
    expect(
      Array.isArray(result.analysisResult.teamPerformanceMetrics)
    ).toBe(true);
    expect(result.analysisResult.teamPerformanceMetrics.length).toBe(2);

    expect(result.prioritizedIssueList).toBeDefined();
    expect(Array.isArray(result.prioritizedIssueList)).toBe(true);
    expect(result.prioritizedIssueList.length).toBeGreaterThan(0);

    // Verify prioritized issues are sorted by priority score descending
    for (let i = 0; i < result.prioritizedIssueList.length - 1; i++) {
      expect(result.prioritizedIssueList[i].priorityScore).toBeGreaterThanOrEqual(
        result.prioritizedIssueList[i + 1].priorityScore
      );
    }

    expect(result.reportValidationStatus).toBe("approved");
    expect(result.confirmationEmailSent).toBe(true);

    // Verify mock functions were called with correct parameters
    expect(mockAiClient.aggregateReportsByPeriod).toHaveBeenCalledWith(
      input.aggregationPeriodStart,
      input.aggregationPeriodEnd,
      input.targetTeamIds
    );

    expect(mockAiClient.generateMonthlyAnalysisReport).toHaveBeenCalled();
    expect(mockAiClient.validateReportQuality).toHaveBeenCalled();
    expect(
      mockAiClient.generateAndSendManagerConfirmationEmail
    ).toHaveBeenCalledWith(expect.objectContaining({ userId: input.managerUserId }));
  });
});