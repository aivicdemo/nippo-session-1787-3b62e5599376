import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-1660: [edge] 課題影響度判定機能 - 課題の波及度スコアが50を超える場合、高優先度に分類される
  test('波及度スコアが50を超える場合、優先度分類が高優先度となる', () => {
    const testCases = [
      {
        impactScore: 51,
        expectedPriorityRank: '高',
        expectedColorCode: '#FF0000',
      },
      {
        impactScore: 75,
        expectedPriorityRank: '高',
        expectedColorCode: '#FF0000',
      },
      {
        impactScore: 100,
        expectedPriorityRank: '高',
        expectedColorCode: '#FF0000',
      },
    ];

    testCases.forEach((testCase) => {
      const input = {
        issueId: 'issue-001',
        issueContent: 'テスト課題の内容',
        occurrenceFrequency: 5,
        impactScore: testCase.impactScore,
        affectedTeamCount: 2,
        resolutionDaysAverage: 3,
        reportingDate: '2024-01-15',
        teamId: 'team-001',
      };

      const result = calculateIssuePriorityScore(input);

      expect(result.priorityRank).toBe(testCase.expectedPriorityRank);
      expect(result.colorCode).toBe(testCase.expectedColorCode);
      expect(result.priorityScore).toBeGreaterThan(70);
    });

    // 波及度スコア50以下のケース検証
    const lowImpactCases = [
      {
        impactScore: 50,
        shouldNotBeHigh: true,
      },
      {
        impactScore: 30,
        shouldNotBeHigh: true,
      },
      {
        impactScore: 0,
        shouldNotBeHigh: true,
      },
    ];

    lowImpactCases.forEach((testCase) => {
      const input = {
        issueId: 'issue-low-' + testCase.impactScore,
        issueContent: 'テスト課題の内容',
        occurrenceFrequency: 5,
        impactScore: testCase.impactScore,
        affectedTeamCount: 2,
        resolutionDaysAverage: 3,
        reportingDate: '2024-01-15',
        teamId: 'team-001',
      };

      const result = calculateIssuePriorityScore(input);

      if (testCase.shouldNotBeHigh) {
        expect(result.priorityRank).not.toBe('高');
      }
    });
  });
});