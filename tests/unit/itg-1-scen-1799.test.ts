import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次レポート生成機能', () => {
  // SCEN-1799: [error] 月次レポート生成機能 - 課題傾向データが null の状態でレポート生成するとエラーになる
  test('課題傾向データが null の状態でレポート生成するとエラーを返す', () => {
    const targetYear = 2026;
    const targetMonth = 1;
    const requestedByUserId = 'user-department-head-001';
    const teamIdFilter = undefined;

    const textAnalysisServiceAdapterStub = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: '設計課題', frequency: 5, confidenceScore: 0.92 },
          { keyword: 'テスト遅延', frequency: 3, confidenceScore: 0.85 },
        ],
        originalText: 'Design challenges identified. Testing schedule at risk.',
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
        chunkRelevanceScores: [
          { chunk: '設計課題', score: 0.88 },
          { chunk: 'テスト遅延', score: 0.72 },
        ],
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
        confidence: 0.89,
      }),
    };

    const inputMonthlyExtractionRequest = {
      targetYear,
      targetMonth,
      requestedByUserId,
      teamIdFilter,
    };

    expect(() =>
      extractMonthlyReportData(inputMonthlyExtractionRequest, textAnalysisServiceAdapterStub)
    ).toThrow(/課題傾向データ/);
  });
});