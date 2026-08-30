import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';

describe('extractAndRankIssuesFromReports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-349
  test('should extract and rank issues from multiple reports based on frequency and impact scores', () => {
    const rawChallenges = [
      { memberId: 'M001', date: '2025-01-13', challengeText: 'ビルド失敗' },
      { memberId: 'M002', date: '2025-01-13', challengeText: 'ビルドエラー' },
      { memberId: 'M001', date: '2025-01-12', challengeText: 'コンパイルエラー' },
      { memberId: 'M003', date: '2025-01-13', challengeText: 'ビルド失敗' },
    ];

    const challengeThesaurus = [
      {
        canonical: 'ビルド失敗',
        synonyms: ['ビルドエラー', 'コンパイルエラー', 'ビルド不成功'],
      },
    ];

    const impactWeights = { 'ビルド失敗': 80 };

    const analysisStartDate = new Date('2025-01-06T00:00:00Z');
    const analysisEndDate = new Date('2025-01-13T23:59:59Z');
    const minimumConfidenceThreshold = 50;

    const beforeCallTime = new Date();
    const result = extractAndRankIssuesFromReports(
      rawChallenges,
      challengeThesaurus,
      impactWeights,
      analysisStartDate,
      analysisEndDate,
      minimumConfidenceThreshold
    );
    const afterCallTime = new Date();

    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toEqual(
      expect.objectContaining({
        keyword: 'ビルド失敗',
        frequency: 4,
        impactScore: 80,
        priorityScore: expect.any(Number),
        priorityRank: '高',
      })
    );

    const expectedFrequencyScore = Math.min((4 / 7) * 100, 100);
    const expectedPriorityScore =
      expectedFrequencyScore * 0.4 + 80 * 0.6;
    const roundedPriorityScore = Math.round(expectedPriorityScore);

    expect(result.issues[0].priorityScore).toBe(roundedPriorityScore);
    expect(result.totalIssueCount).toBe(1);
    expect(result.analysisTimestamp.getTime()).toBeGreaterThanOrEqual(
      beforeCallTime.getTime()
    );
    expect(result.analysisTimestamp.getTime()).toBeLessThanOrEqual(
      afterCallTime.getTime() + 1000
    );
    expect(result.lowConfidenceIssueCount).toBe(0);
  });
});