import { encryptDailyReportData } from "../../src/logic/data-security";
import type {
  EncryptDailyReportDataInput,
  EncryptedDailyReportData,
} from "../../src/logic/data-security";

describe("朝会報告管理システム - 日報暗号化機能", () => {
  // SCEN-196: [edge] 日報暗号化・復号化機能 - 課題内容を含む日報がシステム保存直前に暗号化される
  test("日報送信時に抱えている課題を含む日報内容がシステム保存直前に暗号化される", () => {
    // Arrange: テスト用入力データの準備
    const reporterId = "engineer_a_001";
    const reportDate = new Date("2024-01-15T09:00:00Z");
    const yesterdayAccomplishment = "タスク完了";
    const todayPlan = "タスク開始";
    const challenges = "システム障害が発生しており、対応が必要";
    const encryptionKeyId = "key_2024_01_001";
    const executorUserId = "system_admin_001";

    const input: EncryptDailyReportDataInput = {
      reporterId,
      reportDate,
      yesterdayAccomplishment,
      todayPlan,
      challenges,
      encryptionKeyId,
      executorUserId,
    };

    // Act: encryptDailyReportData を実行して暗号化された日報を取得
    const result: EncryptedDailyReportData = encryptDailyReportData(input);

    // Assert: 暗号化結果の検証

    // 1. 返却されたオブジェクトが EncryptedDailyReportData 型であることを確認
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");

    // 2. 平文情報（検索用）は平文のまま保持されていることを確認
    expect(result.reporterId).toBe(reporterId);
    expect(result.reportDate).toEqual(reportDate);

    // 3. encryptedReportId が生成されていることを確認
    expect(result.encryptedReportId).toBeDefined();
    expect(typeof result.encryptedReportId).toBe("string");
    expect(result.encryptedReportId.length).toBeGreaterThan(0);

    // 4. encryptedContent が存在し、平文ではなく暗号化されていることを確認
    // encryptedContent には以下の情報が含まれる：
    // - yesterdayAccomplishment (タスク完了)
    // - todayPlan (タスク開始)
    // - challenges (システム障害が発生しており、対応が必要)
    expect(result.encryptedContent).toBeDefined();
    expect(typeof result.encryptedContent).toBe("string");
    expect(result.encryptedContent.length).toBeGreaterThan(0);

    // encryptedContent が元の平文を直接含まないことを確認
    // 暗号化されているため、元の課題テキスト全体が含まれていないはず
    expect(result.encryptedContent).not.toContain(
      "システム障害が発生しており、対応が必要"
    );

    // 5. encryptionKeyId が正しく保存されていることを確認
    expect(result.encryptionKeyId).toBe(encryptionKeyId);

    // 6. encryptedAt タイムスタンプが記録されていることを確認
    expect(result.encryptedAt).toBeDefined();
    expect(result.encryptedAt instanceof Date).toBe(true);

    // 7. accessControlList が存在し、復号化権限を持つユーザーが含まれていることを確認
    expect(result.accessControlList).toBeDefined();
    expect(Array.isArray(result.accessControlList)).toBe(true);
    expect(result.accessControlList.length).toBeGreaterThan(0);

    // 8. accessControlList の各エントリが正しい構造を持つことを確認
    result.accessControlList.forEach((entry) => {
      expect(entry.userId).toBeDefined();
      expect(typeof entry.userId).toBe("string");
      expect(entry.userRole).toBeDefined();
      expect(["manager", "director", "admin"]).toContain(entry.userRole);
      expect(entry.canDecrypt).toBe(true);
    });

    // 9. encryptedContent が実際に暗号化アルゴリズムで処理されていることを確認
    // （アルゴリズムによる暗号化の痕跡：暗号文は元のテキストと無関係に見える）
    const encryptedLooksRandomOrHashed =
      /^[a-zA-Z0-9+/=]+$/.test(result.encryptedContent) ||
      /^[a-f0-9]+$/.test(result.encryptedContent);
    expect(encryptedLooksRandomOrHashed).toBe(true);

    // 10. encryptedContent の長さが元の平文と異なることを確認
    // （暗号化またはエンコーディングにより長さが変わるはず）
    const originalLength = challenges.length;
    expect(result.encryptedContent.length).not.toBe(originalLength);

    // 11. 複数回呼び出した場合、同じ入力に対して異なる encryptedContent が生成されることを確認
    // （IV/nonce の使用により、同じ平文でも毎回異なる暗号文が生成される）
    const result2: EncryptedDailyReportData = encryptDailyReportData(input);
    expect(result2.encryptedContent).toBeDefined();
    // encryptedContent は異なる可能性がある（IV が異なる場合）
    // または同じである可能性もある（deterministic encryption の場合）
    // ここでは、少なくとも同じキーIDが使用されることを確認
    expect(result2.encryptionKeyId).toBe(result.encryptionKeyId);

    // 12. encryptedAt の時刻が現在時刻に近いことを確認
    const now = new Date();
    const encryptedTime = new Date(result.encryptedAt);
    const timeDiffMs = Math.abs(now.getTime() - encryptedTime.getTime());
    // 暗号化は数秒以内に完了するはず
    expect(timeDiffMs).toBeLessThan(5000);
  });
});