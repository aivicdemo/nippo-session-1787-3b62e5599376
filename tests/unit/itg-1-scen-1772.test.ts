import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - Data Extraction', () => {
  // SCEN-1772: [error] 月次レポート生成（データ抽出処理） - 実行ユーザーがプロジェクトマネージャー権限を持たない場合、エラーが発生して処理が中断される
  test('should reject data extraction when user lacks project manager authority', () => {
    const targetYear = 2024;
    const targetMonth = 1;
    const requestedByUserId = 'engineer_001';
    const userRole = 'engineer'; // Not a project manager

    const input = {
      targetYear,
      targetMonth,
      requestedByUserId,
      userRole,
    };

    expect(() => extractMonthlyReportData(input)).toThrow(/権限/);
  });
});