import { encryptDailyReportData } from "../../src/logic/data-security";
import { type EncryptDailyReportDataInput, type EncryptedDailyReportData } from "../../src/logic/data-security";

describe("朝会報告管理システム - データセキュリティ", () => {
  test("SCEN-202: 同一内容の日報が異なるタイミングで保存される場合、異なる暗号文が生成される", () => {
    // Mock CryptoService with controllable timestamp
    let currentTimestamp = new Date("2026-08-19T09:00:00.000Z");
    
    const mockCryptoService = {
      encrypt: (plaintext: string, keyId: string): string => {
        // Simulate AES-256-GCM with timestamp-based IV/nonce
        // Return different ciphertexts for same plaintext at different times
        const timestamp = currentTimestamp.getTime();
        const timestampBuffer = Buffer.alloc(8);
        timestampBuffer.writeBigInt64BE(BigInt(timestamp));
        
        // Simple deterministic encryption simulation: 
        // base64(plaintext + timestamp) to represent different outputs
        const combined = plaintext + "|" + timestamp.toString();
        return Buffer.from(combined).toString("hex");
      },
      decrypt: (ciphertext: string): string => {
        // Reverse the encryption to recover plaintext
        const combined = Buffer.from(ciphertext, "hex").toString("utf-8");
        const [plaintext] = combined.split("|");
        return plaintext;
      },
      getKeyMetadata: (keyId: string) => ({
        keyId,
        algorithm: "AES-256-GCM",
        createdAt: new Date("2026-08-19T00:00:00.000Z"),
      }),
    };

    // Mock NotificationServiceAdapter for ACL
    const mockNotificationService = {
      getManagersByTeam: (teamId: string) => [
        {
          userId: "user-manager-001",
          userRole: "manager",
        },
      ],
    };

    // Setup first encryption at 2026-08-19T09:00:00.000Z
    currentTimestamp = new Date("2026-08-19T09:00:00.000Z");
    
    const reportContent = "昨日：タスクA完了、今日：タスクB開始、課題：リソース不足";
    
    const input1: EncryptDailyReportDataInput = {
      reporterId: "engineer-001",
      reportDate: new Date("2026-08-19"),
      yesterdayAccomplishment: "タスクA完了",
      todayPlan: "タスクB開始",
      challenges: "リソース不足",
      encryptionKeyId: "key-2026-08-19",
      executorUserId: "admin-001",
    };

    // Mock getCurrentTime to return controlled timestamp
    const originalDate = Date;
    global.Date = class extends originalDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          return new originalDate(currentTimestamp.getTime()) as any;
        }
        return new originalDate(...args) as any;
      }
      static now() {
        return currentTimestamp.getTime();
      }
    } as any;

    const encryptedReport1: EncryptedDailyReportData = encryptDailyReportData(input1, mockCryptoService as any, mockNotificationService as any);
    const ciphertext1 = encryptedReport1.encryptedContent;

    // Advance time by 500ms
    currentTimestamp = new Date("2026-08-19T09:00:00.500Z");

    const input2: EncryptDailyReportDataInput = {
      reporterId: "engineer-001",
      reportDate: new Date("2026-08-19"),
      yesterdayAccomplishment: "タスクA完了",
      todayPlan: "タスクB開始",
      challenges: "リソース不足",
      encryptionKeyId: "key-2026-08-19",
      executorUserId: "admin-001",
    };

    const encryptedReport2: EncryptedDailyReportData = encryptDailyReportData(input2, mockCryptoService as any, mockNotificationService as any);
    const ciphertext2 = encryptedReport2.encryptedContent;

    // Restore original Date
    global.Date = originalDate;

    // Assert: ciphertexts are different
    expect(ciphertext1).not.toBe(ciphertext2);
    expect(typeof ciphertext1).toBe("string");
    expect(typeof ciphertext2).toBe("string");

    // Assert: decrypted plaintexts are identical
    const decrypted1 = mockCryptoService.decrypt(ciphertext1);
    const decrypted2 = mockCryptoService.decrypt(ciphertext2);
    
    expect(decrypted1).toContain("タスクA完了");
    expect(decrypted1).toContain("タスクB開始");
    expect(decrypted1).toContain("リソース不足");
    expect(decrypted2).toContain("タスクA完了");
    expect(decrypted2).toContain("タスクB開始");
    expect(decrypted2).toContain("リソース不足");

    // Assert: metadata fields are correctly populated
    expect(encryptedReport1.reporterId).toBe("engineer-001");
    expect(encryptedReport1.encryptionKeyId).toBe("key-2026-08-19");
    expect(encryptedReport2.reporterId).toBe("engineer-001");
    expect(encryptedReport2.encryptionKeyId).toBe("key-2026-08-19");

    // Assert: reportDate is stored as plaintext for search
    expect(encryptedReport1.reportDate).toEqual(new Date("2026-08-19"));
    expect(encryptedReport2.reportDate).toEqual(new Date("2026-08-19"));

    // Assert: encryptedAt timestamps differ
    expect(encryptedReport1.encryptedAt).not.toEqual(encryptedReport2.encryptedAt);

    // Assert: ACL is populated for manager access
    expect(encryptedReport1.accessControlList.length).toBeGreaterThan(0);
    expect(encryptedReport1.accessControlList[0].userRole).toBe("manager");
    expect(encryptedReport1.accessControlList[0].canDecrypt).toBe(true);
  });
});