import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  test('SCEN-2305: 複数の課題データが優先度スコアの降順で逆順に入力された場合、正しく昇順に並べ替えられる', () => {
    const issueDataInput = [
      {
        issueId: 'issue-E',
        issueContent: 'テスト課題E',
        occurrenceFrequency: 3,
        impactScore: 50,
        affectedTeamCount: 2,
        resolutionDaysAverage: 4,
        reportingDate: '2024-01-15',
        teamId: 'team-001',
      },
      {
        issueId: 'issue-D',
        issueContent: 'テスト課題D',
        occurrenceFrequency: 2,
        impactScore: 40,
        affectedTeamCount: 1,
        resolutionDaysAverage: 3,
        reportingDate: '2024-01-15',
        teamId: 'team-001',
      },
      {
        issueId: 'issue-C',
        issueContent: 'テスト課題C',
        occurrenceFrequency: 5,
        impactScore: 70,
        affectedTeamCount: 3,
        resolutionDaysAverage: 6,
        reportingDate: '2024-01-15',
        teamId: 'team-001',
      },
      {
        issueId: 'issue-B',
        issueContent: 'テスト課題B',
        occurrenceFrequency: 4,
        impactScore: 60,
        affectedTeamCount: 2,
        resolutionDaysAverage: 5,
        reportingDate: '2024-01-15',
        teamId: 'team-001',
      },
      {
        issueId: 'issue-A',
        issueContent: 'テスト課題A',
        occurrenceFrequency: 6,
        impactScore: 65,
        affectedTeamCount: 3,
        resolutionDaysAverage: 5,
        reportingDate: '2024-01-15',
        teamId: 'team-001',
      },
    ];

    const result = issueDataInput.map(issue => calculateIssuePriorityScore(issue));

    expect(result).toHaveLength(5);

    expect(result[0].issueId).toBe('issue-E');
    expect(result[0].priorityScore).toBe(65);

    expect(result[1].issueId).toBe('issue-D');
    expect(result[1].priorityScore).toBe(58);

    expect(result[2].issueId).toBe('issue-C');
    expect(result[2].priorityScore).toBe(78);

    expect(result[3].issueId).toBe('issue-B');
    expect(result[3].priorityScore).toBe(72);

    expect(result[4].issueId).toBe('issue-A');
    expect(result[4].priorityScore).toBe(85);

    const sortedResult = [...result].sort((a, b) => a.priorityScore - b.priorityScore);

    expect(sortedResult[0].priorityScore).toBe(58);
    expect(sortedResult[1].priorityScore).toBe(65);
    expect(sortedResult[2].priorityScore).toBe(72);
    expect(sortedResult[3].priorityScore).toBe(78);
    expect(sortedResult[4].priorityScore).toBe(85);

    expect(sortedResult[0].issueId).toBe('issue-D');
    expect(sortedResult[1].issueId).toBe('issue-E');
    expect(sortedResult[2].issueId).toBe('issue-B');
    expect(sortedResult[3].issueId).toBe('issue-C');
    expect(sortedResult[4].issueId).toBe('issue-A');
  });
});