import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('月次レポート生成機能 - 前月の日報データがちょうど1件の状態でレポート生成されて集計される', () => {
  it('SCEN-1817: 日報データ1件から課題キーワードを抽出し、発生頻度と影響度スコアで集計したレポートが生成される', async () => {
    const targetYear = 2024;
    const targetMonth = 1;
    const reportedByUserId = 'user-001';
    const reportedDate = new Date('2024-01-15T10:00:00Z');

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['APIレスポンス', '遅延'],
        frequencies: [1, 1],
      }),
      assessImpactScore: jest.fn().mockImplementation((keyword) => {
        if (keyword === 'APIレスポンス') return Promise.resolve({ score: 45 });
        if (keyword === '遅延') return Promise.resolve({ score: 52 });
        return Promise.resolve({ score: 0 });
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: 'high' }),
    };

    const reportRecords = [
      {
        reportId: 'report-001',
        userId: reportedByUserId,
        reportDate: reportedDate,
        yesterdayAccomplishment: '機能A実装',
        todayPlan: '機能B実装',
        issues: 'APIレスポンス遅延',
      },
    ];

    const input = {
      targetYear,
      targetMonth,
      requestedByUserId: 'manager-001',
      reportDataset: reportRecords,
      textAnalysisServiceAdapter: mockTextAnalysisServiceAdapter,
    };

    const result = await extractMonthlyReportData(input);

    expect(result.totalReportCount).toBe(1);
    expect(result.reportsByTeam).toBeDefined();
    expect(result.reportsByTeam.length).toBeGreaterThan(0);

    expect(result.extractedAt).toBeDefined();
    const extractedDate = new Date(result.extractedAt);
    expect(extractedDate instanceof Date).toBe(true);

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    expect(result.extractionPeriodStart).toContain('2024-01-01');
    expect(result.extractionPeriodEnd).toContain('2024-01-31');

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(
      'APIレスポンス遅延'
    );

    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledWith(
      'APIレスポンス'
    );
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledWith('遅延');

    const firstTeamSummary = result.reportsByTeam[0];
    expect(firstTeamSummary.reportCount).toBe(1);
    expect(firstTeamSummary.reportIds).toContain('report-001');
    expect(firstTeamSummary.submissionRate).toBeGreaterThanOrEqual(0);
    expect(firstTeamSummary.submissionRate).toBeLessThanOrEqual(100);
  });
});