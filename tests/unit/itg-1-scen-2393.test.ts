import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次データ集約・アーカイブ機能', () => {
  // SCEN-2393: [normal] 日報データ集約・アーカイブ機能 - 集約期間が0件の場合、現用領域のデータが変更されない
  test('should leave production data unchanged when aggregation period contains zero reports', () => {
    // Arrange: 集約対象外の日報データを3件事前登録
    const existingReportsInProduction = [
      {
        reportId: 'report-001',
        reportDate: '2025-01-01',
        teamId: 'team-alpha',
        submittedBy: 'user-001',
        content: 'Previous report 1',
      },
      {
        reportId: 'report-002',
        reportDate: '2025-01-02',
        teamId: 'team-alpha',
        submittedBy: 'user-002',
        content: 'Previous report 2',
      },
      {
        reportId: 'report-003',
        reportDate: '2025-01-15',
        teamId: 'team-beta',
        submittedBy: 'user-003',
        content: 'Previous report 3',
      },
    ];

    // 集約期間を設定（この期間には日報データが0件）
    const aggregationStartDate = new Date('2025-02-01T00:00:00Z');
    const aggregationEndDate = new Date('2025-02-28T23:59:59Z');

    // 集約対象期間に該当する日報データは存在しない
    const reportsInAggregationPeriod: any[] = [];

    // Act: 集約処理を実行
    const result = extractMonthlyReportData({
      aggregationStartDate,
      aggregationEndDate,
      existingProductionRecords: existingReportsInProduction,
      aggregationRecords: reportsInAggregationPeriod,
    });

    // Assert: 集約処理は正常完了
    expect(result.status).toBe('completed');
    expect(result.processedCount).toBe(0);
    expect(result.skippedCount).toBe(0);

    // 集約対象外データ3件は元のまま変更されない
    expect(result.remainingProductionRecords).toHaveLength(3);
    expect(result.remainingProductionRecords).toEqual(existingReportsInProduction);

    // アーカイブ領域に新規レコードが追加されない
    expect(result.archivedRecords).toHaveLength(0);

    // 抽出ファイルが成功状態で生成される
    expect(result.extractedDataset).toBeDefined();
    expect(result.extractedDataset.extractionPeriodStart).toBe(aggregationStartDate.toISOString());
    expect(result.extractedDataset.extractionPeriodEnd).toBe(aggregationEndDate.toISOString());
    expect(result.extractedDataset.totalReportCount).toBe(0);
    expect(result.extractedDataset.reportsByTeam).toEqual([]);
  });
});