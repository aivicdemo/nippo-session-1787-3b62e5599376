import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('優先度の高い課題を部長向けダッシュボードで強調表示（色分け・ハイライト）する機能', () => {
  // SCEN-935: [normal] 課題優先度スコア計算・色分け表示機能 - 優先度スコア40以上70未満の課題に黄色ラベルを付与する
  test('優先度スコア40以上70未満の課題に黄色ラベル#FFD700を付与し、スコア70以上の課題にはラベルなしを確認', () => {
    const issueScore40 = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout',
      occurrenceFrequency: 5,
      impactScore: 45,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-01',
    };

    const issueScore50 = {
      issueId: 'issue-002',
      issueContent: 'API response latency issue',
      occurrenceFrequency: 8,
      impactScore: 55,
      affectedTeamCount: 3,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-01',
    };

    const issueScore60 = {
      issueId: 'issue-003',
      issueContent: 'Memory leak in production',
      occurrenceFrequency: 12,
      impactScore: 65,
      affectedTeamCount: 4,
      resolutionDaysAverage: 4,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-01',
    };

    const issueScore70 = {
      issueId: 'issue-004',
      issueContent: 'Critical security vulnerability',
      occurrenceFrequency: 15,
      impactScore: 85,
      affectedTeamCount: 5,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-01',
    };

    const result40 = calculateIssuePriorityScore(issueScore40);
    const result50 = calculateIssuePriorityScore(issueScore50);
    const result60 = calculateIssuePriorityScore(issueScore60);
    const result70 = calculateIssuePriorityScore(issueScore70);

    expect(result40.priorityScore).toBe(40);
    expect(result40.colorCode).toBe('#FFD700');

    expect(result50.priorityScore).toBe(50);
    expect(result50.colorCode).toBe('#FFD700');

    expect(result60.priorityScore).toBe(60);
    expect(result60.colorCode).toBe('#FFD700');

    expect(result70.priorityScore).toBe(70);
    expect(result70.colorCode).not.toBe('#FFD700');
  });
});