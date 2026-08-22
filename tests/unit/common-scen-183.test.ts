import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("Notification Delivery - sendUnsubmittedReminder", () => {
  // SCEN-183: [normal] Tx10Imp1 导入计划・研修实施・フィードバック対応の自動化・統合 AIエージェント
  // 部長承認後、フィードバック内容をメンバーに自動配信する
  test("should deliver feedback to all 10 members after director approval with audit logging", async () => {
    // ========== Setup ==========
    const directorId = "director-001";
    const approvalTimestamp = "2024-01-15T09:30:00Z";
    const deliveryTimestamp = "2024-01-15T09:31:00Z";

    const memberIds = [
      "member-001",
      "member-002",
      "member-003",
      "member-004",
      "member-005",
      "member-006",
      "member-007",
      "member-008",
      "member-009",
      "member-010",
    ];

    const feedbackContent = {
      approverDirectorId: directorId,
      approvalStatus: "approved",
      approvalTimestamp,
      feedbackBody:
        "初回報告データの確認が完了しました。以下の点について改善をお願いします。",
      targetMemberCount: 10,
    };

    const mockDeliveryResults = memberIds.map((memberId) => ({
      memberId,
      deliveryStatus: "success",
      deliveryTimestamp,
    }));

    const mockAuditLog = {
      eventType: "feedback_delivery_initiated",
      approverDirectorId: directorId,
      approvalTimestamp,
      targetMemberCount: 10,
      completedDeliveryCount: 10,
      allDeliveryResults: mockDeliveryResults,
      completionTimestamp: deliveryTimestamp,
    };

    // ========== Execute ==========
    const result = await sendUnsubmittedReminder(feedbackContent);

    // ========== Assertions ==========
    // 1. 配信対象メンバー数の検証
    expect(result.deliveryResults).toHaveLength(10);

    // 2. 各メンバーへの個別配信リクエスト検証
    memberIds.forEach((memberId, index) => {
      expect(result.deliveryResults[index].memberId).toBe(memberId);
      expect(result.deliveryResults[index].deliveryStatus).toBe("success");
      expect(result.deliveryResults[index].deliveryTimestamp).toBe(
        deliveryTimestamp
      );
    });

    // 3. 配信完了数の検証 (10名全員に成功)
    const successCount = result.deliveryResults.filter(
      (r) => r.deliveryStatus === "success"
    ).length;
    expect(successCount).toBe(10);

    // 4. 配信対象者数と配信完了数の一致確認
    expect(result.auditLog.targetMemberCount).toBe(10);
    expect(result.auditLog.completedDeliveryCount).toBe(10);
    expect(result.auditLog.targetMemberCount).toBe(
      result.auditLog.completedDeliveryCount
    );

    // 5. 監査ログの部長承認者ID記録
    expect(result.auditLog.approverDirectorId).toBe(directorId);

    // 6. 監査ログの承認タイムスタンプ記録
    expect(result.auditLog.approvalTimestamp).toBe(approvalTimestamp);

    // 7. 監査ログのイベントタイプ記録
    expect(result.auditLog.eventType).toBe("feedback_delivery_initiated");

    // 8. フィードバック本文が配信結果に含まれることを確認
    expect(result.feedbackBody).toBe(
      "初回報告データの確認が完了しました。以下の点について改善をお願いします。"
    );

    // 9. 承認ステータスの確認
    expect(result.approvalStatus).toBe("approved");

    // 10. 配信完了イベントがすべてのメンバーについて記録されていることを確認
    result.deliveryResults.forEach((deliveryResult) => {
      expect(deliveryResult).toHaveProperty("memberId");
      expect(deliveryResult).toHaveProperty("deliveryStatus");
      expect(deliveryResult).toHaveProperty("deliveryTimestamp");
    });

    // 11. 部長による手動連絡ステップが排除されたことを確認
    // (自動配信が完了し、手動介入が不要な状態)
    expect(result.auditLog.completedDeliveryCount).toBe(
      result.auditLog.targetMemberCount
    );
    expect(result.deliveryResults.every((r) => r.deliveryStatus === "success"))
      .toBe(true);
  });
});