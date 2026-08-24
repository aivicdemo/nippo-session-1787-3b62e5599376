import { sortAndGroupProgressComparison } from '../../src/logic/manager-dashboard';
import { type ProgressComparisonInput, type GroupedProgressOutput } from '../../src/logic/manager-dashboard';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-3046
  test('[error] 未提出メンバーの色分け強調表示機能 - ハイライト優先度スコアが数値でなく文字列のとき、ソートロジックが失敗してエラーになる', () => {
    const input: ProgressComparisonInput = {
      reportDataList: [
        {
          reportId: 'report-001',
          reporterId: 'member-a',
          reporterName: 'メンバーA',
          teamId: 'team-001',
          teamName: 'チームA',
          content: '昨日の実績：機能実装',
          reportDate: '2024-01-15',
          submissionTimestamp: '2024-01-15T08:30:00Z',
          priorityScore: 85,
          highlightPriorityScore: '85' as any,
          status: 'submitted',
        },
        {
          reportId: 'report-002',
          reporterId: 'member-b',
          reporterName: 'メンバーB',
          teamId: 'team-001',
          teamName: 'チームA',
          content: '昨日の実績：テスト実施',
          reportDate: '2024-01-15',
          submissionTimestamp: '2024-01-15T08:45:00Z',
          priorityScore: 70,
          highlightPriorityScore: 85,
          status: 'submitted',
        },
      ],
      groupByDimensions: ['priority'],
      userId: 'user-001',
      userRole: 'manager',
    };

    expect(() => sortAndGroupProgressComparison(input)).toThrow(
      /type|string|number|compare/i
    );
  });
});