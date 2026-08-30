import { prepareDashboardData } from '../../src/logic/dashboard-presentation';
import { type DashboardDataPrepareInput } from '../../src/logic/dashboard-presentation';

describe('朝会報告管理システム', () => {
  // SCEN-617: [error] 部長向けダッシュボード表示用に、提出状況サマリー、未提出メンバー一覧、優先度別課題一覧、課題キーワード発生頻度ランキングを集計・整形して返す。 - チーム総人数が0以下のときという明示された境界条件でチーム設定が不正です。管理者に連絡してください
  test('チーム総人数が0以下の場合、チーム設定エラーを発生させる', () => {
    const input: DashboardDataPrepareInput = {
      teamId: 'team-001',
      targetDate: new Date('2024-01-15T00:00:00Z'),
      requestingUserId: 'user-manager-001',
      includeHistoricalTrend: false,
    };

    expect(() => prepareDashboardData(input)).toThrow(/チーム設定/);
  });
});