import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度を判定し優先度スコアで順序付けして表示する機能', () => {
  // SCEN-1547: [edge] 課題優先度スコア算出機能 - 影響度スコアの小数点計算結果が業務要件に従い丸められる
  test('影響度スコアの小数点が業務要件に従い四捨五入で整数に丸められる', () => {
    // Arrange: TextAnalysisServiceAdapterをモック化し、小数点を含む影響度スコアを返すよう設定
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn()
        .mockReturnValueOnce(54.7)      // 1番目の呼び出し: 54.7 → 期待値55に丸める
        .mockReturnValueOnce(62.384)    // 2番目の呼び出し: 62.384 → 期待値62に丸める
        .mockReturnValueOnce(99.999),   // 3番目の呼び出し: 99.999 → 期待値100に丸める
      classifyIssueSeverity: jest.fn(),
    };

    // 3つの課題入力パターンを準備
    const testCases: IssuePriorityScoringInput[] = [
      {
        issueId: 'issue-001',
        issueContent: 'Database connection timeout in production',
        occurrenceFrequency: 5,
        impactScore: 54.7,  // 小数点を含む
        affectedTeamCount: 2,
        resolutionDaysAverage: 1.5,
        reportingDate: '2024-01-15T09:00:00Z',
        teamId: 'team-a',
      },
      {
        issueId: 'issue-002',
        issueContent: 'API response delay during peak hours',
        occurrenceFrequency: 8,
        impactScore: 62.384,  // 小数点を含む
        affectedTeamCount: 3,
        resolutionDaysAverage: 2.0,
        reportingDate: '2024-01-15T10:30:00Z',
        teamId: 'team-b',
      },
      {
        issueId: 'issue-003',
        issueContent: 'Critical data loss risk detected',
        occurrenceFrequency: 12,
        impactScore: 99.999,  // 小数点を含む（99.999は100に丸まる）
        affectedTeamCount: 5,
        resolutionDaysAverage: 3.5,
        reportingDate: '2024-01-15T11:45:00Z',
        teamId: 'team-c',
      },
    ];

    // Act & Assert: 各テストケースについて、影響度スコアが正しく丸められることを検証
    const results: IssuePriorityScoringOutput[] = [];
    
    for (const testCase of testCases) {
      const result = calculateIssuePriorityScore(testCase, mockTextAnalysisAdapter as any);
      results.push(result);
    }

    // 1番目の結果: 54.7 → 55に丸められているか検証
    expect(results[0].scoreBreakdown.impactScore).toBe(55);
    expect(results[0].priorityScore).toBeGreaterThanOrEqual(1);
    expect(results[0].priorityScore).toBeLessThanOrEqual(100);

    // 2番目の結果: 62.384 → 62に丸められているか検証
    expect(results[1].scoreBreakdown.impactScore).toBe(62);
    expect(results[1].priorityScore).toBeGreaterThanOrEqual(1);
    expect(results[1].priorityScore).toBeLessThanOrEqual(100);

    // 3番目の結果: 99.999 → 100に丸められているか検証（業務要件：最大値100）
    expect(results[2].scoreBreakdown.impactScore).toBe(100);
    expect(results[2].priorityScore).toBeGreaterThanOrEqual(1);
    expect(results[2].priorityScore).toBeLessThanOrEqual(100);

    // 全ての結果が整数値であることを確認（丸め処理が完了していることの証拠）
    results.forEach((result) => {
      expect(Number.isInteger(result.scoreBreakdown.impactScore)).toBe(true);
      expect(Number.isInteger(result.priorityScore)).toBe(true);
    });

    // 各結果に必須フィールドが存在することを確認
    results.forEach((result) => {
      expect(result.issueId).toBeDefined();
      expect(result.priorityScore).toBeDefined();
      expect(result.priorityRank).toBeDefined();
      expect(result.scoreBreakdown).toBeDefined();
      expect(result.colorCode).toBeDefined();
      expect(result.calculatedAt).toBeDefined();
    });
  });
});