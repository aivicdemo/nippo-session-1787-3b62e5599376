import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア算出', () => {
  test('SCEN-148: 複数の課題を優先度スコアで順序付けしたとき、スコアが降順に整列される', () => {
    // 準備: 複数の課題オブジェクトを定義
    const issueA = {
      issueId: 'ISSUE-001',
      issueContent: 'Database connection timeout',
      occurrenceFrequency: 5,
      impactScore: 45,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'TEAM-001',
    };

    const issueB = {
      issueId: 'ISSUE-002',
      issueContent: 'API response delay',
      occurrenceFrequency: 8,
      impactScore: 78,
      affectedTeamCount: 4,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:15:00Z',
      teamId: 'TEAM-001',
    };

    const issueC = {
      issueId: 'ISSUE-003',
      issueContent: 'Log file size management',
      occurrenceFrequency: 2,
      impactScore: 32,
      affectedTeamCount: 1,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-15T09:30:00Z',
      teamId: 'TEAM-001',
    };

    const issueD = {
      issueId: 'ISSUE-004',
      issueContent: 'Production deployment failure',
      occurrenceFrequency: 12,
      impactScore: 89,
      affectedTeamCount: 5,
      resolutionDaysAverage: 4,
      reportingDate: '2024-01-15T09:45:00Z',
      teamId: 'TEAM-001',
    };

    // 実行: 各課題に対して優先度スコアを算出
    const priorityScoreA = calculateIssuePriorityScore(issueA);
    const priorityScoreB = calculateIssuePriorityScore(issueB);
    const priorityScoreC = calculateIssuePriorityScore(issueC);
    const priorityScoreD = calculateIssuePriorityScore(issueD);

    // 結果を配列に格納
    const priorityResults = [
      { issue: issueA, score: priorityScoreA },
      { issue: issueB, score: priorityScoreB },
      { issue: issueC, score: priorityScoreC },
      { issue: issueD, score: priorityScoreD },
    ];

    // 優先度スコアで降順にソート
    const sortedResults = priorityResults.sort(
      (a, b) => b.score.priorityScore - a.score.priorityScore
    );

    // 検証: ソート後の配列が降順に整列されていること
    expect(sortedResults[0].issue.issueId).toBe('ISSUE-004'); // 課題D（スコア最高）
    expect(sortedResults[1].issue.issueId).toBe('ISSUE-002'); // 課題B
    expect(sortedResults[2].issue.issueId).toBe('ISSUE-001'); // 課題A
    expect(sortedResults[3].issue.issueId).toBe('ISSUE-003'); // 課題C（スコア最低）

    // 優先度スコアが降順であることを確認
    expect(sortedResults[0].score.priorityScore).toBeGreaterThan(
      sortedResults[1].score.priorityScore
    );
    expect(sortedResults[1].score.priorityScore).toBeGreaterThan(
      sortedResults[2].score.priorityScore
    );
    expect(sortedResults[2].score.priorityScore).toBeGreaterThan(
      sortedResults[3].score.priorityScore
    );

    // 優先度ランクも検証（影響度スコアが高いほど「高」）
    expect(sortedResults[0].score.priorityRank).toBe('高');
    expect(sortedResults[3].score.priorityRank).toBe('低');

    // 色コードも降順に対応していることを検証
    expect(sortedResults[0].score.colorCode).toBe('#FF0000'); // 赤（最優先）
    expect(sortedResults[3].score.colorCode).toBe('#00FF00'); // 緑（低優先）
  });
});