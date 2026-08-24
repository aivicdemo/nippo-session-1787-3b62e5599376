import { encryptDailyReportData } from '../../src/logic/data-security';

describe('朝会報告管理システム - 日報暗号化・復号化機能', () => {
  // SCEN-187
  test('タイムスタンプが null のとき暗号化処理がエラーになる', () => {
    const input = {
      reporterId: 'user001',
      reportDate: new Date('2024-01-15T09:00:00Z'),
      yesterdayAccomplishment: '昨日の作業内容',
      todayPlan: '今日の作業内容',
      challenges: '抱えている課題',
      encryptionKeyId: 'key-001',
      executorUserId: 'manager001',
    };

    const malformedInput = {
      ...input,
      reportDate: null,
    };

    expect(() => encryptDailyReportData(malformedInput as any)).toThrow(
      /タイムスタンプ/,
    );
  });
});