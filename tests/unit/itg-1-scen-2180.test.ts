import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-2180
  test('[edge] 影響度スコアが上限直下（99）の課題は上限値より低い優先度で順序付けされる', () => {
    // 影響度スコア99の課題オブジェクト
    const issueWith99ImpactScore = {
      issueId: 'issue-99',
      issueContent: 'テストケース用課題',
      occurrenceFrequency: 5,
      impactScore: 99,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    // 影響度スコア100（上限値）の課題オブジェクト
    const issueWith100ImpactScore = {
      issueId: 'issue-100',
      issueContent: 'テストケース用課題',
      occurrenceFrequency: 5,
      impactScore: 100,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    // 影響度スコア99の課題の優先度スコアを算出
    const resultWith99Impact = calculateIssuePriorityScore(issueWith99ImpactScore);

    // 影響度スコア100の課題の優先度スコアを算出
    const resultWith100Impact = calculateIssuePriorityScore(issueWith100ImpactScore);

    // 影響度スコア99の課題の優先度スコアが100より小さいことを検証
    expect(resultWith99Impact.priorityScore).toBeLessThan(
      resultWith100Impact.priorityScore
    );

    // 優先度スコアが数値であることを確認
    expect(typeof resultWith99Impact.priorityScore).toBe('number');
    expect(typeof resultWith100Impact.priorityScore).toBe('number');

    // スコアが1～100の範囲内であることを確認
    expect(resultWith99Impact.priorityScore).toBeGreaterThanOrEqual(1);
    expect(resultWith99Impact.priorityScore).toBeLessThanOrEqual(100);
    expect(resultWith100Impact.priorityScore).toBeGreaterThanOrEqual(1);
    expect(resultWith100Impact.priorityScore).toBeLessThanOrEqual(100);
  });
});