import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';
import type { MonthlyReportGenerationRequest } from '../../src/logic/monthly-analysis-report';

describe('Monthly Analysis Report Generation', () => {
  test('SCEN-452: should throw AnalysisValidationFailure when monthly report data is empty', async () => {
    // Arrange: テストデータの構築
    const request: MonthlyReportGenerationRequest = {
      targetMonth: '2025-02',
      projectManagerId: 'PM-001',
      includeExecutiveSummary: true,
      topChallengesCount: 5,
    };

    // Act & Assert: generateMonthlyAnalysisReport の呼び出しと例外検証
    // 当月のデータが空の場合、エラーメッセージを含む例外がスローされることを期待
    await expect(
      generateMonthlyAnalysisReport(request)
    ).rejects.toThrow(/当月のデータがありません/);
  });
});