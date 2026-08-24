import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算', () => {
  // SCEN-962: [edge] 課題優先度スコア計算・色分け表示機能 - 優先度スコアがちょうど赤色閾値（80点）のとき赤色で表示される
  test('優先度スコアが赤色閾値80点ときちょうど等しい場合、赤色コード#FF0000で表示される', () => {
    const issue_id = 'issue-001';
    const issue_content = 'データベース接続エラーが断続的に発生';
    const occurrence_frequency = 5;
    const impact_score = 80;
    const affected_team_count = 3;
    const resolution_days_average = 2.5;
    const reporting_date = '2024-01-15';
    const team_id = 'team-001';

    const result = calculateIssuePriorityScore({
      issueId: issue_id,
      issueContent: issue_content,
      occurrenceFrequency: occurrence_frequency,
      impactScore: impact_score,
      affectedTeamCount: affected_team_count,
      resolutionDaysAverage: resolution_days_average,
      reportingDate: reporting_date,
      teamId: team_id,
    });

    expect(result.issueId).toBe(issue_id);
    expect(result.priorityScore).toBe(80);
    expect(result.colorCode).toBe('#FF0000');
    expect(result.priorityRank).toBe('高');
  });
});