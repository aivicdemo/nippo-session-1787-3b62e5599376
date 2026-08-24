import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('月次レポート生成機能 - 月次データ抽出', () => {
  test('SCEN-1824: 閏年の2月の月末が29日の場合、2月1日から2月29日までが正確に集計される', () => {
    // Arrange: 閏年（2024年）の2月1日～2月29日の期間でテスト用日報データを準備
    const targetYear = 2024;
    const targetMonth = 2;
    const requestedByUserId = 'user-001';
    
    // 2024年2月は閏年であり、月末は29日
    // 営業日（月～金）に日報が投入される想定で、2月1日（木）～2月29日（木）の期間で10件の日報を用意
    const reportRecords = [
      {
        reportId: 'report-001',
        reportDate: new Date('2024-02-01T09:30:00Z'),
        teamId: 'team-001',
        userId: 'member-001',
        content: 'Day 1 report',
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2024-02-02T09:30:00Z'),
        teamId: 'team-001',
        userId: 'member-002',
        content: 'Day 2 report',
      },
      {
        reportId: 'report-003',
        reportDate: new Date('2024-02-05T09:30:00Z'),
        teamId: 'team-001',
        userId: 'member-003',
        content: 'Day 5 report',
      },
      {
        reportId: 'report-004',
        reportDate: new Date('2024-02-06T09:30:00Z'),
        teamId: 'team-001',
        userId: 'member-004',
        content: 'Day 6 report',
      },
      {
        reportId: 'report-005',
        reportDate: new Date('2024-02-07T09:30:00Z'),
        teamId: 'team-001',
        userId: 'member-005',
        content: 'Day 7 report',
      },
      {
        reportId: 'report-006',
        reportDate: new Date('2024-02-08T09:30:00Z'),
        teamId: 'team-001',
        userId: 'member-001',
        content: 'Day 8 report',
      },
      {
        reportId: 'report-007',
        reportDate: new Date('2024-02-09T09:30:00Z'),
        teamId: 'team-001',
        userId: 'member-002',
        content: 'Day 9 report',
      },
      {
        reportId: 'report-008',
        reportDate: new Date('2024-02-26T09:30:00Z'),
        teamId: 'team-001',
        userId: 'member-003',
        content: 'Day 26 report',
      },
      {
        reportId: 'report-009',
        reportDate: new Date('2024-02-27T09:30:00Z'),
        teamId: 'team-001',
        userId: 'member-004',
        content: 'Day 27 report',
      },
      {
        reportId: 'report-010',
        reportDate: new Date('2024-02-29T09:30:00Z'),
        teamId: 'team-001',
        userId: 'member-005',
        content: 'Day 29 report',
      },
    ];

    // Act: 月次レポート生成機能を実行
    const input = {
      targetYear,
      targetMonth,
      requestedByUserId,
      teamIdFilter: undefined,
    };

    const result = extractMonthlyReportData(input, reportRecords);

    // Assert: 生成されたレポートが正確に2月1日～2月29日を集計していることを検証
    expect(result.extractionPeriodStart).toBe('2024-02-01T00:00:00Z');
    expect(result.extractionPeriodEnd).toBe('2024-02-29T23:59:59Z');
    expect(result.totalReportCount).toBe(10);
    
    // 集計対象期間が2月1日～2月29日の29日間であることを確認
    const startDate = new Date(result.extractionPeriodStart);
    const endDate = new Date(result.extractionPeriodEnd);
    const daysDifference = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    expect(daysDifference).toBe(29);
    
    // チーム別集計結果の検証
    expect(result.reportsByTeam).toHaveLength(1);
    expect(result.reportsByTeam[0].teamId).toBe('team-001');
    expect(result.reportsByTeam[0].reportCount).toBe(10);
    expect(result.reportsByTeam[0].submissionRate).toBe(100);
    expect(result.reportsByTeam[0].reportIds).toContain('report-001');
    expect(result.reportsByTeam[0].reportIds).toContain('report-010');
    
    // データ品質スコアが計算されていることを確認
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
    
    // 抽出実行日時が記録されていることを確認
    expect(result.extractedAt).toBeDefined();
    const extractedAtDate = new Date(result.extractedAt);
    expect(extractedAtDate).toBeInstanceOf(Date);
  });
});