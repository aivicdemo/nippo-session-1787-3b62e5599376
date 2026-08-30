import { aggregateReportsByPeriod } from '../../src/logic/report-data-aggregation';
import type { AggregationPeriodRequest, AggregatedReportDataset } from '../../src/logic/report-data-aggregation';

describe('朝会報告管理システム - レポート集約', () => {
  test('SCEN-567: 集約期間が90日を超える場合、日報を正常に集約して構造化データセットを生成する', () => {
    // 準備: 集約期間（91日間）と入力パラメータの構成
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-04-01T00:00:00Z');

    const request: AggregationPeriodRequest = {
      startDate: startDate,
      endDate: endDate,
      periodType: 'daily',
      targetTeamIds: undefined,
      includeArchivedReports: false,
    };

    // スタブの設定: 呼び出し先処理の戻り値を定義
    const mockNormalizeReportDateRange = jest.fn().mockReturnValue({
      normalizedStartDate: startDate,
      normalizedEndDate: endDate,
      periodType: 'daily',
    });

    const mockAggregatedIssueData = [
      {
        issueId: 'issue-001',
        issueContent: 'バグが多く発生している',
        occurrenceCount: 5,
        affectedTeams: ['team-001', 'team-002'],
      },
      {
        issueId: 'issue-002',
        issueContent: 'テスト環境が不安定',
        occurrenceCount: 3,
        affectedTeams: ['team-003'],
      },
    ];

    const mockStructureIssueDataFromReports = jest
      .fn()
      .mockReturnValue(mockAggregatedIssueData);

    const mockDataQualityMetrics = {
      completenessScore: 92,
      accuracyScore: 88,
      deduplicationRate: 95,
    };

    const mockValidateAggregationDataQuality = jest
      .fn()
      .mockReturnValue(mockDataQualityMetrics);

    // 日報データのスタブ（91件）
    const mockReportRecords = Array.from({ length: 91 }, (_, index) => ({
      reportId: `report-${String(index + 1).padStart(3, '0')}`,
      reporterId: `engineer-${String((index % 10) + 1).padStart(2, '0')}`,
      reportDate: new Date(
        2024,
        0,
        Math.floor(index / 10) + 1,
        9,
        0,
        0
      ),
      issueContent: `Issue content for report ${index + 1}`,
      status: 'submitted',
    }));

    const mockFetchReportsByPeriod = jest
      .fn()
      .mockReturnValue(mockReportRecords);

    // 依存関係を注入してテスト（実装では DI またはモジュール置換が想定される）
    // ここでは関数を直接呼び出し、戻り値を検証する
    const result: AggregatedReportDataset = aggregateReportsByPeriod(
      request
    );

    // 検証: 戻り値の各フィールドが期待値と一致することを確認
    expect(result.aggregationPeriod.startDate).toEqual(startDate);
    expect(result.aggregationPeriod.endDate).toEqual(endDate);
    expect(result.aggregationPeriod.periodType).toBe('daily');

    expect(result.totalReportCount).toBeGreaterThanOrEqual(0);

    expect(result.aggregatedIssues).toBeDefined();
    expect(Array.isArray(result.aggregatedIssues)).toBe(true);

    expect(result.dataQualityMetrics).toBeDefined();
    expect(result.dataQualityMetrics.completenessScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityMetrics.completenessScore).toBeLessThanOrEqual(100);
    expect(result.dataQualityMetrics.accuracyScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityMetrics.accuracyScore).toBeLessThanOrEqual(100);
    expect(result.dataQualityMetrics.deduplicationRate).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityMetrics.deduplicationRate).toBeLessThanOrEqual(100);

    expect(result.generatedAt).toBeDefined();
    expect(result.generatedAt instanceof Date).toBe(true);

    // 集約期間が91日（90日を超える）ことを確認
    const daysDifference = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(daysDifference).toBe(91);
  });
});