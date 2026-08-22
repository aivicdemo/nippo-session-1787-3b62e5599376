import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { generateWeeklyAnalysisReport } from "../../src/logic/analysis-reporting";
import type {
  Tx6Imp1AiClient,
  WeeklyAnalysisReportInput,
  WeeklyAnalysisReportOutput,
} from "../../src/agents/tx-6-imp-1/types";

const fetchMock = require("jest-fetch-mock");

describe("generateWeeklyAnalysisReport", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-118: [error] AI出力が不正・曖昧・低確信度の場合、パイプラインを中断してエスカレーション制御を人へ委譲
  test("should reject malformed AI output and escalate to human review with audit log", async () => {
    // Arrange
    const mockAiClient: Tx6Imp1AiClient = {
      executeAction01GetWeeklyReports: async () => ({
        // (a) JSONスキーマ不適合: 必須フィールド欠落
        reportDataList: [
          {
            reportId: "RPT-20240113-001",
            memberId: "MEM-001",
            reportDate: "2024-01-08",
            // 必須フィールド 'reportContent' が欠落
            reportContent: undefined as any,
            isSubmitted: true,
          },
        ],
        totalReports: 1,
        submittedReports: 1,
        unsubmittedMembers: [],
        validationStatus: "partial_data",
        // (c) confidenceScore < 0.7 (不確信度が低い)
        confidenceScore: 0.65,
      }),
      executeAction02ExtractIssues: async () => ({
        issues: [],
        confidenceScore: 0.65,
      }),
      executeAction03ClassifyIssues: async () => ({
        classifiedIssues: [],
        confidenceScore: 0.65,
      }),
      executeAction04AnalyzeTrends: async () => ({
        trendAnalysis: {},
        confidenceScore: 0.65,
      }),
      executeAction05GenerateReport: async () => ({
        reportContent: "",
        confidenceScore: 0.65,
      }),
      executeAction06ValidateReport: async () => ({
        isValid: false,
        errors: ["Schema validation failed"],
        confidenceScore: 0.65,
      }),
      executeAction07DistributeReport: async () => ({
        distributionStatus: "pending",
        confidenceScore: 0.65,
      }),
    };

    const input: WeeklyAnalysisReportInput = {
      weekStartDate: "2024-01-08",
      weekEndDate: "2024-01-14",
      targetTeamId: "TEAM-001",
      triggerSource: "scheduled",
    };

    // Act
    const output: WeeklyAnalysisReportOutput = await generateWeeklyAnalysisReport(
      input,
      mockAiClient
    );

    // Assert

    // 1. パイプラインが中断されたことを確認（escalationFlag = true）
    expect(output.escalationFlag).toBe(true);

    // 2. エスカレーション理由が『分析結果に矛盾や異常値が含まれる場合』に該当
    expect(output.escalationReason).toMatch(/矛盾|異常値|スキーマ/i);

    // 3. 後続アクション（Action 2～7）が実行されていないことを確認
    // Action 2以降の実行結果が状態に反映されていない
    expect(output.trendAnalysisResult).toBeUndefined();
    expect(output.generatedReportContent).toBeUndefined();
    expect(output.distributionStatus).not.toBe("completed");

    // 4. 配信待ち状態に留まっていることを確認
    expect(output.pipelineStatus).toBe("pending_human_review");

    // 5. 監査ログに『AI出力検証失敗→エスカレーション』イベントが記録されていることを確認
    expect(output.auditEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: "AI_OUTPUT_VALIDATION_FAILED",
          action: "escalated_to_human_review",
          timestamp: expect.any(String),
          details: expect.objectContaining({
            failureReason: expect.stringMatching(
              /confidenceScore|schema|required_field/i
            ),
          }),
        }),
      ])
    );

    // 6. 日報配信待ちの状態であることを確認
    expect(output.readyForDistribution).toBe(false);
  });

  // SCEN-118: [error] 矛盾する課題分類が検出される場合、エスカレーション
  test("should detect contradictory issue classification and escalate", async () => {
    // Arrange
    const mockAiClient: Tx6Imp1AiClient = {
      executeAction01GetWeeklyReports: async () => ({
        reportDataList: [
          {
            reportId: "RPT-20240113-002",
            memberId: "MEM-002",
            reportDate: "2024-01-08",
            reportContent: "サーバーダウンが発生した",
            isSubmitted: true,
          },
        ],
        totalReports: 1,
        submittedReports: 1,
        unsubmittedMembers: [],
        validationStatus: "complete",
        confidenceScore: 0.95,
      }),
      executeAction02ExtractIssues: async () => ({
        issues: [
          {
            issueId: "ISSUE-001",
            title: "サーバーダウン",
            severity: "critical",
            extractedText: "サーバーダウンが発生した",
            sourceReportId: "RPT-20240113-002",
          },
        ],
        confidenceScore: 0.95,
      }),
      executeAction03ClassifyIssues: async () => ({
        // (d) 矛盾する課題分類: 同一課題に複数の矛盾するカテゴリを割り当て
        classifiedIssues: [
          {
            issueId: "ISSUE-001",
            category: "infrastructure",
            subcategory: "server",
            priority: "high",
            impactRange: "team",
          },
          {
            issueId: "ISSUE-001",
            category: "documentation",
            subcategory: "process",
            priority: "low",
            impactRange: "individual",
          },
        ],
        confidenceScore: 0.72,
      }),
      executeAction04AnalyzeTrends: async () => ({
        trendAnalysis: {},
        confidenceScore: 0.72,
      }),
      executeAction05GenerateReport: async () => ({
        reportContent: "",
        confidenceScore: 0.72,
      }),
      executeAction06ValidateReport: async () => ({
        isValid: false,
        errors: ["Contradictory classification detected"],
        confidenceScore: 0.72,
      }),
      executeAction07DistributeReport: async () => ({
        distributionStatus: "pending",
        confidenceScore: 0.72,
      }),
    };

    const input: WeeklyAnalysisReportInput = {
      weekStartDate: "2024-01-08",
      weekEndDate: "2024-01-14",
      targetTeamId: "TEAM-002",
      triggerSource: "manual",
    };

    // Act
    const output: WeeklyAnalysisReportOutput = await generateWeeklyAnalysisReport(
      input,
      mockAiClient
    );

    // Assert

    // 1. エスカレーションフラグが立つ
    expect(output.escalationFlag).toBe(true);

    // 2. エスカレーション理由に『矛盾』が含まれる
    expect(output.escalationReason).toMatch(/矛盾/);

    // 3. パイプラインが中断される
    expect(output.pipelineStatus).toBe("pending_human_review");

    // 4. 配信予定状態ではない
    expect(output.readyForDistribution).toBe(false);

    // 5. 監査ログが記録される
    expect(output.auditEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: "AI_OUTPUT_VALIDATION_FAILED",
        }),
      ])
    );
  });

  // SCEN-118: [error] 必須フィールド欠落時の検証失敗
  test("should reject missing required fields in AI output", async () => {
    // Arrange
    const mockAiClient: Tx6Imp1AiClient = {
      executeAction01GetWeeklyReports: async () => ({
        reportDataList: [
          {
            reportId: "RPT-20240113-003",
            memberId: "MEM-003",
            reportDate: "2024-01-08",
            reportContent: "日々の業務を進行中",
            isSubmitted: true,
          },
        ],
        totalReports: 1,
        submittedReports: 1,
        unsubmittedMembers: [],
        validationStatus: "complete",
        confidenceScore: 0.88,
      }),
      executeAction02ExtractIssues: async () => ({
        issues: [
          {
            issueId: "ISSUE-002",
            title: "業務進行",
            severity: "low",
            extractedText: "日々の業務を進行中",
            sourceReportId: "RPT-20240113-003",
          },
        ],
        confidenceScore: 0.88,
      }),
      executeAction03ClassifyIssues: async () => ({
        classifiedIssues: [
          {
            issueId: "ISSUE-002",
            category: "routine",
            // 必須フィールド 'priority' が欠落
            priority: undefined as any,
            impactRange: "team",
          },
        ],
        confidenceScore: 0.88,
      }),
      executeAction04AnalyzeTrends: async () => ({
        trendAnalysis: {},
        confidenceScore: 0.88,
      }),
      executeAction05GenerateReport: async () => ({
        reportContent: "",
        confidenceScore: 0.88,
      }),
      executeAction06ValidateReport: async () => ({
        isValid: false,
        errors: ["Required field 'priority' is missing"],
        confidenceScore: 0.88,
      }),
      executeAction07DistributeReport: async () => ({
        distributionStatus: "pending",
        confidenceScore: 0.88,
      }),
    };

    const input: WeeklyAnalysisReportInput = {
      weekStartDate: "2024-01-08",
      weekEndDate: "2024-01-14",
      targetTeamId: "TEAM-003",
      triggerSource: "scheduled",
    };

    // Act
    const output: WeeklyAnalysisReportOutput = await generateWeeklyAnalysisReport(
      input,
      mockAiClient
    );

    // Assert

    // 1. エスカレーションフラグが立つ
    expect(output.escalationFlag).toBe(true);

    // 2. エスカレーション理由に欠落フィールドが含まれる
    expect(output.escalationReason).toMatch(/priority|必須|欠落/i);

    // 3. パイプラインが停止する
    expect(output.pipelineStatus).toBe("pending_human_review");

    // 4. 後続処理が実行されない
    expect(output.generatedReportContent).toBeUndefined();

    // 5. 監査ログに失敗イベントが記録される
    expect(output.auditEvents.length).toBeGreaterThan(0);
    expect(output.auditEvents[0].eventType).toBe(
      "AI_OUTPUT_VALIDATION_FAILED"
    );
  });

  // SCEN-118: [error] confidenceScore が閾値以下の場合
  test("should escalate when confidence score is below threshold", async () => {
    // Arrange
    const mockAiClient: Tx6Imp1AiClient = {
      executeAction01GetWeeklyReports: async () => ({
        reportDataList: [
          {
            reportId: "RPT-20240113-004",
            memberId: "MEM-004",
            reportDate: "2024-01-08",
            reportContent: "複雑な状況が発生",
            isSubmitted: true,
          },
        ],
        totalReports: 1,
        submittedReports: 1,
        unsubmittedMembers: [],
        validationStatus: "complete",
        // (c) confidenceScore < 0.7
        confidenceScore: 0.68,
      }),
      executeAction02ExtractIssues: async () => ({
        issues: [],
        confidenceScore: 0.68,
      }),
      executeAction03ClassifyIssues: async () => ({
        classifiedIssues: [],
        confidenceScore: 0.68,
      }),
      executeAction04AnalyzeTrends: async () => ({
        trendAnalysis: {},
        confidenceScore: 0.68,
      }),
      executeAction05GenerateReport: async () => ({
        reportContent: "",
        confidenceScore: 0.68,
      }),
      executeAction06ValidateReport: async () => ({
        isValid: false,
        errors: ["Confidence score below threshold: 0.68 < 0.7"],
        confidenceScore: 0.68,
      }),
      executeAction07DistributeReport: async () => ({
        distributionStatus: "pending",
        confidenceScore: 0.68,
      }),
    };

    const input: WeeklyAnalysisReportInput = {
      weekStartDate: "2024-01-08",
      weekEndDate: "2024-01-14",
      targetTeamId: "TEAM-004",
      triggerSource: "scheduled",
    };

    // Act
    const output: WeeklyAnalysisReportOutput = await generateWeeklyAnalysisReport(
      input,
      mockAiClient
    );

    // Assert

    // 1. エスカレーションフラグが立つ
    expect(output.escalationFlag).toBe(true);

    // 2. エスカレーション理由に信頼度の低さが含まれる
    expect(output.escalationReason).toMatch(
      /信頼度|confidence|閾値|threshold/i
    );

    // 3. パイプラインが中断される
    expect(output.pipelineStatus).toBe("pending_human_review");

    // 4. 日報配信準備完了状態にならない
    expect(output.readyForDistribution).toBe(false);

    // 5. 監査ログに信頼度低下イベントが記録される
    expect(output.auditEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: "AI_OUTPUT_VALIDATION_FAILED",
          details: expect.objectContaining({
            failureReason: expect.stringMatching(/confidence|信頼度/i),
          }),
        }),
      ])
    );
  });

  // SCEN-118: [error] JSONスキーマ不適合の場合
  test("should reject JSON schema non-conforming AI output", async () => {
    // Arrange
    const mockAiClient: Tx6Imp1AiClient = {
      executeAction01GetWeeklyReports: async () => ({
        reportDataList: [
          {
            reportId: "RPT-20240113-005",
            memberId: "MEM-005",
            reportDate: "2024-01-08",
            reportContent: "スキーマ不適合データ",
            isSubmitted: true,
          },
        ],
        totalReports: 1,
        submittedReports: 1,
        unsubmittedMembers: [],
        validationStatus: "complete",
        // スキーマ非準拠: 型の不一致
        confidenceScore: "high" as any,
      }),
      executeAction02ExtractIssues: async () => ({
        issues: [],
        confidenceScore: 0.9,
      }),
      executeAction03ClassifyIssues: async () => ({
        classifiedIssues: [],
        confidenceScore: 0.9,
      }),
      executeAction04AnalyzeTrends: async () => ({
        trendAnalysis: {},
        confidenceScore: 0.9,
      }),
      executeAction05GenerateReport: async () => ({
        reportContent: "",
        confidenceScore: 0.9,
      }),
      executeAction06ValidateReport: async () => ({
        isValid: false,
        errors: ["Invalid confidenceScore type: string instead of number"],
        confidenceScore: 0.9,
      }),
      executeAction07DistributeReport: async () => ({
        distributionStatus: "pending",
        confidenceScore: 0.9,
      }),
    };

    const input: WeeklyAnalysisReportInput = {
      weekStartDate: "2024-01-08",
      weekEndDate: "2024-01-14",
      targetTeamId: "TEAM-005",
      triggerSource: "scheduled",
    };

    // Act
    const output: WeeklyAnalysisReportOutput = await generateWeeklyAnalysisReport(
      input,
      mockAiClient
    );

    // Assert

    // 1. スキーマエラーが検出される
    expect(output.escalationFlag).toBe(true);

    // 2. エスカレーション理由にスキーマエラーが含まれる
    expect(output.escalationReason).toMatch(/スキーマ|schema|型/i);

    // 3. パイプラインが中断される
    expect(output.pipelineStatus).toBe("pending_human_review");

    // 4. 配信は実行されない
    expect(output.readyForDistribution).toBe(false);

    // 5. 監査ログが記録される
    expect(output.auditEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: "AI_OUTPUT_VALIDATION_FAILED",
        }),
      ])
    );
  });

  // SCEN-118: [error] 人的レビュー待ちの状態が継続される
  test("should maintain pending_human_review state without auto-proceeding", async () => {
    // Arrange
    const mockAiClient: Tx6Imp1AiClient = {
      executeAction01GetWeeklyReports: async () => ({
        reportDataList: [],
        totalReports: 0,
        submittedReports: 0,
        unsubmittedMembers: [],
        validationStatus: "complete",
        // 低信頼度
        confidenceScore: 0.65,
      }),
      executeAction02ExtractIssues: async () => ({
        issues: [],
        confidenceScore: 0.65,
      }),
      executeAction03ClassifyIssues: async () => ({
        classifiedIssues: [],
        confidenceScore: 0.65,
      }),
      executeAction04AnalyzeTrends: async () => ({
        trendAnalysis: {},
        confidenceScore: 0.65,
      }),
      executeAction05GenerateReport: async () => ({
        reportContent: "",
        confidenceScore: 0.65,
      }),
      executeAction06ValidateReport: async () => ({
        isValid: false,
        errors: ["Confidence below threshold"],
        confidenceScore: 0.65,
      }),
      executeAction07DistributeReport: async () => ({
        distributionStatus: "pending",
        confidenceScore: 0.65,
      }),
    };

    const input: WeeklyAnalysisReportInput = {
      weekStartDate: "2024-01-08",
      weekEndDate: "2024-01-14",
      targetTeamId: "TEAM-006",
      triggerSource: "scheduled",
    };

    // Act
    const output: WeeklyAnalysisReportOutput = await generateWeeklyAnalysisReport(
      input,
      mockAiClient
    );

    // Assert

    // 1. pending_human_review 状態に留まる
    expect(output.pipelineStatus).toBe("pending_human_review");

    // 2. エスカレーションフラグが立っている
    expect(output.escalationFlag).toBe(true);

    // 3. 配信状態は pending のまま
    expect(output.distributionStatus).toBe("pending");

    // 4. 日報配信は実行されない
    expect(output.readyForDistribution).toBe(false);

    // 5. Action 7（配信）は実行されない
    // → distributionStatus が "completed" にならない
    expect(output.distributionStatus).not.toBe("completed");
  });
});