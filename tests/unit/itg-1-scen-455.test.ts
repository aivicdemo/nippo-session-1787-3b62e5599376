import { describe, test, expect } from '@jest/globals';
import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';

describe('Monthly Analysis Report Generation', () => {
  test('SCEN-455: should generate monthly analysis report with top priority challenges ranked by score', () => {
    const allChallengesWithScores = [
      {
        challengeId: 'C001',
        title: 'DB接続タイムアウト',
        priorityScore: 95,
        frequency: 12,
        impactLevel: '高',
      },
      {
        challengeId: 'C002',
        title: 'API応答遅延',
        priorityScore: 87,
        frequency: 8,
        impactLevel: '高',
      },
      {
        challengeId: 'C003',
        title: 'メモリリーク',
        priorityScore: 78,
        frequency: 5,
        impactLevel: '中',
      },
      {
        challengeId: 'C004',
        title: 'ログ出力不完全',
        priorityScore: 65,
        frequency: 3,
        impactLevel: '中',
      },
      {
        challengeId: 'C005',
        title: 'テストカバレッジ不足',
        priorityScore: 52,
        frequency: 2,
        impactLevel: '中',
      },
      {
        challengeId: 'C006',
        title: 'ドキュメント更新遅れ',
        priorityScore: 48,
        frequency: 1,
        impactLevel: '低',
      },
      {
        challengeId: 'C007',
        title: 'UI/UXの改善要望',
        priorityScore: 42,
        frequency: 1,
        impactLevel: '低',
      },
    ];

    const topNCount = 5;
    const minimumPriorityThreshold = 50;

    const result = generateMonthlyAnalysisReport(
      allChallengesWithScores,
      topNCount,
      minimumPriorityThreshold
    );

    expect(result).toHaveLength(5);

    expect(result[0]).toEqual({
      challengeId: 'C001',
      title: 'DB接続タイムアウト',
      priorityScore: 95,
      frequency: 12,
      impactLevel: '高',
      reportingRank: 1,
    });

    expect(result[1]).toEqual({
      challengeId: 'C002',
      title: 'API応答遅延',
      priorityScore: 87,
      frequency: 8,
      impactLevel: '高',
      reportingRank: 2,
    });

    expect(result[2]).toEqual({
      challengeId: 'C003',
      title: 'メモリリーク',
      priorityScore: 78,
      frequency: 5,
      impactLevel: '中',
      reportingRank: 3,
    });

    expect(result[3]).toEqual({
      challengeId: 'C004',
      title: 'ログ出力不完全',
      priorityScore: 65,
      frequency: 3,
      impactLevel: '中',
      reportingRank: 4,
    });

    expect(result[4]).toEqual({
      challengeId: 'C005',
      title: 'テストカバレッジ不足',
      priorityScore: 52,
      frequency: 2,
      impactLevel: '中',
      reportingRank: 5,
    });

    expect(result[0].priorityScore).toBe(95);
    expect(result[4].priorityScore).toBe(52);
    expect(result).toHaveLength(5);

    const isSortedByScore = result.every(
      (challenge, index, array) =>
        index === 0 || challenge.priorityScore <= array[index - 1].priorityScore
    );
    expect(isSortedByScore).toBe(true);

    result.forEach((challenge, index) => {
      expect(challenge.reportingRank).toBe(index + 1);
    });

    result.forEach((challenge) => {
      expect(challenge.priorityScore).toBeGreaterThanOrEqual(minimumPriorityThreshold);
    });
  });
});