import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-2372: [error] 朝会報告集約分析機能 - 影響度スコアの計算結果が範囲外（0-100以外）のとき処理がエラーになる
  test('影響度スコアが0-100の範囲外の値（101）を戻した場合、InvalidImpactScoreExceptionエラーをスローし、エラーメッセージに実績値101を含める', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          { keyword: 'システム障害', frequency: 3 },
          { keyword: 'ネットワーク遅延', frequency: 2 }
        ]
      }),
      assessImpactScore: jest.fn().mockReturnValue(101),
      classifyIssueSeverity: jest.fn().mockReturnValue('high')
    };

    const monthlyRequestInput = {
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: 'user-001',
      teamIdFilter: ['team-01']
    };

    expect(() =>
      extractMonthlyReportData(monthlyRequestInput, mockTextAnalysisServiceAdapter)
    ).toThrow(/影響度スコアが有効な範囲外です/);

    try {
      extractMonthlyReportData(monthlyRequestInput, mockTextAnalysisServiceAdapter);
    } catch (error: unknown) {
      const err = error as Error & { impactScore?: number; expectedRange?: string };
      expect(err.message).toMatch(/実績値：101/);
      expect(err.message).toMatch(/期待値：0-100/);
    }
  });
});