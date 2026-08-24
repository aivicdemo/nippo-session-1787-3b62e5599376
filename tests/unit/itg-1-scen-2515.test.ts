import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2515: [error] 初回テスト報告の入力検証 - 課題発見の有無フラグが欠落しているとき入力検証エラーが返される
  test('should throw ValidationError with INVALID_INPUT_MISSING_FIELD when issueFoundFlag is missing from initial test report', () => {
    const incompleteReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'テスト報告スクリプトの実装完了',
      todayPlan: 'テスト報告の初期導入テストを実施',
      challenges: 'テスト環境のセットアップに時間がかかっている',
      reportDate: '2024-01-15',
      // issueFoundFlag が意図的に欠落している
    };

    expect(() => submitDailyReport(incompleteReportInput as any)).toThrow(
      /課題発見の有無フラグ/
    );
  });
});