import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { generateWeeklyAnalysisReport } from "../../src/logic/analysis-reporting";

describe("generateWeeklyAnalysisReport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  // SCEN-107
  test("should collect weekly report data from previous week on Monday morning and apply privacy protection", async () => {
    const mondayMorning = new Date("2024-01-08T08:00:00+09:00");
    jest.setSystemTime(mondayMorning);

    const mockReportData = [
      {
        id: "report_001",
        memberId: "member_001",
        memberName: "田中太郎",
        memberEmail: "tanaka.taro@company.com",
        reportDate: "2024-01-01",
        content: "実績: 機能A完成",
        issue: "データベース接続エラー",
        issuePriority: "high",
        submittedAt: "2024-01-01T08:30:00Z",
      },
      {
        id: "report_002",
        memberId: "member_002",
        memberName: "佐藤花子",
        memberEmail: "sato.hanako@company.com",
        reportDate: "2024-01-01",
        content: "実績: テストケース50件作成",
        issue: "APIレイテンシ増加",
        issuePriority: "medium",
        submittedAt: "2024-01-01T09:00:00Z",
      },
      {
        id: "report_003",
        memberId: "member_001",
        memberName: "田中太郎",
        memberEmail: "tanaka.taro@company.com",
        reportDate: "2024-01-02",
        content: "実績: バグ修正5件",
        issue: null,
        issuePriority: null,
        submittedAt: "2024-01-02T08:45:00Z",
      },
      {
        id: "report_004",
        memberId: "member_003",
        memberName: "鈴木次郎",
        memberEmail: "suzuki.jiro@company.com",
        reportDate: "2024-01-02",
        content: "実績: ドキュメント作成",
        issue: "要件定義ドキュメント不完全",
        issuePriority: "low",
        submittedAt: "2024-01-02T08:15:00Z",
      },
      {
        id: "report_005",
        memberId: "member_002",
        memberName: "佐藤花子",
        memberEmail: "sato.hanako@company.com",
        reportDate: "2024-01-03",
        content: "実績: レビュー10件完了",
        issue: "コードレビュー指摘多数",
        issuePriority: "medium",
        submittedAt: "2024-01-03T09:20:00Z",
      },
      {
        id: "report_006",
        memberId: "member_001",
        memberName: "田中太郎",
        memberEmail: "tanaka.taro@company.com",
        reportDate: "2024-01-04",
        content: "実績: パフォーマンス最適化",
        issue: null,
        issuePriority: null,
        submittedAt: "2024-01-04T08:30:00Z",
      },
      {
        id: "report_007",
        memberId: "member_004",
        memberName: "山田四郎",
        memberEmail: "yamada.shiro@company.com",
        reportDate: "2024-01-04",
        content: "実績: インフラ構築",
        issue: "ネットワーク構成の見直し必要",
        issuePriority: "high",
        submittedAt: "2024-01-04T09:00:00Z",
      },
      {
        id: "report_008",
        memberId: "member_003",
        memberName: "鈴木次郎",
        memberEmail: "suzuki.jiro@company.com",
        reportDate: "2024-01-05",
        content: "実績: 設計レビュー実施",
        issue: "マイクロサービス設計課題",
        issuePriority: "high",
        submittedAt: "2024-01-05T08:45:00Z",
      },
      {
        id: "report_009",
        memberId: "member_002",
        memberName: "佐藤花子",
        memberEmail: "sato.hanako@company.com",
        reportDate: "2024-01-05",
        content: "実績: 統合テスト開始",
        issue: null,
        issuePriority: null,
        submittedAt: "2024-01-05T08:50:00Z",
      },
      {
        id: "report_010",
        memberId: "member_001",
        memberName: "田中太郎",
        memberEmail: "tanaka.taro@company.com",
        reportDate: "2024-01-07",
        content: "実績: 本番環境デプロイ",
        issue: "デプロイ後ログエラー検出",
        issuePriority: "high",
        submittedAt: "2024-01-07T17:30:00Z",
      },
    ];

    const mockFetch = jest.fn();
    global.fetch = mockFetch;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: mockReportData }),
    } as Response);

    const result = await generateWeeklyAnalysisReport({
      reportSystemApiUrl: "https://api.report.company.com",
      privacyProtectionEnabled: true,
      analysisWeekStartDate: "2024-01-01",
      analysisWeekEndDate: "2024-01-07",
    });

    expect(result).toBeDefined();
    expect(result.collectedRecordsCount).toBe(10);
    expect(result.weekStartDate).toBe("2024-01-01");
    expect(result.weekEndDate).toBe("2024-01-07");
    expect(result.privacyProtectionApplied).toBe(true);

    expect(result.processedReports).toHaveLength(10);

    const firstReport = result.processedReports[0];
    expect(firstReport.id).toBe("report_001");
    expect(firstReport.memberId).toBe("member_001");
    expect(firstReport.memberNameMasked).toBe("田****");
    expect(firstReport.memberEmailMasked).toBe("tanaka.****@company.com");
    expect(firstReport.reportDate).toBe("2024-01-01");

    const extractedIssues = result.processedReports.filter((r) => r.issue !== null);
    expect(extractedIssues.length).toBeGreaterThan(0);

    const highPriorityIssues = result.processedReports.filter(
      (r) => r.issuePriority === "high"
    );
    expect(highPriorityIssues.length).toBeGreaterThan(0);

    expect(result.autonomousActionLog).toBeDefined();
    expect(result.autonomousActionLog).toContain("AUTONOMOUS_ACTION_01_EXECUTED");
    expect(result.autonomousActionLog).toContain("2024-01-01");
    expect(result.autonomousActionLog).toContain("2024-01-07");
    expect(result.autonomousActionLog).toContain("records_count=10");
    expect(result.autonomousActionLog).toContain("privacy_protection_applied=true");

    global.fetch = undefined as any;
  });
});