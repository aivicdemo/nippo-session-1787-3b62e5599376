import { encryptDailyReportData, type EncryptDailyReportDataInput, type EncryptedDailyReportData } from '../../src/logic/data-security';

describe('朝会報告管理システム - 日報暗号化・復号化機能', () => {
  // SCEN-183: [error] 日報暗号化・復号化機能 - ユーザー ID が null のとき権限判定がエラーになる
  test('ユーザーIDがnullの場合、権限判定がエラーになり復号化処理が実行されない', () => {
    const input: EncryptDailyReportDataInput = {
      reporterId: 'ENG001',
      reportDate: new Date('2024-01-15'),
      yesterdayAccomplishment: 'API設計ドキュメント作成完了',
      todayPlan: 'API実装開始',
      challenges: 'データベース接続タイムアウト問題',
      encryptionKeyId: 'KEY-2024-01-15',
      executorUserId: null as any,
    };

    expect(() => encryptDailyReportData(input)).toThrow(/User ID is required for decryption authorization|UNAUTHORIZED_NULL_USER_ID/);
  });
});