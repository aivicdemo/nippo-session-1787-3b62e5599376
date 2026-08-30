import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';
import type { MonthlyReportGenerationRequest, MonthlyAnalysisReportResult } from '../../src/logic/monthly-analysis-report';

describe('Monthly Analysis Report Generation', () => {
  // SCEN-466
  test('should skip report generation and return warning when no daily report data exists for target month', async () => {
    const request: MonthlyReportGenerationRequest = {
      targetMonth: '2024-01',
      projectManagerId: 'pm-001',
      includeExecutiveSummary: true,
      topChallengesCount: 5,
    };

    const result: MonthlyAnalysisReportResult = await generateMonthlyAnalysisReport(request);

    expect(result.reportId).toBe('');
    expect(result.targetMonth).toBe('2024-01');
    expect(result.reportContent).toEqual({});
    expect(result.projectDelayRiskLevel).toBe('low');
    expect(result.generatedAt).toBeDefined();
    expect(typeof result.generatedAt).toBe('object');
    expect(result.warning).toMatch(/対象月のデータが不足しています。レポート生成をスキップします/);
  });
});