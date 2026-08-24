import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能 - 安定ソート', () => {
  test('SCEN-149: 同じ優先度スコアをもつ複数課題の相対順序が変わらない', () => {
    // テスト用の課題データを準備（同じ優先度スコアとなる条件）
    const issuesFirstRun = [
      {
        issueId: '1',
        issueContent: 'Issue A - Database connectivity timeout',
        occurrenceFrequency: 5,
        impactScore: 65,
        affectedTeamCount: 2,
        resolutionDaysAverage: 2.5,
        reportingDate: '2026-08-20',
        teamId: 'team-001',
      },
      {
        issueId: '2',
        issueContent: 'Issue B - API rate limiting exceeded',
        occurrenceFrequency: 5,
        impactScore: 65,
        affectedTeamCount: 2,
        resolutionDaysAverage: 2.5,
        reportingDate: '2026-08-20',
        teamId: 'team-001',
      },
      {
        issueId: '3',
        issueContent: 'Issue C - Memory leak in cache layer',
        occurrenceFrequency: 5,
        impactScore: 65,
        affectedTeamCount: 2,
        resolutionDaysAverage: 2.5,
        reportingDate: '2026-08-20',
        teamId: 'team-001',
      },
    ];

    // 1回目の実行: スコア算出処理を実行
    const resultsFirstRun = issuesFirstRun.map(issue =>
      calculateIssuePriorityScore({
        issueId: issue.issueId,
        issueContent: issue.issueContent,
        occurrenceFrequency: issue.occurrenceFrequency,
        impactScore: issue.impactScore,
        affectedTeamCount: issue.affectedTeamCount,
        resolutionDaysAverage: issue.resolutionDaysAverage,
        reportingDate: issue.reportingDate,
        teamId: issue.teamId,
      })
    );

    // 1回目の実行結果から順序を記録
    const orderedIdsFirstRun = resultsFirstRun.map(result => result.issueId);

    // 2回目の実行: 同じ課題データで再度スコア算出
    const issuesSecondRun = [
      {
        issueId: '1',
        issueContent: 'Issue A - Database connectivity timeout',
        occurrenceFrequency: 5,
        impactScore: 65,
        affectedTeamCount: 2,
        resolutionDaysAverage: 2.5,
        reportingDate: '2026-08-20',
        teamId: 'team-001',
      },
      {
        issueId: '2',
        issueContent: 'Issue B - API rate limiting exceeded',
        occurrenceFrequency: 5,
        impactScore: 65,
        affectedTeamCount: 2,
        resolutionDaysAverage: 2.5,
        reportingDate: '2026-08-20',
        teamId: 'team-001',
      },
      {
        issueId: '3',
        issueContent: 'Issue C - Memory leak in cache layer',
        occurrenceFrequency: 5,
        impactScore: 65,
        affectedTeamCount: 2,
        resolutionDaysAverage: 2.5,
        reportingDate: '2026-08-20',
        teamId: 'team-001',
      },
    ];

    const resultsSecondRun = issuesSecondRun.map(issue =>
      calculateIssuePriorityScore({
        issueId: issue.issueId,
        issueContent: issue.issueContent,
        occurrenceFrequency: issue.occurrenceFrequency,
        impactScore: issue.impactScore,
        affectedTeamCount: issue.affectedTeamCount,
        resolutionDaysAverage: issue.resolutionDaysAverage,
        reportingDate: issue.reportingDate,
        teamId: issue.teamId,
      })
    );

    // 2回目の実行結果から順序を記録
    const orderedIdsSecondRun = resultsSecondRun.map(result => result.issueId);

    // すべての課題が同じ優先度スコアを持つことを確認
    expect(resultsFirstRun[0].priorityScore).toBe(65);
    expect(resultsFirstRun[1].priorityScore).toBe(65);
    expect(resultsFirstRun[2].priorityScore).toBe(65);
    expect(resultsSecondRun[0].priorityScore).toBe(65);
    expect(resultsSecondRun[1].priorityScore).toBe(65);
    expect(resultsSecondRun[2].priorityScore).toBe(65);

    // 1回目と2回目の実行で相対順序が同じであることを確認（安定ソート）
    expect(orderedIdsFirstRun).toEqual(['1', '2', '3']);
    expect(orderedIdsSecondRun).toEqual(['1', '2', '3']);
    expect(orderedIdsFirstRun).toEqual(orderedIdsSecondRun);

    // すべての課題が「中」優先度ランクであることを確認
    expect(resultsFirstRun[0].priorityRank).toBe('中');
    expect(resultsFirstRun[1].priorityRank).toBe('中');
    expect(resultsFirstRun[2].priorityRank).toBe('中');
  });
});