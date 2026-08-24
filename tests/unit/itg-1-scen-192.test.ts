import { encryptDailyReportData } from "../../src/logic/data-security";
import { type EncryptDailyReportDataInput, type EncryptedDailyReportData } from "../../src/logic/data-security";

describe("朝会報告管理システム - 日報暗号化機能", () => {
  // SCEN-192: [edge] 日報暗号化・復号化機能 - 日報データサイズがブロックサイズ倍数を超過する場合、複数ブロックに分割して暗号化される
  test("should encrypt and decrypt multiblock daily report data correctly", async () => {
    const yesterdayAccomplishment = "顧客A対応、バグ修正5件、ドキュメント更新";
    const todayPlan = "顧客B打合せ、新機能実装開始、レビュー対応";
    const challenges = "サーバー負荷対策が必要、チーム間の認識齟齬あり";

    const combinedData = yesterdayAccomplishment + todayPlan + challenges;
    const dataSizeInBytes = Buffer.byteLength(combinedData, "utf-8");

    const input: EncryptDailyReportDataInput = {
      reporterId: "engineer_001",
      reportDate: new Date("2024-01-15"),
      yesterdayAccomplishment,
      todayPlan,
      challenges,
      encryptionKeyId: "key_aes256_gcm_001",
      executorUserId: "manager_001",
    };

    const result: EncryptedDailyReportData = await encryptDailyReportData(input);

    expect(result).toBeDefined();
    expect(result.encryptedReportId).toBeTruthy();
    expect(result.reporterId).toBe("engineer_001");
    expect(result.reportDate).toEqual(new Date("2024-01-15"));
    expect(result.encryptionKeyId).toBe("key_aes256_gcm_001");
    expect(result.encryptedContent).toBeTruthy();
    expect(typeof result.encryptedContent).toBe("string");
    expect(result.encryptedAt).toBeTruthy();
    expect(result.accessControlList).toBeDefined();
    expect(Array.isArray(result.accessControlList)).toBe(true);

    expect(dataSizeInBytes).toBeGreaterThan(16);
    expect(dataSizeInBytes).toBe(80);

    const encryptedContentBuffer = Buffer.from(result.encryptedContent, "base64");
    expect(encryptedContentBuffer.length).toBeGreaterThanOrEqual(96);

    const accessControlEntry = result.accessControlList.find(
      (entry) => entry.userRole === "manager"
    );
    expect(accessControlEntry).toBeDefined();
    expect(accessControlEntry?.canDecrypt).toBe(true);
    expect(accessControlEntry?.userId).toBeTruthy();
  });
});