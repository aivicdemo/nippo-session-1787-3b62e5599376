import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度を判定し優先度スコアで順序付けして表示する機能', () => {
  // SCEN-606: [normal] 課題優先度スコア計算機能 - 計算された優先度スコアに基づいて課題が降順で並べられる
  test('複数の課題に対して優先度スコアを計算し、降順で整列する', () => {
    const issueA = {
      issueId: 'issue-A',
      issueContent: 'データベース接続エラーが頻発している',
      occurrenceFrequency: 3,
      impactScore: 85,
      affectedTeamCount: 8,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    const issueB = {
      issueId: 'issue-B',
      issueContent: 'ドキュメント更新が遅延している',
      occurrenceFrequency: 1,
      impactScore: 45,
      affectedTeamCount: 2,
      resolutionDaysAverage: 5,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    const issueC = {
      issueId: 'issue-C',
      issueContent: 'ビルド失敗が断続的に発生',
      occurrenceFrequency: 2,
      impactScore: 60,
      affectedTeamCount: 5,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15',
      teamId: 'team-001'
    };

    const results = [
      calculateIssuePriorityScore(issueA),
      calculateIssuePriorityScore(issueB),
      calculateIssuePriorityScore(issueC)
    ];

    const sortedResults = results.sort((a, b) => b.priorityScore - a.priorityScore);

    expect(sortedResults[0].issueId).toBe('issue-A');
    expect(sortedResults[0].priorityScore).toBe(85);
    expect(sortedResults[0].priorityRank).toBe('高');
    expect(sortedResults[0].colorCode).toBe('#FF0000');

    expect(sortedResults[1].issueId).toBe('issue-C');
    expect(sortedResults[1].priorityScore).toBe(60);
    expect(sortedResults[1].priorityRank).toBe('中');
    expect(sortedResults[1].colorCode).toBe('#FFFF00');

    expect(sortedResults[2].issueId).toBe('issue-B');
    expect(sortedResults[2].priorityScore).toBe(45);
    expect(sortedResults[2].priorityRank).toBe('中');
    expect(sortedResults[2].colorCode).toBe('#FFFF00');

    expect(sortedResults[0].scoreBreakdown).toHaveProperty('frequencyScore');
    expect(sortedResults[0].scoreBreakdown).toHaveProperty('impactScore');
    expect(sortedResults[0].scoreBreakdown).toHaveProperty('resolutionDifficultyScore');

    expect(sortedResults[0].calculatedAt).toBeDefined();
  });
});