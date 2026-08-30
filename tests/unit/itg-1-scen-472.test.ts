import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';

describe('朝会報告管理システム - 月次分析レポート生成', () => {
  // SCEN-472: [error] 毎月初に前月の全日報データを抽出し、課題の時系列変化・ボトルネック推移・チーム別パフォーマンス指標を分析してレポートを生成し、プロジェクトマネージャーに通知する。 - 開発部長のメールアドレスが空または不正な形式の場合という明示された境界条件で開発部長のメールアドレスが設定されていません
  test('開発部長のメールアドレスが空文字列の場合、開発部長のメールアドレスが設定されていません というエラーをthrowする', () => {
    const targetMonth = '2025-12';
    const projectManagerId = 'pm-001';
    const includeExecutiveSummary = true;
    const topChallengesCount = 5;
    const directorEmail = '';

    expect(() =>
      generateMonthlyAnalysisReport({
        targetMonth,
        projectManagerId,
        includeExecutiveSummary,
        topChallengesCount,
        directorEmail,
      })
    ).toThrow(/開発部長のメールアドレスが設定されていません/);
  });
});