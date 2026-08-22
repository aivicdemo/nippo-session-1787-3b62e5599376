import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { extractAndRankIssues } from "../../src/logic/issue-extraction-prioritization";
import type {
  ExtractedIssue,
  IssuePriority,
  AuditLogEntry,
} from "../../src/logic/issue-extraction-prioritization";

describe("Issue Extraction and Prioritization Logic", () => {
  // SCEN-070: [normal] 日報集約から優先度別課題一覧提示までの自動判定・配信 AIエージェント
  // 「日報集約から優先度別課題一覧提示までの自動判定・配信」が開始・各処理・引継ぎ・失敗・完了を監査記録に残す
  test("should extract and rank issues from aggregated daily reports with complete audit trail", () => {
    // Arrange: モック化された集約済み日報データの準備
    const mockAggregatedReports = [
      {
        reportId: "report-001",
        memberId: "member-A",
        date: "2024-01-15",
        content:
          "システム障害が発生し、本番環境で20分間のダウンタイムが発生。顧客サポートへの問い合わせが殺到。原因は不明で、再発リスクが高い。",
        category: "infrastructure",
      },
      {
        reportId: "report-002",
        memberId: "member-B",
        date: "2024-01-15",
        content:
          "テストカバレッジが現在60%。納期まで5日間で目標70%への達成が困難。品質と納期のトレードオフが発生している。",
        category: "quality",
      },
      {
        reportId: "report-003",
        memberId: "member-C",
        date: "2024-01-15",
        content:
          "顧客からのバグ報告が過去と同一のログ出力エラーで、既に3回目。再発パターンとして認識される。",
        category: "quality",
      },
    ];

    const agentExecutionId = "tx_3_imp_1";
    const auditLog: AuditLogEntry[] = [];

    // Act: extractAndRankIssues を実行
    const result = extractAndRankIssues(
      mockAggregatedReports,
      agentExecutionId,
      auditLog
    );

    // Assert: 期待される監査ログイベントが正しい順序で記録されていることを検証
    expect(auditLog.length).toBe(7);

    // Event 1: START - 処理開始
    expect(auditLog[0].eventType).toBe("START");
    expect(auditLog[0].agentExecutionId).toBe(agentExecutionId);
    expect(auditLog[0].timestamp).toBeDefined();
    expect(typeof auditLog[0].timestamp).toBe("string");

    // Event 2: ACTION_01_EXECUTED - 課題キーワード抽出完了
    expect(auditLog[1].eventType).toBe("ACTION_01_EXECUTED");
    expect(auditLog[1].agentExecutionId).toBe(agentExecutionId);
    expect(auditLog[1].actionNumber).toBe(1);
    expect(auditLog[1].status).toBe("success");
    expect(auditLog[1].processingTimeMs).toBeGreaterThanOrEqual(0);
    expect(auditLog[1].relatedReportIds).toContain("report-001");
    expect(auditLog[1].relatedReportIds).toContain("report-002");
    expect(auditLog[1].relatedReportIds).toContain("report-003");

    // Event 3: ACTION_02_EXECUTED - カテゴリ分類完了
    expect(auditLog[2].eventType).toBe("ACTION_02_EXECUTED");
    expect(auditLog[2].agentExecutionId).toBe(agentExecutionId);
    expect(auditLog[2].actionNumber).toBe(2);
    expect(auditLog[2].status).toBe("success");
    expect(auditLog[2].processingTimeMs).toBeGreaterThanOrEqual(0);

    // Event 4: ACTION_03_EXECUTED - 優先度自動判定完了
    // （影響範囲・緊急度・再発リスクに基づく）
    expect(auditLog[3].eventType).toBe("ACTION_03_EXECUTED");
    expect(auditLog[3].agentExecutionId).toBe(agentExecutionId);
    expect(auditLog[3].actionNumber).toBe(3);
    expect(auditLog[3].status).toBe("success");
    expect(auditLog[3].processingTimeMs).toBeGreaterThanOrEqual(0);

    // Event 5: ACTION_04_EXECUTED - 優先度別一覧生成完了
    expect(auditLog[4].eventType).toBe("ACTION_04_EXECUTED");
    expect(auditLog[4].agentExecutionId).toBe(agentExecutionId);
    expect(auditLog[4].actionNumber).toBe(4);
    expect(auditLog[4].status).toBe("success");
    expect(auditLog[4].processingTimeMs).toBeGreaterThanOrEqual(0);

    // Event 6: ACTION_05_EXECUTED - メール送信完了
    expect(auditLog[5].eventType).toBe("ACTION_05_EXECUTED");
    expect(auditLog[5].agentExecutionId).toBe(agentExecutionId);
    expect(auditLog[5].actionNumber).toBe(5);
    expect(auditLog[5].status).toBe("success");
    expect(auditLog[5].processingTimeMs).toBeGreaterThanOrEqual(0);

    // Event 7: COMPLETED - 処理完了
    expect(auditLog[6].eventType).toBe("COMPLETED");
    expect(auditLog[6].agentExecutionId).toBe(agentExecutionId);
    expect(auditLog[6].status).toBe("success");
    expect(auditLog[6].processingTimeMs).toBeGreaterThanOrEqual(0);

    // Assert: 監査ログイベントの時系列順序を検証
    const timestamps = auditLog.map((entry) => new Date(entry.timestamp));
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i].getTime()).toBeGreaterThanOrEqual(
        timestamps[i - 1].getTime()
      );
    }

    // Assert: 抽出された課題の検証
    expect(result.issues).toBeDefined();
    expect(Array.isArray(result.issues)).toBe(true);
    expect(result.issues.length).toBeGreaterThan(0);

    // Assert: 優先度別に分類された課題が存在することを検証
    const highPriorityIssues = result.issues.filter(
      (issue: ExtractedIssue) => issue.priority === "HIGH"
    );
    const mediumPriorityIssues = result.issues.filter(
      (issue: ExtractedIssue) => issue.priority === "MEDIUM"
    );

    // システム障害（report-001）は高優先度として抽出されるべき
    // （20分のダウンタイムは影響範囲が大きく、緊急度が高い）
    expect(highPriorityIssues.length).toBeGreaterThanOrEqual(1);

    // テストカバレッジ不足（report-002）は中〜高優先度として抽出されるべき
    // （納期まで5日で目標達成困難は緊急度が中程度）
    expect(mediumPriorityIssues.length + highPriorityIssues.length).toBeGreaterThanOrEqual(
      2
    );

    // Assert: 各課題に対して優先度スコアが付与されていることを検証
    result.issues.forEach((issue: ExtractedIssue) => {
      expect(issue.priorityScore).toBeDefined();
      expect(typeof issue.priorityScore).toBe("number");
      expect(issue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);
    });

    // Assert: 再発リスクが高い課題（report-003）が正しく識別されていることを確認
    const recurringIssue = result.issues.find(
      (issue: ExtractedIssue) => issue.relatedReportId === "report-003"
    );
    if (recurringIssue) {
      expect(recurringIssue.isRecurring).toBe(true);
      expect(recurringIssue.recurrenceCount).toBeGreaterThanOrEqual(3);
    }

    // Assert: メール配信結果が記録されていることを検証
    expect(result.mailDeliveryStatus).toBeDefined();
    expect(result.mailDeliveryStatus.delivered).toBe(true);
    expect(result.mailDeliveryStatus.recipientCount).toBeGreaterThan(0);

    // Assert: 全監査ログエントリが正しい構造を持つことを最終確認
    auditLog.forEach((entry: AuditLogEntry) => {
      expect(entry.eventType).toBeDefined();
      expect(entry.agentExecutionId).toBe(agentExecutionId);
      expect(entry.timestamp).toBeDefined();
      expect(entry.status).toMatch(/^(success|failure)$/);
      expect(entry.processingTimeMs).toBeGreaterThanOrEqual(0);
    });
  });
});