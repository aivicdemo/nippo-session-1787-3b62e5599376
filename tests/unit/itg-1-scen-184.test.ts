import { encryptDailyReportData } from '../../src/logic/data-security';

describe('日報暗号化・復号化機能', () => {
  // SCEN-184: [error] 日報暗号化・復号化機能 - ユーザー ID が空文字列のとき権限判定がエラーになる
  test('ユーザーIDが空文字列のとき、権限判定エラーをスロー', () => {
    const input = {
      reporterId: 'reporter-001',
      reportDate: new Date('2024-01-15T09:00:00Z'),
      yesterdayAccomplishment: '前日実績を記述',
      todayPlan: '本日予定を記述',
      challenges: '抱えている課題を記述',
      encryptionKeyId: 'key-001',
      executorUserId: '',
    };

    expect(() => encryptDailyReportData(input)).toThrow(/ユーザーID/);
  });
});