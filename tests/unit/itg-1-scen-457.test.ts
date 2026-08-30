import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';
import type { MonthlyReportGenerationRequest, MonthlyAnalysisReportResult } from '../../src/logic/monthly-analysis-report';

describe('generateMonthlyAnalysisReport', () => {
  test('SCEN-457: 抽出対象の課題が0件のときは警告ログを発生させ、空の課題リストを含むレポートを正常に返す', async () => {
    // Arrange
    const mockWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const request: MonthlyReportGenerationRequest = {
      targetMonth: '2025-01',
      projectManagerId: 'PM001',
      includeExecutiveSummary: true,
      topChallengesCount: 5,
    };

    const expectedReportId = 'RPT-20250201-001';
    const expectedGeneratedAt = new Date('2025-02-01T09:00:00Z');

    // Act
    const result: MonthlyAnalysisReportResult = await generateMonthlyAnalysisReport(request);

    // Assert
    expect(result).toBeDefined();
    expect(result.reportId).toBe(expectedReportId);
    expect(result.targetMonth).toBe('2025-01');
    expect(result.reportContent.topPriorityChallenges).toEqual([]);
    expect(result.projectDelayRiskLevel).toBe('low');
    expect(result.generatedAt).toStrictEqual(expectedGeneratedAt);

    expect(mockWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('報告対象の課題がありません')
    );
    expect(mockWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('最低閾値を確認してください')
    );

    mockWarnSpy.mockRestore();
  });
});