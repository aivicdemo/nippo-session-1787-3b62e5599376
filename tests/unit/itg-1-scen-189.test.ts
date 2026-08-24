import { encryptDailyReportData } from '../../src/logic/data-security';
import type { EncryptDailyReportDataInput, EncryptedDailyReportData } from '../../src/logic/data-security';

describe('朝会報告管理システム - 日報暗号化・復号化機能', () => {
  // SCEN-189: [error] 日報暗号化・復号化機能 - サポートされていない暗号化アルゴリズムが指定されたときエラーになる
  test('サポートされていない暗号化アルゴリズムが指定されたときエラーがスローされる', () => {
    const input: EncryptDailyReportDataInput = {
      reporterId: 'ENG001',
      reportDate: new Date('2024-01-15'),
      yesterdayAccomplishment: 'APIの実装を完了した',
      todayPlan: 'テスト実装とレビュー対応',
      challenges: 'データベース接続のタイムアウト問題',
      encryptionKeyId: 'key-unsupported-algo',
      executorUserId: 'MGR001'
    };

    expect(() => {
      encryptDailyReportData(input, {
        keyId: 'key-unsupported-algo',
        algorithm: 'UNSUPPORTED_ALGO_XYZ',
        createdAt: new Date('2024-01-15T08:00:00Z')
      });
    }).toThrow(/ENCRYPTION_ALGORITHM_NOT_SUPPORTED/);
  });
});