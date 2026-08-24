import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコアの順序付け', () => {
  // SCEN-648: [edge] 課題優先度スコア計算機能 - 複数の課題の優先度スコアが逆順で入力された場合に昇順に並び替えられる
  test('複数の課題が逆順で入力された場合、返却される課題リストが優先度スコアで昇順に並び替えられること', () => {
    // 入力: 複数の課題オブジェクト（逆順: 85, 92, 45, 78）
    const input_issues = [
      {
        issueId: 'ISSUE-A',
        issueContent: 'テスト課題A',
        occurrenceFrequency: 5,
        impactScore: 70,
        affectedTeamCount: 2,
        resolutionDaysAverage: 3,
        reportingDate: '2024-01-15',
        teamId: 'TEAM-001',
      },
      {
        issueId: 'ISSUE-B',
        issueContent: 'テスト課題B',
        occurrenceFrequency: 8,
        impactScore: 85,
        affectedTeamCount: 3,
        resolutionDaysAverage: 2,
        reportingDate: '2024-01-15',
        teamId: 'TEAM-001',
      },
      {
        issueId: 'ISSUE-C',
        issueContent: 'テスト課題C',
        occurrenceFrequency: 2,
        impactScore: 40,
        affectedTeamCount: 1,
        resolutionDaysAverage: 5,
        reportingDate: '2024-01-15',
        teamId: 'TEAM-001',
      },
      {
        issueId: 'ISSUE-D',
        issueContent: 'テスト課題D',
        occurrenceFrequency: 6,
        impactScore: 65,
        affectedTeamCount: 2,
        resolutionDaysAverage: 3,
        reportingDate: '2024-01-15',
        teamId: 'TEAM-001',
      },
    ];

    // 実行: calculateIssuePriorityScore を呼び出して優先度スコアを計算
    const result_scores = input_issues.map(issue => {
      const score_result = calculateIssuePriorityScore(issue);
      return {
        issueId: score_result.issueId,
        priorityScore: score_result.priorityScore,
      };
    });

    // 昇順にソート
    const sorted_scores = result_scores.sort(
      (a, b) => a.priorityScore - b.priorityScore
    );

    // 期待結果: 昇順に並んでいることを検証
    // 課題C（スコア: 45）→ 課題D（スコア: 78）→ 課題A（スコア: 85）→ 課題B（スコア: 92）
    expect(sorted_scores[0].issueId).toBe('ISSUE-C');
    expect(sorted_scores[0].priorityScore).toBe(45);

    expect(sorted_scores[1].issueId).toBe('ISSUE-D');
    expect(sorted_scores[1].priorityScore).toBe(78);

    expect(sorted_scores[2].issueId).toBe('ISSUE-A');
    expect(sorted_scores[2].priorityScore).toBe(85);

    expect(sorted_scores[3].issueId).toBe('ISSUE-B');
    expect(sorted_scores[3].priorityScore).toBe(92);

    // 各課題オブジェクトのスコア値が計算値と一致することを確認
    expect(sorted_scores).toHaveLength(4);
    expect(sorted_scores.every(s => typeof s.priorityScore === 'number')).toBe(true);
    expect(sorted_scores.every(s => s.priorityScore >= 1 && s.priorityScore <= 100)).toBe(true);
  });
});