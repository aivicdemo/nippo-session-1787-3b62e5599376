import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-952
  test('色分けルール設定の赤・黄・緑の閾値が定義されていないときエラーを返す', () => {
    const input_issueId = 'issue-001';
    const input_issueContent = 'Database connection timeout during batch processing';
    const input_occurrenceFrequency = 5;
    const input_impactScore = 85;
    const input_affectedTeamCount = 3;
    const input_resolutionDaysAverage = 2;
    const input_reportingDate = '2024-01-15T09:00:00Z';
    const input_teamId = 'team-dev-001';

    const result = calculateIssuePriorityScore({
      issueId: input_issueId,
      issueContent: input_issueContent,
      occurrenceFrequency: input_occurrenceFrequency,
      impactScore: input_impactScore,
      affectedTeamCount: input_affectedTeamCount,
      resolutionDaysAverage: input_resolutionDaysAverage,
      reportingDate: input_reportingDate,
      teamId: input_teamId,
    });

    expect(result).toHaveProperty('error');
    expect(result.error).toBe(true);
    expect(result).toHaveProperty('errorCode');
    expect(result.errorCode).toBe('THRESHOLD_NOT_CONFIGURED');
    expect(result).toHaveProperty('errorMessage');
    expect(result.errorMessage).toBe(
      '色分けルール設定の赤・黄・緑の閾値が定義されていません。管理画面から閾値を設定してください'
    );
    expect(result).toHaveProperty('displayScore');
    expect(result.displayScore).toBe(75);
    expect(result).toHaveProperty('colorCode');
    expect(result.colorCode).toBe('none');
  });
});