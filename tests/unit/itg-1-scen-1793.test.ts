import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';
import type { MonthlyReportDataset, TeamReportSummary } from '../../src/logic/monthly-performance-analysis';

// SCEN-1793: [normal] 月次レポート生成機能 - 生成されたレポートでTextAnalysisServiceAdapterが正常応答した場合の課題分析結果が含まれる
describe('Monthly Report Data Extraction with TextAnalysisServiceAdapter', () => {
  test('should include analyzed issue keywords with impact scores and severity classifications when TextAnalysisServiceAdapter responds successfully', () => {
    // Mock TextAnalysisServiceAdapter
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn((text: string) => ({
        keywords: [
          { keyword: 'デバッグ遅延', frequency: 8 },
          { keyword: 'API連携エラー', frequency: 5 },
          { keyword: 'パフォーマンス低下', frequency: 3 }
        ]
      })),
      assessImpactScore: jest.fn((keyword: string) => {
        const scoreMap: Record<string, number> = {
          'デバッグ遅延': 85,
          'API連携エラー': 72,
          'パフォーマンス低下': 45
        };
        return scoreMap[keyword] || 50;
      }),
      classifyIssueSeverity: jest.fn((text: string) => {
        if (text.includes('デバッグ遅延')) return '高';
        if (text.includes('API連携エラー')) return '高';
        if (text.includes('パフォーマンス低下')) return '中';
        return '低';
      })
    };

    // Test data: 10 team members, multiple days in a month
    const targetYear = 2024;
    const targetMonth = 1;
    const requestedByUserId = 'user-001';

    const reportDataset: MonthlyReportDataset = {
      extractionPeriodStart: '2024-01-01T00:00:00Z',
      extractionPeriodEnd: '2024-01-31T23:59:59Z',
      totalReportCount: 40, // 10 members × 4 days (sample)
      reportsByTeam: [
        {
          teamId: 'team-001',
          reportCount: 20,
          submissionRate: 100,
          reportIds: Array.from({ length: 20 }, (_, i) => `report-${i + 1}`)
        },
        {
          teamId: 'team-002',
          reportCount: 20,
          submissionRate: 100,
          reportIds: Array.from({ length: 20 }, (_, i) => `report-${i + 21}`)
        }
      ],
      dataQualityScore: 92,
      extractedAt: '2024-02-01T10:30:00Z'
    };

    // Sample report texts with issue keywords
    const reportTexts = [
      'デバッグ遅延が発生しています。ログ出力に時間がかかっています。',
      'API連携エラーが発生しました。外部システムのレスポンス遅延が原因です。',
      'パフォーマンス低下を確認しています。メモリ使用率が高くなっています。',
      'デバッグ遅延により進捗が遅れています。ブレークポイント設定に問題があります。'
    ];

    // Simulate calling TextAnalysisServiceAdapter for each report
    let callCount = 0;
    reportTexts.forEach(() => {
      mockTextAnalysisServiceAdapter.extractKeywords('any text');
      mockTextAnalysisServiceAdapter.assessImpactScore('デバッグ遅延');
      mockTextAnalysisServiceAdapter.classifyIssueSeverity('any text');
      callCount += 3;
    });

    // Execute the function
    const result = extractMonthlyReportData(
      targetYear,
      targetMonth,
      requestedByUserId,
      ['team-001', 'team-002'],
      mockTextAnalysisServiceAdapter
    );

    // Verify the result structure
    expect(result).toHaveProperty('extractionPeriodStart');
    expect(result).toHaveProperty('extractionPeriodEnd');
    expect(result).toHaveProperty('totalReportCount');
    expect(result).toHaveProperty('reportsByTeam');
    expect(result).toHaveProperty('dataQualityScore');
    expect(result).toHaveProperty('extractedAt');
    expect(result).toHaveProperty('issueAnalysisResult');

    // Verify extraction period
    expect(result.extractionPeriodStart).toBe('2024-01-01T00:00:00Z');
    expect(result.extractionPeriodEnd).toBe('2024-01-31T23:59:59Z');

    // Verify total report count
    expect(result.totalReportCount).toBe(40);

    // Verify data quality score
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // Verify issue analysis result contains keywords
    expect(result.issueAnalysisResult).toBeDefined();
    expect(Array.isArray(result.issueAnalysisResult.analyzedKeywords)).toBe(true);
    expect(result.issueAnalysisResult.analyzedKeywords.length).toBeGreaterThan(0);

    // Verify each analyzed keyword contains required fields
    result.issueAnalysisResult.analyzedKeywords.forEach((issue: any) => {
      expect(issue).toHaveProperty('keyword');
      expect(issue).toHaveProperty('impactScore');
      expect(issue).toHaveProperty('severity');
      expect(typeof issue.keyword).toBe('string');
      expect(typeof issue.impactScore).toBe('number');
      expect(['高', '中', '低']).toContain(issue.severity);
      expect(issue.impactScore).toBeGreaterThanOrEqual(0);
      expect(issue.impactScore).toBeLessThanOrEqual(100);
    });

    // Verify that mock adapter methods were called
    expect(mockTextAnalysisServiceAdapter.extractKeywords.mock.calls.length).toBeGreaterThan(0);
    expect(mockTextAnalysisServiceAdapter.assessImpactScore.mock.calls.length).toBeGreaterThan(0);
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity.mock.calls.length).toBeGreaterThan(0);

    // Verify specific keyword is present in analysis
    const keywordNames = result.issueAnalysisResult.analyzedKeywords.map((k: any) => k.keyword);
    expect(keywordNames).toContain('デバッグ遅延');
    expect(keywordNames).toContain('API連携エラー');

    // Verify specific impact scores
    const debugDelayIssue = result.issueAnalysisResult.analyzedKeywords.find(
      (k: any) => k.keyword === 'デバッグ遅延'
    );
    expect(debugDelayIssue).toBeDefined();
    expect(debugDelayIssue.impactScore).toBe(85);
    expect(debugDelayIssue.severity).toBe('高');

    const apiErrorIssue = result.issueAnalysisResult.analyzedKeywords.find(
      (k: any) => k.keyword === 'API連携エラー'
    );
    expect(apiErrorIssue).toBeDefined();
    expect(apiErrorIssue.impactScore).toBe(72);
    expect(apiErrorIssue.severity).toBe('高');

    // Verify teams report data integrity
    expect(result.reportsByTeam.length).toBe(2);
    expect(result.reportsByTeam[0].teamId).toBe('team-001');
    expect(result.reportsByTeam[0].reportCount).toBe(20);
    expect(result.reportsByTeam[0].submissionRate).toBe(100);
    expect(result.reportsByTeam[1].teamId).toBe('team-002');
    expect(result.reportsByTeam[1].reportCount).toBe(20);
    expect(result.reportsByTeam[1].submissionRate).toBe(100);
  });
});