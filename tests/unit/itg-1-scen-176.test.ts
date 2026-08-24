import { encryptDailyReportData, type EncryptDailyReportDataInput, type EncryptedDailyReportData } from '../../src/logic/data-security';

describe('朝会報告管理システム - 日報暗号化・復号化機能', () => {
  // SCEN-176: [error] 日報暗号化・復号化機能 - 課題内容フィールドが空文字列のとき暗号化処理がエラーになる
  test('課題内容が空文字列の場合、バリデーションエラー「INVALID_EMPTY_ISSUE_FIELD」を返す', () => {
    const input: EncryptDailyReportDataInput = {
      reporterId: 'ENG001',
      reportDate: new Date('2024-01-15'),
      yesterdayAccomplishment: 'レポート作成',
      todayPlan: '会議参加',
      challenges: '',
      encryptionKeyId: 'KEY_2024_01',
      executorUserId: 'MGR001',
    };

    expect(() => {
      encryptDailyReportData(input);
    }).toThrow(/INVALID_EMPTY_ISSUE_FIELD/);
  });
});