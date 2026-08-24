import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { encryptDailyReportData } from "../../src/logic/data-security";
import { type EncryptDailyReportDataInput, type EncryptedDailyReportData } from "../../src/logic/data-security";

describe("日報の暗号化・復号化機能", () => {
  // SCEN-163: [normal] 日報の暗号化・復号化機能 - 日報データ保存時に個人情報・課題内容・進捗情報が暗号化される
  test("日報データ保存時に個人情報・課題内容・進捗情報が暗号化される", async () => {
    const reportDate = new Date("2024-01-15");
    const reporterId = "engineer_001";
    const executorUserId = "manager_001";
    const encryptionKeyId = "key_v1_2024";

    const input: EncryptDailyReportDataInput = {
      reporterId: reporterId,
      reportDate: reportDate,
      yesterdayAccomplishment: "実装進捗 60%",
      todayPlan: "顧客システムの接続タイムアウト問題の調査",
      challenges: "顧客システムの接続タイムアウト問題",
      encryptionKeyId: encryptionKeyId,
      executorUserId: executorUserId,
    };

    const result: EncryptedDailyReportData = await encryptDailyReportData(input);

    // 暗号化後のデータIDが生成されていることを確認
    expect(result.encryptedReportId).toBeDefined();
    expect(typeof result.encryptedReportId).toBe("string");
    expect(result.encryptedReportId.length).toBeGreaterThan(0);

    // 報告者IDが平文で保持されていることを確認
    expect(result.reporterId).toBe(reporterId);

    // 報告日付が平文で保持されていることを確認
    expect(result.reportDate).toEqual(reportDate);

    // 暗号化されたコンテンツが文字列であることを確認
    expect(result.encryptedContent).toBeDefined();
    expect(typeof result.encryptedContent).toBe("string");

    // 暗号化されたコンテンツが元のプレーンテキストと異なることを確認
    const plainTexts = [
      "実装進捗 60%",
      "顧客システムの接続タイムアウト問題の調査",
      "顧客システムの接続タイムアウト問題",
    ];
    for (const plainText of plainTexts) {
      expect(result.encryptedContent).not.toContain(plainText);
    }

    // 暗号化されたコンテンツが16進数またはBase64形式であることを確認
    const isHexOrBase64 = /^[0-9a-fA-F]+$/.test(result.encryptedContent) ||
      /^[A-Za-z0-9+/=]+$/.test(result.encryptedContent);
    expect(isHexOrBase64).toBe(true);

    // 使用した暗号化キーIDが記録されていることを確認
    expect(result.encryptionKeyId).toBe(encryptionKeyId);

    // 暗号化実行時刻が記録されていることを確認
    expect(result.encryptedAt).toBeDefined();
    expect(result.encryptedAt instanceof Date).toBe(true);

    // アクセス制御リストが配列であることを確認
    expect(Array.isArray(result.accessControlList)).toBe(true);
    expect(result.accessControlList.length).toBeGreaterThan(0);

    // アクセス制御エントリの構造を確認
    for (const entry of result.accessControlList) {
      expect(entry.userId).toBeDefined();
      expect(typeof entry.userId).toBe("string");
      expect(entry.userRole).toBeDefined();
      expect(["manager", "director", "admin"].includes(entry.userRole)).toBe(true);
      expect(typeof entry.canDecrypt).toBe("boolean");
      expect(entry.canDecrypt).toBe(true);
    }

    // 実行ユーザーが復号化権限を持つエントリに含まれていることを確認
    const executorEntry = result.accessControlList.find(
      (entry) => entry.userId === executorUserId
    );
    expect(executorEntry).toBeDefined();
    expect(executorEntry?.canDecrypt).toBe(true);
  });
});