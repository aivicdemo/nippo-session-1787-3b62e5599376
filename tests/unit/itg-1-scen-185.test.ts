import { encryptDailyReportData, type EncryptDailyReportDataInput, type EncryptedDailyReportData } from '../../src/logic/data-security';

describe('朝会報告管理システム - 日報暗号化・復号化機能', () => {
  // SCEN-185: [error] 日報暗号化・復号化機能 - 部長ユーザーが権限情報なしで復号化を試みるときエラーになる
  test('部長ユーザーが権限情報なしで復号化を試みるとき、HTTP 403 Forbidden エラーが返却される', async () => {
    const input: EncryptDailyReportDataInput = {
      reporterId: 'eng-001',
      reportDate: new Date('2024-01-15'),
      yesterdayAccomplishment: 'データベース最適化対応を完了',
      todayPlan: 'API性能改善に取り組む',
      challenges: 'ネットワーク遅延の問題が継続している',
      encryptionKeyId: 'key-aes-256-001',
      executorUserId: 'manager-001'
    };

    let thrownError: Error | undefined;
    try {
      const result = await encryptDailyReportData(input, {
        decryptAuthorizationHeader: undefined
      });
      // This should not be reached
      expect(result).toBeUndefined();
    } catch (error) {
      if (error instanceof Error) {
        thrownError = error;
      }
    }

    expect(thrownError).toBeDefined();
    expect(thrownError?.message).toMatch(/復号化権限/);
    expect(thrownError?.message).toMatch(/ありません/);
  });
});