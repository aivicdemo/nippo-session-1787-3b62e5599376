import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import type { Tx3Imp1AiClient } from "../../src/agents/tx-3-imp-1/types";
import { generateWeeklyAnalysisReport } from "../../src/logic/analysis-reporting";

describe("generateWeeklyAnalysisReport", () => {
  let mockAiClient: jest.Mocked<Tx3Imp1AiClient>;
  let auditLogs: Array<{ event: string; timestamp: string }>;

  beforeEach(() => {
    auditLogs = [];

    mockAiClient = {
      action01ExtractKeywords: jest.fn(),
      action02ClassifyIssues: jest.fn(),
      action03DeterminePriority: jest.fn(),
      action04GenerateList: jest.fn(),
      action05SendEmail: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-065: エスカレーション条件（経営層への報告が必要な重大課題）を検出したとき、
  // 副作用確定前に人へ引き継ぎ、escalated=true, pending_actions=['action-04', 'action-05']を返す
  test("should escalate and halt before side effects when critical executive-level issue is detected", async () => {
    const aggregatedReports = [
      {
        reportId: "report-001",
        memberId: "member-001",
        date: "2024-01-15",
        content: "システム全体が停止するリスクが判明した。顧客対応が急務。",
        issues: [],
      },
      {
        reportId: "report-002",
        memberId: "member-002",
        date: "2024-01-15",
        content: "通常の進捗報告です。",
        issues: [],
      },
    ];

    // Action 1: 課題キーワード抽出
    mockAiClient.action01ExtractKeywords.mockResolvedValueOnce({
      success: true,
      keywords: [
        {
          keyword: "system_outage_risk",
          severity: "critical",
          reportIds: ["report-001"],
        },
        {
          keyword: "customer_impact",
          severity: "critical",
          reportIds: ["report-001"],
        },
      ],
    });

    // Action 2: カテゴリ分類
    mockAiClient.action02ClassifyIssues.mockResolvedValueOnce({
      success: true,
      classified: [
        {
          keywordId: "kw-001",
          keyword: "system_outage_risk",
          category: "infrastructure",
          subcategory: "critical_incident",
        },
        {
          keywordId: "kw-002",
          keyword: "customer_impact",
          category: "business",
          subcategory: "escalation_required",
        },
      ],
    });

    // Action 3: 優先度判定 - 重大課題として検出
    mockAiClient.action03DeterminePriority.mockResolvedValueOnce({
      success: true,
      priorityAssignments: [
        {
          keywordId: "kw-001",
          priority: "critical",
          urgency: "immediate",
          requiresExecutiveReview: true,
          escalationReason: "critical_executive_report",
        },
        {
          keywordId: "kw-002",
          priority: "critical",
          urgency: "immediate",
          requiresExecutiveReview: true,
          escalationReason: "critical_executive_report",
        },
      ],
      escalationDetected: true,
    });

    // Action 4 と Action 5 は呼ばれないはず
    mockAiClient.action04GenerateList.mockResolvedValueOnce({
      success: false,
      error: "escalation_halted",
    });

    mockAiClient.action05SendEmail.mockResolvedValueOnce({
      success: false,
      error: "escalation_halted",
    });

    // 監査ログ記録用の関数を注入（実装側で呼ばれることを期待）
    const recordAuditLog = (event: string) => {
      auditLogs.push({
        event,
        timestamp: new Date("2024-01-15T11:00:00Z").toISOString(),
      });
    };

    // orchestrator関数を実行
    const result = await generateWeeklyAnalysisReport(
      aggregatedReports,
      mockAiClient,
      recordAuditLog
    );

    // 検証 1: Action 1 は実行されたこと
    expect(mockAiClient.action01ExtractKeywords).toHaveBeenCalledTimes(1);
    expect(mockAiClient.action01ExtractKeywords).toHaveBeenCalledWith({
      reports: aggregatedReports,
    });

    // 検証 2: Action 2 は実行されたこと
    expect(mockAiClient.action02ClassifyIssues).toHaveBeenCalledTimes(1);

    // 検証 3: Action 3 は実行されたこと
    expect(mockAiClient.action03DeterminePriority).toHaveBeenCalledTimes(1);

    // 検証 4: Action 4（一覧生成）は呼ばれないこと
    expect(mockAiClient.action04GenerateList).not.toHaveBeenCalled();

    // 検証 5: Action 5（メール送信）は呼ばれないこと
    expect(mockAiClient.action05SendEmail).not.toHaveBeenCalled();

    // 検証 6: エスカレーション状態オブジェクトが返される
    expect(result).toEqual({
      escalated: true,
      escalationReason: "critical_executive_report",
      managerHandoffRequired: true,
      escalationTimestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      pendingActions: ["action-04", "action-05"],
      detectedIssues: [
        {
          keywordId: "kw-001",
          keyword: "system_outage_risk",
          priority: "critical",
          urgency: "immediate",
          requiresExecutiveReview: true,
        },
        {
          keywordId: "kw-002",
          keyword: "customer_impact",
          priority: "critical",
          urgency: "immediate",
          requiresExecutiveReview: true,
        },
      ],
    });

    // 検証 7: 監査ログに ESCALATION_TRIGGERED イベントが記録されていること
    expect(auditLogs).toContainEqual({
      event: "ESCALATION_TRIGGERED: CRITICAL_ISSUE_REQUIRES_HUMAN_REVIEW",
      timestamp: "2024-01-15T11:00:00Z",
    });

    // 検証 8: escalated が true であること
    expect(result.escalated).toBe(true);

    // 検証 9: managerHandoffRequired が true であること
    expect(result.managerHandoffRequired).toBe(true);

    // 検証 10: pendingActions に action-04 と action-05 が含まれていること
    expect(result.pendingActions).toContain("action-04");
    expect(result.pendingActions).toContain("action-05");
    expect(result.pendingActions.length).toBe(2);
  });
});