import { encryptDailyReportData } from '../../src/logic/data-security';
import type { EncryptDailyReportDataInput, EncryptedDailyReportData } from '../../src/logic/data-security';

describe('朝会報告管理システム - 日報暗号化・復号化機能', () => {
  // SCEN-188: 暗号化アルゴリズムが指定されていないとき暗号化処理がエラーになる
  test('should throw error when encryption algorithm is not specified', () => {
    const input: EncryptDailyReportDataInput = {
      reporterId: 'ENG-001',
      reportDate: new Date('2024-01-15'),
      yesterdayAccomplishment: '前日の実績を達成しました',
      todayPlan: '本日のタスクを計画しました',
      challenges: '抱えている課題を特定しました',
      encryptionKeyId: 'KEY-UNDEFINED-ALGO',
      executorUserId: 'DIRECTOR-001',
    };

    expect(() => encryptDailyReportData(input)).toThrow(/暗号化アルゴリズム/);
  });
});