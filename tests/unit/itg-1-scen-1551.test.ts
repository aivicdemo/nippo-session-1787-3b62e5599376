import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能 - 大規模データセット処理', () => {
  // SCEN-1551
  test('業務上の最大規模（全チーム、全メンバーの全週日報）でも優先度スコア計算が完了する', () => {
    const TEAM_COUNT = 20;
    const MEMBERS_PER_TEAM = 15;
    const TOTAL_MEMBERS = TEAM_COUNT * MEMBERS_PER_TEAM;
    const WEEKS_OF_DATA = 52;
    const TOTAL_REPORTS = TOTAL_MEMBERS * WEEKS_OF_DATA;
    const EXPECTED_COMPLETION_TIME_MS = 60000;

    const testInputs: IssuePriorityScoringInput[] = [];

    for (let teamIndex = 0; teamIndex < TEAM_COUNT; teamIndex++) {
      for (let memberIndex = 0; memberIndex < MEMBERS_PER_TEAM; memberIndex++) {
        for (let weekIndex = 0; weekIndex < WEEKS_OF_DATA; weekIndex++) {
          const issueId = `issue-t${teamIndex}-m${memberIndex}-w${weekIndex}`;
          const teamId = `team-${teamIndex}`;
          const reportingDate = new Date(
            2024,
            0,
            1 + weekIndex * 7
          ).toISOString();

          const input: IssuePriorityScoringInput = {
            issueId,
            issueContent: `Issue from team ${teamId}, member ${memberIndex}, week ${weekIndex}`,
            occurrenceFrequency: 2 + (weekIndex % 5),
            impactScore: 30 + (teamIndex % 5) * 10,
            affectedTeamCount: 1 + (memberIndex % 3),
            resolutionDaysAverage: 3 + (weekIndex % 7),
            reportingDate,
            teamId,
          };
          testInputs.push(input);
        }
      }
    }

    expect(testInputs.length).toBe(TOTAL_REPORTS);

    const startTime = performance.now();
    const results: IssuePriorityScoringOutput[] = [];

    for (const input of testInputs) {
      const result = calculateIssuePriorityScore(input);
      results.push(result);
    }

    const endTime = performance.now();
    const elapsedTime = endTime - startTime;

    expect(results.length).toBe(TOTAL_REPORTS);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const input = testInputs[i];

      expect(result).toBeDefined();
      expect(result.issueId).toBe(input.issueId);
      expect(typeof result.priorityScore).toBe('number');
      expect(result.priorityScore).toBeGreaterThanOrEqual(1);
      expect(result.priorityScore).toBeLessThanOrEqual(100);
      expect(['高', '中', '低']).toContain(result.priorityRank);
      expect(result.scoreBreakdown).toBeDefined();
      expect(typeof result.scoreBreakdown.frequencyScore).toBe('number');
      expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
      expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
      expect(typeof result.scoreBreakdown.impactScore).toBe('number');
      expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
      expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
      expect(typeof result.scoreBreakdown.resolutionDifficultyScore).toBe('number');
      expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
      expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
      expect(['#FF0000', '#FFFF00', '#00FF00']).toContain(result.colorCode);
      expect(typeof result.calculatedAt).toBe('string');
      expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    }

    const allScoresValid = results.every(
      (r) => r.priorityScore >= 1 && r.priorityScore <= 100
    );
    expect(allScoresValid).toBe(true);

    expect(elapsedTime).toBeLessThan(EXPECTED_COMPLETION_TIME_MS);

    const scoreBreakdownsValid = results.every((r) => {
      const totalBreakdown =
        r.scoreBreakdown.frequencyScore +
        r.scoreBreakdown.impactScore +
        r.scoreBreakdown.resolutionDifficultyScore;
      return totalBreakdown === r.priorityScore;
    });
    expect(scoreBreakdownsValid).toBe(true);
  });
});