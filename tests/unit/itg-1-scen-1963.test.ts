import { describe, test, expect } from '@jest/globals';
import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';
import type { IssueTimeSeriesRecord, BottleneckTrendAnalysisResult } from '../../src/logic/monthly-performance-analysis';

describe('月次課題ボトルネック時系列分析 - 年度をまたぐ期間のデータ分離', () => {
  // SCEN-1963
  test('年度をまたぐ分析期間で年ごとの課題データが正しく分離される', () => {
    // 前年度（2025年1月～3月）の課題時系列データ
    const fy2025IssueData: IssueTimeSeriesRecord[] = [
      {
        issueId: 'issue-auth-2025-01',
        recordDate: new Date('2025-01-10'),
        occurrenceCount: 2,
        impactScore: 45,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'open',
      },
      {
        issueId: 'issue-auth-2025-01',
        recordDate: new Date('2025-01-15'),
        occurrenceCount: 3,
        impactScore: 50,
        resolutionDaysElapsed: 8,
        resolutionStatus: 'in_progress',
      },
      {
        issueId: 'issue-auth-2025-01',
        recordDate: new Date('2025-02-05'),
        occurrenceCount: 1,
        impactScore: 40,
        resolutionDaysElapsed: 26,
        resolutionStatus: 'resolved',
      },
      {
        issueId: 'issue-perf-2025-02',
        recordDate: new Date('2025-02-10'),
        occurrenceCount: 4,
        impactScore: 65,
        resolutionDaysElapsed: 5,
        resolutionStatus: 'open',
      },
      {
        issueId: 'issue-perf-2025-02',
        recordDate: new Date('2025-03-01'),
        occurrenceCount: 2,
        impactScore: 60,
        resolutionDaysElapsed: 19,
        resolutionStatus: 'in_progress',
      },
    ];

    // 当年度（2026年1月～3月）の課題時系列データ
    const fy2026IssueData: IssueTimeSeriesRecord[] = [
      {
        issueId: 'issue-auth-2026-01',
        recordDate: new Date('2026-01-12'),
        occurrenceCount: 1,
        impactScore: 35,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'open',
      },
      {
        issueId: 'issue-auth-2026-01',
        recordDate: new Date('2026-01-20'),
        occurrenceCount: 2,
        impactScore: 42,
        resolutionDaysElapsed: 8,
        resolutionStatus: 'in_progress',
      },
      {
        issueId: 'issue-db-2026-03',
        recordDate: new Date('2026-03-05'),
        occurrenceCount: 5,
        impactScore: 75,
        resolutionDaysElapsed: 7,
        resolutionStatus: 'open',
      },
      {
        issueId: 'issue-db-2026-03',
        recordDate: new Date('2026-03-15'),
        occurrenceCount: 3,
        impactScore: 70,
        resolutionDaysElapsed: 17,
        resolutionStatus: 'in_progress',
      },
    ];

    // 年度をまたぐ分析期間
    const analysisStartDate = new Date('2025-01-01T00:00:00Z');
    const analysisEndDate = new Date('2026-03-31T23:59:59Z');

    // 全課題時系列データ（2025年度と2026年度を統合）
    const allIssueData: IssueTimeSeriesRecord[] = [
      ...fy2025IssueData,
      ...fy2026IssueData,
    ];

    // 分析実行
    const result = analyzeBottleneckTrendWithTimeSeries({
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData: allIssueData,
      minimumDataPointsThreshold: 3,
      outlierDetectionEnabled: true,
    });

    // 2025年度のデータが正しく分離されていることを検証
    const fy2025Results = result.filter(
      (r) =>
        r.timeSeriesTrendData.some((point) => point.date.getFullYear() === 2025)
    );

    // 2026年度のデータが正しく分離されていることを検証
    const fy2026Results = result.filter(
      (r) =>
        r.timeSeriesTrendData.some((point) => point.date.getFullYear() === 2026)
    );

    // 2025年度の課題IDが2026年度のデータに含まれていないことを確認
    const fy2025IssueIds = new Set(
      fy2025IssueData.map((record) => record.issueId)
    );
    const fy2026IssueIds = new Set(
      fy2026IssueData.map((record) => record.issueId)
    );

    // 2025年度の課題は2026年度に存在しないことを確認
    fy2025IssueIds.forEach((issueId2025) => {
      expect(fy2026IssueIds.has(issueId2025)).toBe(false);
    });

    // 2026年度の課題は2025年度に存在しないことを確認
    fy2026IssueIds.forEach((issueId2026) => {
      expect(fy2025IssueIds.has(issueId2026)).toBe(false);
    });

    // 2025年度分析結果の各レコードが2025年のデータのみを含むことを検証
    fy2025Results.forEach((analysisResult) => {
      analysisResult.timeSeriesTrendData.forEach((trendPoint) => {
        expect(trendPoint.date.getFullYear()).toBe(2025);
      });

      // 2025年度の課題IDであることを確認
      expect(fy2025IssueIds.has(analysisResult.issueId)).toBe(true);
    });

    // 2026年度分析結果の各レコードが2026年のデータのみを含むことを検証
    fy2026Results.forEach((analysisResult) => {
      analysisResult.timeSeriesTrendData.forEach((trendPoint) => {
        expect(trendPoint.date.getFullYear()).toBe(2026);
      });

      // 2026年度の課題IDであることを確認
      expect(fy2026IssueIds.has(analysisResult.issueId)).toBe(true);
    });

    // 分析結果にデータが含まれていることを確認
    expect(result.length).toBeGreaterThan(0);

    // 2025年度と2026年度の分析結果が共存していることを確認
    expect(fy2025Results.length).toBeGreaterThan(0);
    expect(fy2026Results.length).toBeGreaterThan(0);

    // 各分析結果が必須フィールドを持つことを確認
    result.forEach((analysisResult: BottleneckTrendAnalysisResult) => {
      expect(analysisResult.issueId).toBeDefined();
      expect(typeof analysisResult.issueId).toBe('string');

      expect(analysisResult.bottleneckSeverityRank).toBeDefined();
      expect(['critical', 'high', 'medium', 'low']).toContain(
        analysisResult.bottleneckSeverityRank
      );

      expect(analysisResult.bottleneckSeverityScore).toBeDefined();
      expect(typeof analysisResult.bottleneckSeverityScore).toBe('number');
      expect(analysisResult.bottleneckSeverityScore).toBeGreaterThanOrEqual(0);
      expect(analysisResult.bottleneckSeverityScore).toBeLessThanOrEqual(100);

      expect(analysisResult.improvementTrend).toBeDefined();
      expect(['improving', 'stable', 'deteriorating']).toContain(
        analysisResult.improvementTrend
      );

      expect(analysisResult.averageResolutionDays).toBeDefined();
      expect(typeof analysisResult.averageResolutionDays).toBe('number');
      expect(analysisResult.averageResolutionDays).toBeGreaterThanOrEqual(0);

      expect(analysisResult.peakOccurrenceDate).toBeDefined();
      expect(analysisResult.peakOccurrenceDate).toBeInstanceOf(Date);

      expect(analysisResult.timeSeriesTrendData).toBeDefined();
      expect(Array.isArray(analysisResult.timeSeriesTrendData)).toBe(true);
      expect(analysisResult.timeSeriesTrendData.length).toBeGreaterThan(0);
    });
  });
});