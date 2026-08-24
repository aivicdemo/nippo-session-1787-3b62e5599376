import { encryptDailyReportData } from '../../src/logic/data-security';

describe('朝会報告管理システム', () => {
  // SCEN-173: [error] 日報暗号化・復号化機能 - 課題内容フィールドが欠落しているとき暗号化処理がエラーになる
  test('課題内容フィールドが欠落している場合、暗号化処理がValidationErrorを発生させる', () => {
    const reporterUserId = 'ENG-001';
    const reportDate = new Date('2024-01-15T08:00:00Z');
    const yesterdayAccomplishment = 'データベース設計の見直しを完了';
    const todayPlan = 'API実装とテストの開始';
    const challenges = null; // 課題内容が欠落
    const encryptionKeyId = 'KEY-2024-001';
    const executorUserId = 'MGR-001';

    const input = {
      reporterId: reporterUserId,
      reportDate: reportDate,
      yesterdayAccomplishment: yesterdayAccomplishment,
      todayPlan: todayPlan,
      challenges: challenges,
      encryptionKeyId: encryptionKeyId,
      executorUserId: executorUserId,
    };

    expect(() => encryptDailyReportData(input)).toThrow(/課題|challenge|required/i);
  });
});