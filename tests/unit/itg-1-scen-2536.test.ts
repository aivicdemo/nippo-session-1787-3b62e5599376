import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2536: [edge] 初回テスト報告の入力検証機能 - 報告テキストが空文字である場合、品質基準検証が不合格となる
  test('報告テキストが空文字の場合、品質基準検証が不合格となり、エラーメッセージが返される', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '',
      todayPlan: 'サーバーのメンテナンスを実施',
      challenges: 'ネットワーク遅延が発生している',
      reportDate: '2024-01-15'
    };

    expect(() => submitDailyReport(input)).toThrow(/報告テキスト/);
  });
});