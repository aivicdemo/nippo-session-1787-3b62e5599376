import { prepareDashboardData } from '../../src/logic/dashboard-presentation';
import type { DashboardDataPrepareInput } from '../../src/logic/dashboard-presentation';

describe('朝会報告管理システム - ダッシュボード表示準備', () => {
  // SCEN-198: [error] 部長向けダッシュボード表示用に、提出状況サマリー、未提出メンバー一覧、優先度別課題一覧、課題キーワード発生頻度ランキングを集計・整形して返す。 - チームメンバーIDが空のときという明示された境界条件でチームメンバー情報が登録されていません
  test('teamIdが空文字列のときチームメンバー情報が登録されていませんエラーをスロー', () => {
    const input: DashboardDataPrepareInput = {
      teamId: '',
      targetDate: new Date('2024-01-15T10:00:00Z'),
      requestingUserId: 'user-dept-manager',
      includeHistoricalTrend: false,
    };

    expect(() => prepareDashboardData(input)).toThrow(/チームメンバー情報が登録されていません/);
  });
});