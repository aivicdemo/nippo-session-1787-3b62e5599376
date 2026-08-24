import { encryptDailyReportData } from '../../src/logic/data-security';

describe('朝会報告管理システム - データセキュリティ', () => {
  // SCEN-178: [error] 日報暗号化・復号化機能 - 暗号化キーが null のとき暗号化処理がエラーになる
  test('encryptDailyReportData should throw error when encryptionKeyId is null', () => {
    const input = {
      reporterId: 'ENG-001',
      reportDate: new Date('2024-01-15T09:00:00Z'),
      yesterdayAccomplishment: 'データベース設計レビュー完了、提案書作成',
      todayPlan: 'API実装開始、テスト環境構築',
      challenges: 'ネットワーク接続が不安定で接続テストに時間がかかっている',
      encryptionKeyId: null as any,
      executorUserId: 'MGR-001',
    };

    expect(() => encryptDailyReportData(input)).toThrow(/暗号化キー|Encryption key/);
  });
});