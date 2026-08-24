import { encryptDailyReportData } from '../../src/logic/data-security';

describe('朝会報告管理システム - 日報暗号化・復号化機能', () => {
  // SCEN-179: [error] 日報暗号化・復号化機能 - 暗号化キーが空文字列のとき暗号化処理がエラーになる
  test('should throw error when encryption key is empty string', () => {
    const input = {
      reporterId: 'engineer-001',
      reportDate: new Date('2024-01-15T00:00:00Z'),
      yesterdayAccomplishment: 'タスクA完了',
      todayPlan: '朝会報告資料作成',
      challenges: 'DB接続の遅延問題',
      encryptionKeyId: '',
      executorUserId: 'manager-001',
    };

    expect(() => encryptDailyReportData(input)).toThrow(/Encryption key cannot be empty|暗号化キーが空文字列/);
  });
});