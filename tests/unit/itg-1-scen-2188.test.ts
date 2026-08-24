import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-2188
  test('課題データの報告順序が異なる複数セットで計算された場合、優先度スコアは同じ結果になる', () => {
    const issueId = 'issue-001';
    const issueContent = 'API障害が発生し本番環境で顧客に影響が出ている';
    const occurrenceFrequency = 5;
    const impactScore = 85;
    const affectedTeamCount = 3;
    const resolutionDaysAverage = 4.5;
    const reportingDate = '2024-01-15';
    const teamId = 'team-dev-001';

    const dataset1: any = {
      issueId,
      issueContent,
      occurrenceFrequency,
      impactScore,
      affectedTeamCount,
      resolutionDaysAverage,
      reportingDate,
      teamId,
    };

    const dataset2: any = {
      teamId,
      reportingDate,
      resolutionDaysAverage,
      affectedTeamCount,
      impactScore,
      occurrenceFrequency,
      issueContent,
      issueId,
    };

    const dataset3: any = {
      affectedTeamCount,
      impactScore,
      issueId,
      teamId,
      occurrenceFrequency,
      reportingDate,
      issueContent,
      resolutionDaysAverage,
    };

    const result1 = calculateIssuePriorityScore(dataset1);
    const result2 = calculateIssuePriorityScore(dataset2);
    const result3 = calculateIssuePriorityScore(dataset3);

    expect(result1.priorityScore).toBe(result2.priorityScore);
    expect(result2.priorityScore).toBe(result3.priorityScore);
    expect(result1.priorityScore).toBe(result3.priorityScore);

    expect(result1.priorityRank).toBe(result2.priorityRank);
    expect(result2.priorityRank).toBe(result3.priorityRank);

    expect(result1.scoreBreakdown.frequencyScore).toBe(
      result2.scoreBreakdown.frequencyScore
    );
    expect(result2.scoreBreakdown.frequencyScore).toBe(
      result3.scoreBreakdown.frequencyScore
    );

    expect(result1.scoreBreakdown.impactScore).toBe(
      result2.scoreBreakdown.impactScore
    );
    expect(result2.scoreBreakdown.impactScore).toBe(
      result3.scoreBreakdown.impactScore
    );

    expect(result1.scoreBreakdown.resolutionDifficultyScore).toBe(
      result2.scoreBreakdown.resolutionDifficultyScore
    );
    expect(result2.scoreBreakdown.resolutionDifficultyScore).toBe(
      result3.scoreBreakdown.resolutionDifficultyScore
    );

    expect(result1.colorCode).toBe(result2.colorCode);
    expect(result2.colorCode).toBe(result3.colorCode);
  });
});