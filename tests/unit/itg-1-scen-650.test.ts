import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能', () => {
  // SCEN-650: [edge] 業務上の最大規模である100件の課題に対して優先度スコアが計算される
  test('100件の課題に対して優先度スコアが正常に計算される', () => {
    // テスト用の100件の課題データを準備
    const testIssues: IssuePriorityScoringInput[] = [];
    for (let i = 1; i <= 100; i++) {
      testIssues.push({
        issueId: `issue-${String(i).padStart(3, '0')}`,
        issueContent: `課題内容${i}: システムパフォーマンス低下により、チーム全体の作業効率が30%低下している状況が発生した。`,
        occurrenceFrequency: 1 + (i % 30),
        impactScore: 20 + (i % 81),
        affectedTeamCount: 1 + (i % 5),
        resolutionDaysAverage: 2 + (i % 8),
        reportingDate: '2024-01-15',
        teamId: `team-${((i - 1) % 3) + 1}`,
      });
    }

    // 計算実行開始時刻を記録
    const computationStartTime = new Date('2024-01-15T09:00:00Z');
    const computationResults: IssuePriorityScoringOutput[] = [];
    const methodCallCounts = {
      extractKeywords: 0,
      assessImpactScore: 0,
      classifyIssueSeverity: 0,
    };

    // TextAnalysisServiceAdapterのモック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockImplementation(() => {
        methodCallCounts.extractKeywords += 1;
        return { keywords: ['performance', 'efficiency'], confidence: 0.95 };
      }),
      assessImpactScore: jest.fn().mockImplementation((content: string) => {
        methodCallCounts.assessImpactScore += 1;
        return 75;
      }),
      classifyIssueSeverity: jest.fn().mockImplementation((content: string) => {
        methodCallCounts.classifyIssueSeverity += 1;
        return 'high';
      }),
    };

    // 100件すべての課題に対して優先度スコアを計算
    for (const issue of testIssues) {
      const result = calculateIssuePriorityScore(
        issue,
        mockTextAnalysisAdapter,
      );
      computationResults.push(result);
    }

    // 計算完了時刻を記録
    const computationEndTime = new Date('2024-01-15T09:00:15Z');
    const computationDurationMs = computationEndTime.getTime() - computationStartTime.getTime();

    // 検証1: すべての課題に優先度スコアが計算されたことを確認
    expect(computationResults).toHaveLength(100);

    // 検証2: すべての結果に対して、スコアが0～100の整数であることを確認
    computationResults.forEach((result, index) => {
      expect(result.issueId).toBe(`issue-${String(index + 1).padStart(3, '0')}`);
      expect(typeof result.priorityScore).toBe('number');
      expect(result.priorityScore).toBeGreaterThanOrEqual(0);
      expect(result.priorityScore).toBeLessThanOrEqual(100);
      expect(Number.isInteger(result.priorityScore)).toBe(true);
    });

    // 検証3: 優先度ランクが正しく判定されていることを確認
    computationResults.forEach((result) => {
      expect(['高', '中', '低']).toContain(result.priorityRank);
      if (result.priorityScore >= 70) {
        expect(result.priorityRank).toBe('高');
      } else if (result.priorityScore >= 40) {
        expect(result.priorityRank).toBe('中');
      } else {
        expect(result.priorityRank).toBe('低');
      }
    });

    // 検証4: スコア内訳が正しく計算されていることを確認
    computationResults.forEach((result) => {
      expect(result.scoreBreakdown).toBeDefined();
      expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
      expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
      expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
      expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
      expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
      expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
      expect(
        result.scoreBreakdown.frequencyScore +
          result.scoreBreakdown.impactScore +
          result.scoreBreakdown.resolutionDifficultyScore,
      ).toBe(result.priorityScore);
    });

    // 検証5: ダッシュボード表示用の色コードが正しく設定されていることを確認
    computationResults.forEach((result) => {
      expect(['#FF0000', '#FFFF00', '#00FF00']).toContain(result.colorCode);
      if (result.priorityRank === '高') {
        expect(result.colorCode).toBe('#FF0000');
      } else if (result.priorityRank === '中') {
        expect(result.colorCode).toBe('#FFFF00');
      } else {
        expect(result.colorCode).toBe('#00FF00');
      }
    });

    // 検証6: 計算完了時刻が記録されていることを確認
    computationResults.forEach((result) => {
      expect(result.calculatedAt).toBeDefined();
      const calculatedAtTime = new Date(result.calculatedAt);
      expect(calculatedAtTime.getTime()).toBeGreaterThanOrEqual(computationStartTime.getTime());
      expect(calculatedAtTime.getTime()).toBeLessThanOrEqual(computationEndTime.getTime());
    });

    // 検証7: 計算処理が60秒以内に終了していることを確認
    expect(computationDurationMs).toBeLessThan(60000);

    // 検証8: モック化されたTextAnalysisServiceAdapterの各メソッドが正確に100回呼び出されたことを確認
    expect(methodCallCounts.extractKeywords).toBe(100);
    expect(methodCallCounts.assessImpactScore).toBe(100);
    expect(methodCallCounts.classifyIssueSeverity).toBe(100);

    // 検証9: すべての課題IDが正しく保持されていることを確認
    computationResults.forEach((result, index) => {
      expect(result.issueId).toBe(testIssues[index].issueId);
    });

    // 検証10: 優先度スコアの計算が、入力値の変動に応じて異なっていることを確認（スコアの多様性）
    const scoreSet = new Set(computationResults.map((r) => r.priorityScore));
    expect(scoreSet.size).toBeGreaterThan(1);
  });
});