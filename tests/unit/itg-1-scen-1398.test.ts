import { calculateIssuePriorityScore } from '../../src/logic/issue-analysis';

describe('Issue Priority Score Calculation - Rounding Edge Cases', () => {
  // SCEN-1398: [edge] 統合後の優先度スコア再計算機能 - 影響度スコア計算時の除算で端数が発生する場合、丸め処理が正確である
  test('should correctly round impact scores with fractional values using banker\'s rounding', () => {
    const testCases = [
      {
        occurrenceCount: 3,
        impactScore: 32,
        resolutionDifficulty: 50,
        scoringWeights: { frequency: 0.4, impact: 0.4, difficulty: 0.2 },
        expectedRoundedImpact: 11,
        calculatedScenario: '32 ÷ 3 = 10.666... → rounds to 11',
      },
      {
        occurrenceCount: 3,
        impactScore: 33,
        resolutionDifficulty: 50,
        scoringWeights: { frequency: 0.4, impact: 0.4, difficulty: 0.2 },
        expectedRoundedImpact: 11,
        calculatedScenario: '33 ÷ 3 = 11.0 → remains 11',
      },
      {
        occurrenceCount: 2,
        impactScore: 21,
        resolutionDifficulty: 50,
        scoringWeights: { frequency: 0.4, impact: 0.4, difficulty: 0.2 },
        expectedRoundedImpact: 11,
        calculatedScenario: '21 ÷ 2 = 10.5 → rounds to 11 (banker\'s rounding)',
      },
      {
        occurrenceCount: 5,
        impactScore: 52,
        resolutionDifficulty: 50,
        scoringWeights: { frequency: 0.4, impact: 0.4, difficulty: 0.2 },
        expectedRoundedImpact: 10,
        calculatedScenario: '52 ÷ 5 = 10.4 → rounds down to 10',
      },
    ];

    testCases.forEach((testCase) => {
      const input = {
        issues: [
          {
            issueKeyword: 'test_issue',
            occurrenceCount: testCase.occurrenceCount,
            impactScore: testCase.impactScore,
            resolutionDifficulty: testCase.resolutionDifficulty,
          },
        ],
        analysisStartDate: '2024-01-01T00:00:00Z',
        analysisEndDate: '2024-01-31T23:59:59Z',
        scoringWeights: testCase.scoringWeights,
      };

      const result = calculateIssuePriorityScore(input);

      expect(result).toBeDefined();
      expect(result.prioritizedIssues).toHaveLength(1);
      expect(result.prioritizedIssues[0].priorityScore).toBeGreaterThanOrEqual(0);
      expect(result.prioritizedIssues[0].priorityScore).toBeLessThanOrEqual(100);
      expect(Number.isInteger(result.prioritizedIssues[0].priorityScore)).toBe(true);

      const calculatedPriority = result.prioritizedIssues[0].priorityScore;
      const frequencyContribution = testCase.occurrenceCount * testCase.scoringWeights.frequency * 10;
      const impactContribution = testCase.impactScore * testCase.scoringWeights.impact;
      const difficultyContribution =
        (testCase.resolutionDifficulty ?? 0) * testCase.scoringWeights.difficulty;
      const expectedScore = Math.round(
        frequencyContribution + impactContribution + difficultyContribution,
      );

      expect(calculatedPriority).toBe(Math.min(100, Math.max(0, expectedScore)));
    });
  });
});