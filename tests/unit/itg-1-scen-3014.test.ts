import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア自動計算機能', () => {
  // SCEN-3014
  test('同一チーム内100件の報告から抽出された重複を含む課題が正確にスコア計算される', () => {
    const startTime = Date.now();

    const mockTextAnalysisService = {
      extractKeywords: jest.fn((text: string) => {
        if (text.includes('API認証エラー')) {
          return { keyword: 'API認証エラー', frequency: 1 };
        }
        if (text.includes('DB接続タイムアウト')) {
          return { keyword: 'DB接続タイムアウト', frequency: 1 };
        }
        if (text.includes('デプロイパイプライン失敗')) {
          return { keyword: 'デプロイパイプライン失敗', frequency: 1 };
        }
        return { keyword: 'その他', frequency: 1 };
      }),
      assessImpactScore: jest.fn((keyword: string, affectedTeamCount: number) => {
        if (keyword === 'API認証エラー') {
          return 85;
        }
        if (keyword === 'DB接続タイムアウト') {
          return 78;
        }
        if (keyword === 'デプロイパイプライン失敗') {
          return 72;
        }
        return 50;
      }),
      classifyIssueSeverity: jest.fn((keyword: string) => {
        if (keyword === 'API認証エラー') {
          return '高';
        }
        if (keyword === 'DB接続タイムアウト') {
          return '高';
        }
        if (keyword === 'デプロイパイプライン失敗') {
          return '中';
        }
        return '低';
      }),
    };

    const consolidatedChallenges = [
      {
        normalizedContent: 'API認証エラーが頻発している',
        mergedChallengeIds: ['ch_001', 'ch_002', 'ch_003', 'ch_004', 'ch_005'],
        aggregatedOccurrenceCount: 45,
      },
      {
        normalizedContent: 'DB接続タイムアウトが発生',
        mergedChallengeIds: ['ch_006', 'ch_007', 'ch_008'],
        aggregatedOccurrenceCount: 28,
      },
      {
        normalizedContent: 'デプロイパイプライン失敗',
        mergedChallengeIds: ['ch_009', 'ch_010'],
        aggregatedOccurrenceCount: 15,
      },
      {
        normalizedContent: 'ドキュメント不足',
        mergedChallengeIds: ['ch_011', 'ch_012'],
        aggregatedOccurrenceCount: 12,
      },
    ];

    const priorityScoringInputs: IssuePriorityScoringInput[] = consolidatedChallenges.map(
      (challenge, index) => ({
        issueId: `issue_${index}`,
        issueContent: challenge.normalizedContent,
        occurrenceFrequency: challenge.aggregatedOccurrenceCount,
        impactScore: mockTextAnalysisService.assessImpactScore(
          challenge.normalizedContent,
          1
        ),
        affectedTeamCount: 1,
        resolutionDaysAverage: 4.5,
        reportingDate: '2024-01-15',
        teamId: 'team_dev_001',
      })
    );

    const scoringResults: IssuePriorityScoringOutput[] = priorityScoringInputs.map(
      (input) => calculateIssuePriorityScore(input)
    );

    const endTime = Date.now();
    const executionTimeMs = endTime - startTime;

    expect(consolidatedChallenges).toHaveLength(4);
    expect(scoringResults).toHaveLength(4);

    const apiAuthResult = scoringResults.find(
      (r) => r.issueId === 'issue_0'
    );
    expect(apiAuthResult).toBeDefined();
    expect(apiAuthResult!.priorityScore).toBeGreaterThan(0);
    expect(apiAuthResult!.priorityScore).toBeLessThanOrEqual(100);
    expect(apiAuthResult!.priorityRank).toBe('高');
    expect(apiAuthResult!.colorCode).toBe('#FF0000');
    expect(apiAuthResult!.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(apiAuthResult!.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(apiAuthResult!.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(apiAuthResult!.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(apiAuthResult!.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(apiAuthResult!.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    const dbTimeoutResult = scoringResults.find(
      (r) => r.issueId === 'issue_1'
    );
    expect(dbTimeoutResult).toBeDefined();
    expect(dbTimeoutResult!.priorityScore).toBeGreaterThan(0);
    expect(dbTimeoutResult!.priorityScore).toBeLessThanOrEqual(100);
    expect(dbTimeoutResult!.priorityRank).toBe('高');
    expect(dbTimeoutResult!.colorCode).toBe('#FF0000');

    const deployResult = scoringResults.find(
      (r) => r.issueId === 'issue_2'
    );
    expect(deployResult).toBeDefined();
    expect(deployResult!.priorityScore).toBeGreaterThan(0);
    expect(deployResult!.priorityScore).toBeLessThanOrEqual(100);
    expect(deployResult!.priorityRank).toMatch(/^(高|中|低)$/);
    expect(deployResult!.colorCode).toMatch(/^#[0-9A-F]{6}$/);

    const documentResult = scoringResults.find(
      (r) => r.issueId === 'issue_3'
    );
    expect(documentResult).toBeDefined();
    expect(documentResult!.priorityScore).toBeGreaterThan(0);
    expect(documentResult!.priorityScore).toBeLessThanOrEqual(100);

    expect(apiAuthResult!.priorityScore).toBeGreaterThan(
      dbTimeoutResult!.priorityScore
    );
    expect(dbTimeoutResult!.priorityScore).toBeGreaterThan(
      deployResult!.priorityScore
    );

    scoringResults.forEach((result) => {
      expect(result.issueId).toMatch(/^issue_\d+$/);
      expect(result.priorityScore).toBeGreaterThanOrEqual(1);
      expect(result.priorityScore).toBeLessThanOrEqual(100);
      expect(result.priorityRank).toMatch(/^(高|中|低)$/);
      expect(result.scoreBreakdown.frequencyScore + 
              result.scoreBreakdown.impactScore + 
              result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(100);
      expect(result.calculatedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
      );
    });

    expect(executionTimeMs).toBeLessThan(30000);
  });
});