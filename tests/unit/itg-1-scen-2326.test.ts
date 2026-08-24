import { describe, test, expect } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次パフォーマンス分析', () => {
  // SCEN-2326
  test('課題解決速度分析機能 - 対応完了率の分母となる課題総数が0のとき処理を中止しエラーを返す', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue([]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: MonthlyReportDataset = {
      extractionPeriodStart: '2024-01-01T00:00:00Z',
      extractionPeriodEnd: '2024-01-31T23:59:59Z',
      totalReportCount: 5,
      reportsByTeam: [
        {
          teamId: 'team-001',
          reportCount: 5,
          submissionRate: 100,
          reportIds: ['report-001', 'report-002', 'report-003', 'report-004', 'report-005'],
        },
      ],
      dataQualityScore: 85,
      extractedAt: '2024-02-01T09:00:00Z',
    };

    expect(() =>
      extractMonthlyReportData(input, mockTextAnalysisAdapter)
    ).toThrow(/課題総数/);
  });
});