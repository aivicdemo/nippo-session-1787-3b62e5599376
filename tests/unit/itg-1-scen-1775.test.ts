import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 月次レポート生成（データ抽出処理）', () => {
  // SCEN-1775
  test('抽出対象の朝会報告データが空の状態でも、エラーではなく空のデータセットが確定される', () => {
    // Arrange
    const targetYear = 2026;
    const targetMonth = 8;
    const requestedByUserId = 'user-001';
    const teamIdFilter = undefined;

    const input = {
      targetYear,
      targetMonth,
      requestedByUserId,
      teamIdFilter,
    };

    // Act
    const result = extractMonthlyReportData(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.extractionPeriodStart).toBe('2026-08-01T00:00:00Z');
    expect(result.extractionPeriodEnd).toBe('2026-08-31T23:59:59Z');
    expect(result.totalReportCount).toBe(0);
    expect(result.reportsByTeam).toEqual([]);
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
    expect(result.extractedAt).toBeDefined();
    expect(typeof result.extractedAt).toBe('string');
  });
});