import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('月次レポート生成機能 - 課題傾向集計', () => {
  // SCEN-1788
  test('前月の日報が1件の場合、その1件の課題傾向がレポートに集計される', () => {
    const targetYear = 2024;
    const targetMonth = 1;
    const previousMonthStart = new Date('2024-01-01T00:00:00Z');
    const previousMonthEnd = new Date('2024-01-31T23:59:59Z');

    const mockReportRecord = {
      reportId: 'report-001',
      reportDate: new Date('2024-01-15T09:30:00Z'),
      teamId: 'team-001',
      authorId: 'user-001',
      yesterdayAccomplishment: 'レポート作成',
      todayPlan: 'データ分析',
      challengeDescription: 'データベース接続エラーの断続的な発生',
      submittedAt: new Date('2024-01-15T09:30:00Z'),
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          {
            keyword: 'データベース接続エラー',
            occurrenceCount: 1,
          },
        ],
      }),
      assessImpactScore: jest.fn().mockReturnValue({
        keyword: 'データベース接続エラー',
        impactScore: 65,
      }),
      classifyIssueSeverity: jest.fn().mockReturnValue({
        text: 'データベース接続エラーの断続的な発生',
        severity: '中',
      }),
    };

    const result = extractMonthlyReportData(
      {
        targetYear,
        targetMonth,
        requestedByUserId: 'user-admin-001',
      },
      mockTextAnalysisAdapter,
      [mockReportRecord]
    );

    expect(result).toBeDefined();
    expect(result.extractionPeriodStart).toBe('2024-01-01T00:00:00Z');
    expect(result.extractionPeriodEnd).toBe('2024-01-31T23:59:59Z');
    expect(result.totalReportCount).toBe(1);

    expect(result.reportsByTeam).toHaveLength(1);
    expect(result.reportsByTeam[0]).toMatchObject({
      teamId: 'team-001',
      reportCount: 1,
      submissionRate: 100,
      reportIds: ['report-001'],
    });

    expect(result.issueTrendSummary).toBeDefined();
    expect(result.issueTrendSummary.extractedIssues).toHaveLength(1);

    const extractedIssue = result.issueTrendSummary.extractedIssues[0];
    expect(extractedIssue).toMatchObject({
      issueKeyword: 'データベース接続エラー',
      impactScore: 65,
      severity: '中',
      detectionCount: 1,
      occurrenceFrequency: 1,
    });

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    expect(result.extractedAt).toBeDefined();
    expect(typeof result.extractedAt).toBe('string');

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      mockReportRecord.challengeDescription
    );
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledWith(
      'データベース接続エラー'
    );
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).toHaveBeenCalledWith(
      'データベース接続エラーの断続的な発生'
    );
  });
});