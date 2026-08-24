import { encryptDailyReportData } from '../../src/logic/data-security';

describe('朝会報告管理システム - 日報暗号化・復号化機能', () => {
  // SCEN-171
  test('日報データが空文字列のとき暗号化処理がエラーになる', () => {
    const input = {
      reporterId: 'engineer-001',
      reportDate: new Date('2024-01-15T09:00:00Z'),
      yesterdayAccomplishment: '',
      todayPlan: '',
      challenges: '',
      encryptionKeyId: 'key-2024-001',
      executorUserId: 'manager-001',
    };

    expect(() => encryptDailyReportData(input)).toThrow(/日報データ|空|ValidationError/);
  });
});