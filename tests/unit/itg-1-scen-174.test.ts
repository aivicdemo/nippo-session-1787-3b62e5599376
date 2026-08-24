import { encryptDailyReportData } from '../../src/logic/data-security';
import type { EncryptDailyReportDataInput, EncryptedDailyReportData } from '../../src/logic/data-security';

describe('朝会報告管理システム - データ暗号化機能', () => {
  // SCEN-174
  test('日報データで抱えている課題フィールドが欠落しているとき、暗号化処理がエラーを発生させる', () => {
    const reporterIdValue = 'engineer-001';
    const reportDateValue = new Date('2024-01-15T09:00:00Z');
    const yesterdayAccomplishmentValue = 'テスト実施';
    const todayPlanValue = '結果確認';
    const encryptionKeyIdValue = 'key-2024-01-15';
    const executorUserIdValue = 'manager-001';

    const inputWithMissingChallenges: Partial<EncryptDailyReportDataInput> = {
      reporterId: reporterIdValue,
      reportDate: reportDateValue,
      yesterdayAccomplishment: yesterdayAccomplishmentValue,
      todayPlan: todayPlanValue,
      encryptionKeyId: encryptionKeyIdValue,
      executorUserId: executorUserIdValue,
    };

    expect(() =>
      encryptDailyReportData(
        inputWithMissingChallenges as EncryptDailyReportDataInput
      )
    ).toThrow(/進捗情報|課題|challenges/i);
  });
});