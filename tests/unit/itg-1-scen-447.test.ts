import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';
import type { MonthlyReportGenerationRequest } from '../../src/logic/monthly-analysis-report';

describe('Monthly Analysis Report Generation', () => {
  // SCEN-447: [error] generateMonthlyAnalysisReport should throw AnalysisValidationFailure when no daily reports exist for the target month
  test('should throw AnalysisValidationFailure with appropriate error message when monthly report dataset is empty', async () => {
    const request: MonthlyReportGenerationRequest = {
      targetMonth: '2024-01',
      projectManagerId: 'PM001',
      includeExecutiveSummary: true,
      topChallengesCount: 5,
    };

    await expect(generateMonthlyAnalysisReport(request)).rejects.toThrow(/当月のデータがありません/);
  });
});