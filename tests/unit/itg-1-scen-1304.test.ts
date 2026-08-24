import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-1304
  test('[normal] 課題影響度判定機能 - 同一入力で2回実行しても同じ影響度判定結果が得られる', () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn(() => ({
        keywords: ['ネットワーク接続エラー'],
        frequency: 3,
      })),
      assessImpactScore: jest.fn(() => 75),
      classifyIssueSeverity: jest.fn(() => '高'),
    };

    const testInput: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: 'ネットワーク接続エラーが発生している',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 5,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-A',
    };

    const firstResult = calculateIssuePriorityScore(testInput, mockTextAnalysisService);

    const secondResult = calculateIssuePriorityScore(testInput, mockTextAnalysisService);

    expect(firstResult.priorityScore).toBe(secondResult.priorityScore);
    expect(firstResult.priorityRank).toBe(secondResult.priorityRank);
    expect(firstResult.scoreBreakdown.frequencyScore).toBe(secondResult.scoreBreakdown.frequencyScore);
    expect(firstResult.scoreBreakdown.impactScore).toBe(secondResult.scoreBreakdown.impactScore);
    expect(firstResult.scoreBreakdown.resolutionDifficultyScore).toBe(
      secondResult.scoreBreakdown.resolutionDifficultyScore
    );
    expect(firstResult.colorCode).toBe(secondResult.colorCode);

    expect(firstResult.priorityScore).toBeGreaterThanOrEqual(1);
    expect(firstResult.priorityScore).toBeLessThanOrEqual(100);
    expect(['高', '中', '低']).toContain(firstResult.priorityRank);
    expect(firstResult.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(firstResult.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(firstResult.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(firstResult.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(firstResult.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(firstResult.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(['#FF0000', '#FFFF00', '#00FF00']).toContain(firstResult.colorCode);
  });
});