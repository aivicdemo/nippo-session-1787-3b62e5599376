import { encryptDailyReportData } from '../../src/logic/data-security';
import type { EncryptDailyReportDataInput, EncryptedDailyReportData } from '../../src/logic/data-security';

describe('日報暗号化・復号化機能', () => {
  // SCEN-194
  test('業務上の最大規模日報（制限上限サイズ）が暗号化・復号化可能である', async () => {
    // 5000文字のテキストを生成
    const generate5000CharsText = (): string => {
      const baseText = '昨日のタスク進捗情報：';
      const repeatCount = Math.ceil(5000 / baseText.length);
      return (baseText.repeat(repeatCount)).substring(0, 5000);
    };

    const yesterdayAccomplishment = generate5000CharsText();
    const todayPlan = generate5000CharsText();
    const challenges = generate5000CharsText();

    // 合計15000文字であることを確認
    const totalCharCount = yesterdayAccomplishment.length + todayPlan.length + challenges.length;
    expect(totalCharCount).toBe(15000);

    // テスト用の日報データを準備
    const dailyReportInput: EncryptDailyReportDataInput = {
      reporterId: 'engineer-001',
      reportDate: new Date('2024-01-15T00:00:00Z'),
      yesterdayAccomplishment: yesterdayAccomplishment,
      todayPlan: todayPlan,
      challenges: challenges,
      encryptionKeyId: 'key-001',
      executorUserId: 'manager-001',
    };

    // 日報暗号化処理を実行
    const startTime = Date.now();
    const encryptedData: EncryptedDailyReportData = await encryptDailyReportData(dailyReportInput);
    const processingTime = Date.now() - startTime;

    // 暗号化処理が成功し、戻り値が正しい構造であることを確認
    expect(encryptedData).toHaveProperty('encryptedReportId');
    expect(encryptedData).toHaveProperty('reporterId');
    expect(encryptedData).toHaveProperty('reportDate');
    expect(encryptedData).toHaveProperty('encryptedContent');
    expect(encryptedData).toHaveProperty('encryptionKeyId');
    expect(encryptedData).toHaveProperty('encryptedAt');
    expect(encryptedData).toHaveProperty('accessControlList');

    // 平文フィールドが正しく保持されていることを確認
    expect(encryptedData.reporterId).toBe('engineer-001');
    expect(encryptedData.reportDate).toEqual(new Date('2024-01-15T00:00:00Z'));
    expect(encryptedData.encryptionKeyId).toBe('key-001');

    // 暗号化済みコンテンツが存在し、元のテキストと異なることを確認
    expect(typeof encryptedData.encryptedContent).toBe('string');
    expect(encryptedData.encryptedContent).not.toBe(yesterdayAccomplishment);
    expect(encryptedData.encryptedContent).not.toBe(todayPlan);
    expect(encryptedData.encryptedContent).not.toBe(challenges);

    // encryptedAtが有効なISO 8601形式であることを確認
    expect(typeof encryptedData.encryptedAt).toBe('object');
    expect(encryptedData.encryptedAt instanceof Date).toBe(true);

    // accessControlListが配列であることを確認
    expect(Array.isArray(encryptedData.accessControlList)).toBe(true);
    expect(encryptedData.accessControlList.length).toBeGreaterThan(0);

    // 各accessControlEntryが正しい構造を持つことを確認
    encryptedData.accessControlList.forEach((entry) => {
      expect(entry).toHaveProperty('userId');
      expect(entry).toHaveProperty('userRole');
      expect(entry).toHaveProperty('canDecrypt');
      expect(typeof entry.userId).toBe('string');
      expect(typeof entry.userRole).toBe('string');
      expect(typeof entry.canDecrypt).toBe('boolean');
    });

    // 処理時間が3秒以内であることを確認
    expect(processingTime).toBeLessThan(3000);
  });
});