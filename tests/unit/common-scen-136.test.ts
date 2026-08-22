import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx7Imp1Agent } from "../../src/agents/tx-7-imp-1/orchestrator";
import type {
  Tx7Imp1AiClient,
  Tx7Imp1AgentContext,
  Tx7Imp1EscalationRecord,
} from "../../src/agents/tx-7-imp-1/orchestrator";

describe("tx-7-imp-1: 月次レポート生成から分析完了までの自動実行", () => {
  let mockAiClient: Tx7Imp1AiClient;
  let mockAuditLog: Array<{ event: string; timestamp: Date; details: unknown }>;
  let mockEmailSent: Array<{
    recipient: string;
    subject: string;
    body: string;
  }>;
  let mockDbStateChanges: Array<{
    reportId: string;
    previousState: string;
    newState: string;
  }>;

  beforeEach(() => {
    mockAuditLog = [];
    mockEmailSent = [];
    mockDbStateChanges = [];

    mockAiClient = {
      action01_collectMonthlyReportData: jest.fn(async () => ({
        reportId: "report-2024-01-001",
        targetMonth: "2024-01",
        teamId: "team-eng-001",
        collectedReportCount: 45,
        timestamp: new Date("2024-02-01T00:00:00Z"),
      })),

      action02_identifyUnsubmittedMembers: jest.fn(async () => ({
        unsubmittedCount: 2,
        unsubmittedMembers: [
          { memberId: "mem-005", name: "田中太郎" },
          { memberId: "mem-012", name: "佐藤花子" },
        ],
      })),

      action03_extractAndClassifyChallenges: jest.fn(async () => ({
        challengesExtracted: 18,
        categorizedChallenges: [
          {
            category: "bug",
            count: 8,
            examples: [
              "ログイン画面でのセッションタイムアウト",
              "データベース接続エラー",
            ],
          },
          {
            category: "performance",
            count: 5,
            examples: [
              "API応答時間が3秒超過",
              "UI レンダリング遅延",
            ],
          },
          {
            category: "spec_change",
            count: 5,
            examples: [
              "要件変更による実装修正",
              "仕様確認待ち",
            ],
          },
        ],
      })),

      action04_analyzeTimeSeriesTrend: jest.fn(async () => ({
        dailyBottleneckMetrics: [
          {
            date: "2024-01-01",
            bottleneckSeverity: 2,
            activeChallengeCount: 3,
          },
          {
            date: "2024-01-15",
            bottleneckSeverity: 4,
            activeChallengeCount: 7,
          },
          {
            date: "2024-01-31",
            bottleneckSeverity: 2,
            activeChallengeCount: 4,
          },
        ],
        improvementTrend: "stable",
      })),

      action05_computeBottleneckShift: jest.fn(async () => ({
        bottleneckShiftAnalysis: {
          peakDate: "2024-01-15",
          peakSeverity: 4,
          primaryBottleneck: "spec_change",
          secondaryBottleneck: "performance",
        },
        recurringIssuePattern: [
          "データベース接続問題",
          "API タイムアウト",
        ],
      })),

      action06_calculateTeamPerformanceMetrics: jest.fn(async () => ({
        teamMetrics: {
          teamId: "team-eng-001",
          avgResolutionDays: 3.2,
          reportSubmissionRate: 0.956,
          challengeRecurrenceRate: 0.12,
          teamSize: 18,
        },
      })),

      action07_assignPriorityAndCompileResults: jest.fn(async () => ({
        prioritizedChallenges: [
          {
            rank: 1,
            category: "security_vulnerability",
            title: "SQLインジェクション脆弱性検出",
            severity: "critical",
            frequency: 1,
            firstDetectedDate: "2024-01-28",
          },
          {
            rank: 2,
            category: "bug",
            title: "ログイン画面セッション問題",
            severity: "high",
            frequency: 3,
          },
          {
            rank: 3,
            category: "performance",
            title: "API応答時間超過",
            severity: "medium",
            frequency: 5,
          },
        ],
        newCategoryDetected: "security_vulnerability",
        compiledResultsPartial: {
          timeSeriesData: [
            {
              date: "2024-01-01",
              bottleneckSeverity: 2,
              activeChallengeCount: 3,
            },
            {
              date: "2024-01-15",
              bottleneckSeverity: 4,
              activeChallengeCount: 7,
            },
            {
              date: "2024-01-31",
              bottleneckSeverity: 2,
              activeChallengeCount: 4,
            },
          ],
          improvementTrend: "stable",
          recurringIssuePattern: [
            "データベース接続問題",
            "API タイムアウト",
          ],
        },
      })),

      action08_presentAnalysisReportToManager: jest.fn(
        async () => {
          throw new Error(
            "ESCALATION: Action 8 execution blocked due to new category detection"
          );
        }
      ),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-136
  test("新規課題カテゴリ検出時にエスカレーション処理を実行し、副作用確定前に人へ引き継ぐ", async () => {
    const context: Tx7Imp1AgentContext = {
      reportId: "report-2024-01-001",
      targetMonth: "2024-01",
      teamId: "team-eng-001",
      triggeredBy: "schedule",
      includeDetailedAnalysis: true,
      managerEmail: "manager@company.com",
      auditLogFn: (event: string, details: unknown) => {
        mockAuditLog.push({
          event,
          timestamp: new Date(),
          details,
        });
      },
      emailNotifyFn: (recipient: string, subject: string, body: string) => {
        mockEmailSent.push({ recipient, subject, body });
      },
      dbStateChangeFn: (
        reportId: string,
        previousState: string,
        newState: string
      ) => {
        mockDbStateChanges.push({ reportId, previousState, newState });
      },
    };

    let escalationRecord: Tx7Imp1EscalationRecord | null = null;
    let agentError: Error | null = null;

    try {
      escalationRecord = await runTx7Imp1Agent(context, mockAiClient);
    } catch (error) {
      agentError = error as Error;
    }

    // Action 1-6 は正常に実行されたことを確認
    expect(mockAiClient.action01_collectMonthlyReportData).toHaveBeenCalled();
    expect(mockAiClient.action02_identifyUnsubmittedMembers).toHaveBeenCalled();
    expect(mockAiClient.action03_extractAndClassifyChallenges).toHaveBeenCalled();
    expect(mockAiClient.action04_analyzeTimeSeriesTrend).toHaveBeenCalled();
    expect(mockAiClient.action05_computeBottleneckShift).toHaveBeenCalled();
    expect(mockAiClient.action06_calculateTeamPerformanceMetrics).toHaveBeenCalled();

    // Action 7 で新規カテゴリ検出を確認
    expect(mockAiClient.action07_assignPriorityAndCompileResults).toHaveBeenCalled();

    // Action 8 は実行されないことを確認（エスカレーション条件判定により）
    expect(mockAiClient.action08_presentAnalysisReportToManager).not.toHaveBeenCalled();

    // エスカレーションレコードが正しく生成されていることを確認
    expect(escalationRecord).not.toBeNull();
    if (escalationRecord) {
      expect(escalationRecord.escalation_type).toBe("new_category_detected");
      expect(escalationRecord.detected_category).toBe("security_vulnerability");
      expect(escalationRecord.status).toBe("awaiting_human_review");
      expect(escalationRecord.partial_results).toBeDefined();

      // partial_results に時系列変化、ボトルネック推移、チーム別パフォーマンス指標が含まれていることを確認
      const partialResults = escalationRecord.partial_results as Record<
        string,
        unknown
      >;
      expect(partialResults.timeSeriesData).toBeDefined();
      expect(partialResults.improvementTrend).toBe("stable");
      expect(partialResults.recurringIssuePattern).toBeDefined();
      expect(Array.isArray(partialResults.recurringIssuePattern)).toBe(true);
      expect((partialResults.recurringIssuePattern as string[]).length).toBeGreaterThan(0);
    }

    // 部長へ通知メールが送信されたことを確認
    expect(mockEmailSent.length).toBeGreaterThan(0);
    const managerNotification = mockEmailSent.find(
      (email) => email.recipient === "manager@company.com"
    );
    expect(managerNotification).toBeDefined();
    if (managerNotification) {
      expect(managerNotification.body).toMatch(/新規カテゴリ検出/);
      expect(managerNotification.body).toMatch(/分析結果確認待ち/);
    }

    // 監査ログに ESCALATION_TRIGGERED が記録されたことを確認
    const escalationLogEntry = mockAuditLog.find(
      (log) => log.event === "ESCALATION_TRIGGERED"
    );
    expect(escalationLogEntry).toBeDefined();
    if (escalationLogEntry) {
      expect(escalationLogEntry.details).toBeDefined();
      const details = escalationLogEntry.details as Record<string, unknown>;
      expect(details.escalation_type).toBe("new_category_detected");
      expect(details.detected_category).toBe("security_vulnerability");
    }

    // データベース状態が partial_analysis_completed_awaiting_review に変更されたことを確認
    const stateChange = mockDbStateChanges.find(
      (change) => change.reportId === "report-2024-01-001"
    );
    expect(stateChange).toBeDefined();
    if (stateChange) {
      expect(stateChange.newState).toBe("partial_analysis_completed_awaiting_review");
    }

    // Action 8 がスキップされたことを確認（副作用確定前に人へ引き継がれた）
    expect(agentError).toBeNull();
  });
});