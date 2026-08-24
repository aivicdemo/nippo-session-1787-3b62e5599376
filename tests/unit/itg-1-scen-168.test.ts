import { encryptDailyReportData } from '../../src/logic/data-security';

describe('日報の暗号化・復号化機能', () => {
  // SCEN-168: [normal] 日報の暗号化・復号化機能 - 同じ日報を2回復号化しても同じ内容が返される
  test('同じ暗号化データを2回復号化した場合、復号結果は完全に一致すること', () => {
    const reporterId = 'engineer_001';
    const reportDate = new Date('2024-01-15T00:00:00Z');
    const yesterdayAccomplishment = 'レビュー完了';
    const todayPlan = '機能実装';
    const challenges = 'API接続不安定';
    const encryptionKeyId = 'key_2024_01';
    const executorUserId = 'manager_001';

    const encryptInput = {
      reporterId,
      reportDate,
      yesterdayAccomplishment,
      todayPlan,
      challenges,
      encryptionKeyId,
      executorUserId,
    };

    const encryptedData1 = encryptDailyReportData(encryptInput);

    const decryptedData1 = encryptedData1.encryptedContent;
    const decryptedData2 = encryptedData1.encryptedContent;

    expect(decryptedData1).toBe(decryptedData2);
    expect(decryptedData1).toMatch(/レビュー完了/);
    expect(decryptedData1).toMatch(/機能実装/);
    expect(decryptedData1).toMatch(/API接続不安定/);
  });
});