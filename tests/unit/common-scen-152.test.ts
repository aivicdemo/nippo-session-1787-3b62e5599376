import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { RemindRequest, RemindResult } from "../../src/logic/notification-delivery";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("notification-delivery", () => {
  // SCEN-152: [error] 課題検索から可視化レポート作成までの自動実行 AIエージェント - 分析結果に矛盾がある場合に副作用の確定前に人へ引き継ぐ
  it("should escalate to human when analysis result contradictions are detected before committing side effects", async () => {
    // Arrange
    const mockAuditLog = jest.fn();
    const mockHumanHandover = jest.fn();
    const mockReportGeneration = jest.fn();
    const mockManagerNotification = jest.fn();

    const extractedIssues = Array.from({ length: 10 }, (_, i) => ({
      issueId: `ISSUE_${String(i + 1).padStart(3, "0")}`,
      title: `課題${i + 1}`,
      firstReportedDate: "2024-01-01T09:00:00Z",
      lastReportedDate: "2024-01-15T10:00:00Z",
      occurrenceCount: i + 1,
    }));

    const patternA = {
      patternId: "PATTERN_A",
      name: "再発パターンA",
      targetIssueIds: ["ISSUE_001", "ISSUE_002", "ISSUE_003"],
      reasoning: "データ品質エラー → キャッシュ無効化の遅延",
      confidence: 0.92,
    };

    const patternB = {
      patternId: "PATTERN_B",
      name: "再発パターンB",
      targetIssueIds: ["ISSUE_001", "ISSUE_002"],
      reasoning: "ネットワークタイムアウト → リトライ処理の不備",
      confidence: 0.78,
    };

    const contradictionDetails = {
      conflictType: "incompatible_pattern_assignment",
      patternAData: {
        pattern: patternA,
        affectedCount: 3,
      },
      patternBData: {
        pattern: patternB,
        affectedCount: 2,
      },
      overlapIssueIds: ["ISSUE_001", "ISSUE_002"],
      inconsistencyDescription:
        "同一課題（ISSUE_001, ISSUE_002）に対して、矛盾する根本原因パターンが判定された",
      escalationReason: "分析結果に矛盾がある場合",
    };

    const remindRequest: RemindRequest = {
      issueDataSnapshot: extractedIssues,
      analysisIntermediateState: {
        action1Result: { status: "completed", issueCnt: 10 },
        action2Result: { status: "completed", detectedPattern: patternA },
        action3Result: { status: "failed_contradiction", detectedPattern: patternB },
      },
      escapeToHumanFlag: false,
      contradictionMetadata: contradictionDetails,
      auditLogFn: mockAuditLog,
      humanHandoverFn: mockHumanHandover,
      reportGenerationFn: mockReportGeneration,
      managerNotificationFn: mockManagerNotification,
    };

    // Act
    const result: RemindResult = await sendUnsubmittedReminder(remindRequest);

    // Assert
    // 1. escapeToHuman フラグが true に設定されていることを確認
    expect(result.escapeToHumanFlag).toBe(true);

    // 2. 人へ引き継ぎハンドラーが呼び出されていることを確認
    expect(mockHumanHandover).toHaveBeenCalledTimes(1);

    // 3. 引き継ぎ時に矛盾の詳細情報が渡されていることを確認
    const handoverCall = mockHumanHandover.mock.calls[0][0];
    expect(handoverCall).toMatchObject({
      conflictType: "incompatible_pattern_assignment",
      escalationReason: "分析結果に矛盾がある場合",
      overlapIssueIds: ["ISSUE_001", "ISSUE_002"],
      inconsistencyDescription:
        "同一課題（ISSUE_001, ISSUE_002）に対して、矛盾する根本原因パターンが判定された",
    });

    // 4. 引き継ぎデータに抽出済み課題データが含まれていることを確認
    expect(handoverCall.issueDataSnapshot).toHaveLength(10);
    expect(handoverCall.issueDataSnapshot[0]).toMatchObject({
      issueId: "ISSUE_001",
      title: "課題1",
    });

    // 5. 引き継ぎデータに分析結果の中間状態が含まれていることを確認
    expect(handoverCall.analysisIntermediateState).toMatchObject({
      action1Result: { status: "completed", issueCnt: 10 },
      action2Result: { status: "completed", detectedPattern: patternA },
      action3Result: { status: "failed_contradiction", detectedPattern: patternB },
    });

    // 6. 監査ログに escapeToHuman イベントが記録されていることを確認
    expect(mockAuditLog).toHaveBeenCalledTimes(1);
    const auditLogCall = mockAuditLog.mock.calls[0][0];
    expect(auditLogCall).toMatchObject({
      eventType: "escapeToHuman",
      reason: "分析結果に矛盾がある場合",
      contradictionMetadata: contradictionDetails,
    });

    // 7. 可視化レポートが生成されていないことを確認
    expect(mockReportGeneration).not.toHaveBeenCalled();

    // 8. 部長への通知が送信されていないことを確認
    expect(mockManagerNotification).not.toHaveBeenCalled();

    // 9. 結果に矛盾情報が含まれていることを確認
    expect(result.contradiction).toMatchObject({
      detected: true,
      details: contradictionDetails,
    });

    // 10. 結果のステータスが escapeToHuman であることを確認
    expect(result.status).toBe("escapeToHuman");
  });
});