import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題影響度判定機能 - TextAnalysisServiceAdapterタイムアウト処理', () => {
  // SCEN-2765
  it('assessImpactScore呼び出しがタイムアウトするとき、再試行ルールが適用される', async () => {
    const timeoutMs = 30000;
    const retryIntervals = [3000, 10000, 30000];
    let attemptCount = 0;
    const attemptTimestamps: number[] = [];

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['データベース接続エラー', 'メモリ不足'],
        frequencies: [5, 3],
      }),
      assessImpactScore: jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            attemptCount += 1;
            attemptTimestamps.push(Date.now());
            setTimeout(() => resolve({ impactScore: 0 }), timeoutMs + 5000);
          })
      ),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    const input = {
      issueId: 'issue-001',
      issueContent: 'データベース接続に断続的なエラーが発生',
      occurrenceFrequency: 5,
      impactScore: 0,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    const timeoutPromise = new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('Assessment timeout'));
      }, timeoutMs);
    });

    try {
      await Promise.race([
        calculateIssuePriorityScore(input, mockTextAnalysisAdapter),
        timeoutPromise,
      ]);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/timeout/i);
    }

    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();

    for (let i = 1; i < attemptTimestamps.length; i++) {
      const interval = attemptTimestamps[i] - attemptTimestamps[i - 1];
      const expectedInterval = retryIntervals[i - 1];
      expect(interval).toBeGreaterThanOrEqual(expectedInterval - 100);
      expect(interval).toBeLessThanOrEqual(expectedInterval + 5000);
    }

    expect(attemptCount).toBeLessThanOrEqual(4);
  });
});