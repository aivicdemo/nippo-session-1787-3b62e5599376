import { encryptDailyReportData } from '../../src/logic/data-security';

describe('朝会報告管理システム - 日報暗号化・復号化機能', () => {
  // SCEN-172: [error] 日報暗号化・復号化機能 - 個人情報フィールドが欠落しているとき暗号化処理がエラーになる
  test('個人情報フィールドが欠落した場合、暗号化処理がエラーをスロー', () => {
    // Arrange: 個人情報フィールド（reporterId）を意図的に欠落させた日報オブジェクトを構成
    const incompleteReportData = {
      // reporterId は意図的に省略
      reportDate: new Date('2024-01-15'),
      yesterdayAccomplishment: '前日は機能Aの実装を完了した',
      todayPlan: '本日は機能Bのテストを実施する',
      challenges: 'データベース接続のタイムアウト問題が発生している',
      encryptionKeyId: 'key-001',
      executorUserId: 'user-manager-001',
    };

    // Act & Assert: 暗号化処理がエラーをスロー
    expect(() =>
      encryptDailyReportData(
        incompleteReportData as any
      )
    ).toThrow(/個人情報フィールド/);
  });
});