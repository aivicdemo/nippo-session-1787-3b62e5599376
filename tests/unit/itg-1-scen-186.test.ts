import { encryptDailyReportData } from '../../src/logic/data-security';

describe('朝会報告管理システム', () => {
  // SCEN-186
  test('日報暗号化・復号化機能 - 日報作成者と異なる部長ユーザーが該当日報の復号化を試みるときエラーになる', async () => {
    // Arrange
    const reporterId = 'user-a-member';
    const reportDate = new Date('2024-01-15T09:00:00Z');
    const yesterdayAccomplishment = '前日実績：プロジェクトA の要件定義会議に参加';
    const todayPlan = '本日予定：プロジェクトA の基本設計ドキュメント作成';
    const challenges = '抱えている課題：プロジェクトAの仕様がまだ確定していない';
    const encryptionKeyId = 'encryption-key-001';
    const executorUserId = 'user-a-member';

    const input = {
      reporterId,
      reportDate,
      yesterdayAccomplishment,
      todayPlan,
      challenges,
      encryptionKeyId,
      executorUserId,
    };

    // Act & Assert
    // 異なる部長（ユーザーC）の権限でアクセスしようとした場合、エラーが発生する
    // ユーザーCは企画部の部長であり、営業部員（ユーザーA）の日報には復号化権限がない
    expect(() => {
      encryptDailyReportData(input);
    }).toThrow(/権限/);
  });
});