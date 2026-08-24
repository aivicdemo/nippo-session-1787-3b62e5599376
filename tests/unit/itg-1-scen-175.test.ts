import { encryptDailyReportData } from '../../src/logic/data-security';

describe('朝会報告管理システム - 日報暗号化・復号化機能', () => {
  // SCEN-175: [error] 日報暗号化・復号化機能 - 個人情報フィールドが空文字列のとき暗号化処理がエラーになる
  test('個人情報フィールドが空文字列のとき、暗号化処理がエラーを返す', () => {
    const encryptionKeyId = 'key-2024-001';
    const executorUserId = 'user-director-001';
    const reporterId = 'eng-employee-001';
    const reportDate = new Date('2024-01-15');

    const inputWithEmptyReporterId = {
      reporterId: '',
      reportDate: reportDate,
      yesterdayAccomplishment: 'Completed API implementation',
      todayPlan: 'Start testing module',
      challenges: 'Database connection timeout issue',
      encryptionKeyId: encryptionKeyId,
      executorUserId: executorUserId,
    };

    expect(() =>
      encryptDailyReportData(inputWithEmptyReporterId)
    ).toThrow(/個人情報フィールド|EMPTY_PERSONAL_INFO/);
  });
});