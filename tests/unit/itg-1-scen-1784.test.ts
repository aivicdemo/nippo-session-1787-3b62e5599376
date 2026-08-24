import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次レポート生成機能', () => {
  // SCEN-1784: [edge] 月次レポート生成機能 - 抽出対象の報告データが時系列の逆順で入力されている場合に正しく整列される
  test('should correctly sort reports in chronological order when input data is in reverse order', () => {
    // Setup: テストデータとして3件の報告データを準備（逆順入力状態）
    const reportData = [
      {
        reportId: 'RPT-001',
        reportedAt: new Date('2024-01-15T09:30:00Z'),
        timestamp: 1705312200000,
        teamId: 'TEAM-001',
        reportContent: 'Progress update for RPT-001',
        issues: ['issue-001'],
      },
      {
        reportId: 'RPT-002',
        reportedAt: new Date('2024-01-15T08:15:00Z'),
        timestamp: 1705308900000,
        teamId: 'TEAM-001',
        reportContent: 'Progress update for RPT-002',
        issues: ['issue-002'],
      },
      {
        reportId: 'RPT-003',
        reportedAt: new Date('2024-01-15T10:45:00Z'),
        timestamp: 1705319100000,
        teamId: 'TEAM-001',
        reportContent: 'Progress update for RPT-003',
        issues: ['issue-003'],
      },
    ];

    const targetYear = 2024;
    const targetMonth = 1;
    const requestedByUserId = 'USER-001';

    // Execute: extractMonthlyReportData()を呼び出す
    const result = extractMonthlyReportData(
      {
        targetYear,
        targetMonth,
        requestedByUserId,
        teamIdFilter: ['TEAM-001'],
      },
      reportData,
    );

    // Verify: 報告データが時系列順序（昇順）で正しく整列されているか確認
    expect(result.entries).toBeDefined();
    expect(result.entries.length).toBe(3);

    // 各要素の順序を検証：RPT-002（08:15:00）→ RPT-001（09:30:00）→ RPT-003（10:45:00）
    expect(result.entries[0].reportId).toBe('RPT-002');
    expect(result.entries[0].timestamp).toBe(1705308900000);

    expect(result.entries[1].reportId).toBe('RPT-001');
    expect(result.entries[1].timestamp).toBe(1705312200000);

    expect(result.entries[2].reportId).toBe('RPT-003');
    expect(result.entries[2].timestamp).toBe(1705319100000);

    // タイムスタンプが昇順に配置されていることを確認
    expect(result.entries[0].timestamp).toBeLessThan(result.entries[1].timestamp);
    expect(result.entries[1].timestamp).toBeLessThan(result.entries[2].timestamp);

    // レポート全体の構造を検証
    expect(result.extractionPeriodStart).toBeDefined();
    expect(result.extractionPeriodEnd).toBeDefined();
    expect(result.totalReportCount).toBe(3);
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
    expect(result.extractedAt).toBeDefined();
  });
});