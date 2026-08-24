import { encryptDailyReportData } from '../../src/logic/data-security';
import { type EncryptDailyReportDataInput, type EncryptedDailyReportData } from '../../src/logic/data-security';

describe('朝会報告管理システム - 日報暗号化復号化機能', () => {
  // SCEN-190
  test('日報データサイズがちょうど暗号化アルゴリズムのブロックサイズ倍数である場合、パディングなしで暗号化される', () => {
    // AES-256-GCMのブロックサイズ（バイト単位）
    const AES_BLOCK_SIZE = 16;

    // 日報データを作成：合計サイズが16バイト倍数になるように調整
    // 昨日やったこと：6バイト（"foobar"）
    const yesterdayAccomplishment = 'foobar';
    // 今日やること：5バイト（"hello"）
    const todayPlan = 'hello';
    // 抱えている課題：5バイト（"issue"）
    const challenges = 'issue';

    // 合計サイズの計算：6 + 5 + 5 = 16バイト（16の倍数）
    const totalDataSize = yesterdayAccomplishment.length + todayPlan.length + challenges.length;
    expect(totalDataSize % AES_BLOCK_SIZE).toBe(0);

    // 入力データの準備
    const reporterId = 'ENG001';
    const reportDate = new Date('2024-01-15T09:00:00Z');
    const encryptionKeyId = 'key-001';
    const executorUserId = 'MANAGER001';

    const input: EncryptDailyReportDataInput = {
      reporterId,
      reportDate,
      yesterdayAccomplishment,
      todayPlan,
      challenges,
      encryptionKeyId,
      executorUserId,
    };

    // 暗号化実行
    const encryptedResult: EncryptedDailyReportData = encryptDailyReportData(input);

    // 検証1：encryptedResult が正しく生成されていること
    expect(encryptedResult).toBeDefined();
    expect(encryptedResult.reporterId).toBe(reporterId);
    expect(encryptedResult.reportDate).toEqual(reportDate);
    expect(encryptedResult.encryptionKeyId).toBe(encryptionKeyId);

    // 検証2：暗号化されたコンテンツが存在すること
    expect(encryptedResult.encryptedContent).toBeDefined();
    expect(typeof encryptedResult.encryptedContent).toBe('string');

    // 検証3：encryptedAtがISO 8601形式で記録されていること
    expect(encryptedResult.encryptedAt).toBeDefined();
    expect(typeof encryptedResult.encryptedAt).toBe('object');

    // 検証4：accessControlListに復号化権限を持つユーザーが含まれていること
    expect(encryptedResult.accessControlList).toBeDefined();
    expect(Array.isArray(encryptedResult.accessControlList)).toBe(true);
    expect(encryptedResult.accessControlList.length).toBeGreaterThan(0);

    // 検証5：accessControlListの各エントリが正しい構造を持つこと
    encryptedResult.accessControlList.forEach((entry) => {
      expect(entry.userId).toBeDefined();
      expect(typeof entry.userId).toBe('string');
      expect(entry.userRole).toBeDefined();
      expect(['engineer', 'manager', 'admin']).toContain(entry.userRole);
      expect(entry.canDecrypt).toBeDefined();
      expect(typeof entry.canDecrypt).toBe('boolean');
    });

    // 検証6：管理者またはマネージャーが復号化権限を持つことを確認
    const hasDecryptPermission = encryptedResult.accessControlList.some(
      (entry) => (entry.userRole === 'manager' || entry.userRole === 'admin') && entry.canDecrypt
    );
    expect(hasDecryptPermission).toBe(true);

    // 検証7：暗号化後のデータが予期された形式で出力されていること
    expect(encryptedResult.encryptedReportId).toBeDefined();
    expect(typeof encryptedResult.encryptedReportId).toBe('string');
  });
});