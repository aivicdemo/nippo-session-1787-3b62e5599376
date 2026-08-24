import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import { type PrioritizeAndColorizeIssuesInput, type ColorThresholdConfig, type IssueSummary } from '../../src/logic/issue-extraction-prioritization';

describe('課題ダッシュボード色分け表示機能 - ダッシュボード設定が null のとき', () => {
  // SCEN-2989
  test('ダッシュボード設定が null のとき、色分け表示ロジックは TypeError を発生させ、エラーメッセージにダッシュボード設定の null 参照を示す情報を含む', () => {
    const issueSummaryList: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 85,
        keyword: 'データベース接続エラー',
        impactLevel: 'high',
      },
      {
        issueId: 'issue-002',
        priorityScore: 55,
        keyword: 'ログ出力不足',
        impactLevel: 'medium',
      },
      {
        issueId: 'issue-003',
        priorityScore: 25,
        keyword: 'ドキュメント更新遅延',
        impactLevel: 'low',
      },
    ];

    const colorThresholdConfig: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const requestedByUserId = 'user-manager-001';

    const inputWithNullDashboardConfig: PrioritizeAndColorizeIssuesInput = {
      issues: issueSummaryList,
      colorThresholds: colorThresholdConfig,
      requestedBy: requestedByUserId,
      dashboardConfig: null as any,
    };

    expect(() => {
      prioritizeAndColorizeIssues(inputWithNullDashboardConfig);
    }).toThrow(/ダッシュボード設定|null|Cannot read/);
  });
});