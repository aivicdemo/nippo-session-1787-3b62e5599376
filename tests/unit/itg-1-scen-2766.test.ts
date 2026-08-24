import { sortAndGroupProgressComparison } from '../../src/logic/manager-dashboard';
import { type ProgressComparisonInput, type GroupedProgressOutput } from '../../src/logic/manager-dashboard';

describe('課題の影響度判定と優先度スコア順序付け機能', () => {
  // SCEN-2766: 同じ優先度スコアを持つ複数の課題が存在するとき順序の決定ロジックが欠落して失敗する
  test('should sort issues by priority score with secondary sort by creation timestamp when scores are equal', () => {
    // テストデータ: 同一の優先度スコア（75点）を持つ3つの課題
    const issueC = {
      issueId: 'issue-c',
      issueContent: 'Database connection timeout in batch processing',
      priorityScore: 75,
      priorityColor: 'yellow',
      impactLevel: 'medium',
      reporterName: 'Charlie',
      createdAt: '2024-01-01T08:15:00Z',
    };

    const issueA = {
      issueId: 'issue-a',
      issueContent: 'API response delay during peak hours',
      priorityScore: 75,
      priorityColor: 'yellow',
      impactLevel: 'medium',
      reporterName: 'Alice',
      createdAt: '2024-01-01T09:00:00Z',
    };

    const issueB = {
      issueId: 'issue-b',
      issueContent: 'Memory leak in session management module',
      priorityScore: 75,
      priorityColor: 'yellow',
      impactLevel: 'medium',
      reporterName: 'Bob',
      createdAt: '2024-01-01T10:30:00Z',
    };

    // 異なる優先度スコアを持つ課題も含める
    const issueHighPriority = {
      issueId: 'issue-high',
      issueContent: 'Critical security vulnerability detected',
      priorityScore: 95,
      priorityColor: 'red',
      impactLevel: 'high',
      reporterName: 'David',
      createdAt: '2024-01-01T07:00:00Z',
    };

    const issueLowPriority = {
      issueId: 'issue-low',
      issueContent: 'Minor UI alignment issue on mobile view',
      priorityScore: 30,
      priorityColor: 'green',
      impactLevel: 'low',
      reporterName: 'Eve',
      createdAt: '2024-01-01T11:45:00Z',
    };

    const inputData: ProgressComparisonInput = {
      reportDataList: [
        {
          reportId: 'report-1',
          reporterId: 'user-1',
          reporterName: 'Alice',
          teamId: 'team-eng-01',
          teamName: 'Engineering Team',
          content: 'Completed API integration testing. Identified API response delay during peak hours.',
          reportDate: '2024-01-01',
          submissionTimestamp: '2024-01-01T09:00:00Z',
          yesterdayReports: [],
          todayReports: [],
          challenges: [issueA, issueB, issueC, issueHighPriority, issueLowPriority],
        },
      ],
      groupByDimensions: ['priority'],
      userId: 'user-manager-01',
      userRole: 'manager',
    };

    const result: GroupedProgressOutput = sortAndGroupProgressComparison(inputData);

    // 検証: 結果が返却されていることを確認
    expect(result).toBeDefined();
    expect(result.groupedData).toBeDefined();
    expect(Array.isArray(result.groupedData)).toBe(true);

    // 検証: グループ化されたデータから課題リストを取得
    // 優先度グループが存在することを確認
    const priorityGroups = result.groupedData.filter(group => group.groupKey === 'priority');
    expect(priorityGroups.length).toBeGreaterThan(0);

    // 検証: 同一優先度スコア（75点）を持つ課題が、作成日時の昇順でソートされているか確認
    // 期待される順序: issueC (08:15) → issueA (09:00) → issueB (10:30)
    const flattenedIssues: Array<{
      issueId: string;
      priorityScore: number;
      createdAt: string;
    }> = [];

    priorityGroups.forEach(group => {
      if (Array.isArray(group.items)) {
        group.items.forEach(item => {
          if (item.challenges && Array.isArray(item.challenges)) {
            item.challenges.forEach(challenge => {
              flattenedIssues.push({
                issueId: challenge.issueId,
                priorityScore: challenge.priorityScore,
                createdAt: challenge.createdAt || '',
              });
            });
          }
        });
      }
    });

    // 同一スコア（75点）を持つ課題を抽出
    const sameScoreIssues = flattenedIssues.filter(issue => issue.priorityScore === 75);
    expect(sameScoreIssues.length).toBeGreaterThanOrEqual(3);

    // 同一スコア内での順序が作成日時で昇順になっていることを確認
    const timestamps = sameScoreIssues.map(issue => new Date(issue.createdAt).getTime());
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
    }

    // 検証: 全体的な優先度スコア順序が正しいこと（高スコア順）
    const allIssueScores = flattenedIssues.map(issue => issue.priorityScore);
    for (let i = 1; i < allIssueScores.length; i++) {
      expect(allIssueScores[i]).toBeLessThanOrEqual(allIssueScores[i - 1]);
    }

    // 検証: 特定の課題順序を確認
    // issueHighPriority (95) は最初に来るべき
    const firstIssue = sameScoreIssues[0];
    expect(firstIssue).toBeDefined();

    // 同一スコアの課題の順序が C → A → B であることを確認
    const issueIds = sameScoreIssues.map(issue => issue.issueId);
    expect(issueIds).toContain('issue-c');
    expect(issueIds).toContain('issue-a');
    expect(issueIds).toContain('issue-b');

    // issueC が issueA より前に来ること
    const indexC = issueIds.indexOf('issue-c');
    const indexA = issueIds.indexOf('issue-a');
    const indexB = issueIds.indexOf('issue-b');
    expect(indexC).toBeLessThan(indexA);
    expect(indexA).toBeLessThan(indexB);

    // 検証: sortOrder が定義されていることを確認
    expect(result.sortOrder).toBeDefined();
    expect(result.sortOrder.primarySort).toBeDefined();
    expect(result.sortOrder.secondarySort).toBeDefined();

    // 検証: displayFormat が指定されていることを確認
    expect(result.displayFormat).toBeDefined();
    expect(['table', 'card', 'list']).toContain(result.displayFormat);
  });
});