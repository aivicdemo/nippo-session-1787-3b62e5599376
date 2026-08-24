import { sortAndGroupProgressComparison } from '../../src/logic/manager-dashboard';
import type { ProgressComparisonInput, GroupedProgressOutput } from '../../src/logic/manager-dashboard';

describe('課題の影響度判定と優先度スコア順序付け機能', () => {
  // SCEN-2805: [edge] ダッシュボード表示優先順位付け機能 - 同一優先度スコアを持つ複数課題の順序が報告入力順で正確に保持される
  test('同一優先度スコアの複数課題が報告入力順でソートされる', () => {
    const report_1_timestamp = '2024-01-15T09:00:00Z';
    const report_2_timestamp = '2024-01-15T09:00:15Z';
    const report_3_timestamp = '2024-01-15T09:00:30Z';

    const input: ProgressComparisonInput = {
      reportDataList: [
        {
          reportId: 'report_001',
          reporterId: 'user_a',
          reporterName: 'User A',
          teamId: 'team_001',
          teamName: 'Development Team',
          content: 'Server down issue',
          reportDate: '2024-01-15',
          submissionTimestamp: report_1_timestamp,
          yesterdayReports: [],
          todayReports: [],
          challenges: [
            {
              challengeId: 'challenge_001',
              content: 'サーバーダウン',
              priorityScore: 50,
            },
          ],
        },
        {
          reportId: 'report_002',
          reporterId: 'user_a',
          reporterName: 'User A',
          teamId: 'team_001',
          teamName: 'Development Team',
          content: 'Debug support needed',
          reportDate: '2024-01-15',
          submissionTimestamp: report_2_timestamp,
          yesterdayReports: [],
          todayReports: [],
          challenges: [
            {
              challengeId: 'challenge_002',
              content: 'デバッグ対応',
              priorityScore: 50,
            },
          ],
        },
        {
          reportId: 'report_003',
          reporterId: 'user_a',
          reporterName: 'User A',
          teamId: 'team_001',
          teamName: 'Development Team',
          content: 'Documentation creation',
          reportDate: '2024-01-15',
          submissionTimestamp: report_3_timestamp,
          yesterdayReports: [],
          todayReports: [],
          challenges: [
            {
              challengeId: 'challenge_003',
              content: 'ドキュメント作成',
              priorityScore: 50,
            },
          ],
        },
      ],
      groupByDimensions: ['priority'],
      userId: 'user_manager_001',
      userRole: 'manager',
    };

    const result: GroupedProgressOutput = sortAndGroupProgressComparison(input);

    expect(result).toBeDefined();
    expect(result.groupedData).toBeDefined();
    expect(Array.isArray(result.groupedData)).toBe(true);

    const flat_challenges = result.groupedData.flatMap(
      (group) => group.members || []
    );

    expect(flat_challenges.length).toBe(3);

    expect(flat_challenges[0].challengeId).toBe('challenge_001');
    expect(flat_challenges[0].content).toBe('サーバーダウン');
    expect(flat_challenges[0].priorityScore).toBe(50);

    expect(flat_challenges[1].challengeId).toBe('challenge_002');
    expect(flat_challenges[1].content).toBe('デバッグ対応');
    expect(flat_challenges[1].priorityScore).toBe(50);

    expect(flat_challenges[2].challengeId).toBe('challenge_003');
    expect(flat_challenges[2].content).toBe('ドキュメント作成');
    expect(flat_challenges[2].priorityScore).toBe(50);
  });
});