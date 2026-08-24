import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 課題解決速度分析機能', () => {
  // SCEN-2323: [error] 課題解決速度分析機能 - 集約期間の終了日が空文字列のとき処理を中止しエラーを返す
  test('集約期間の終了日が空文字列のとき、INVALID_END_DATEエラーを返し外部API呼び出しを実行しない', () => {
    const aggregationStartDate = '2026-01-01';
    const aggregationEndDate = '';
    const teamIds = ['team-001', 'team-002'];
    const reportRecords = [
      {
        reportId: 'report-001',
        teamId: 'team-001',
        submittedAt: '2026-01-05T09:00:00Z',
        yesterdayAccomplishments: 'Task A completed',
        todayPlans: 'Task B in progress',
        currentIssues: 'Issue 1',
      },
    ];

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const result = extractMonthlyReportData(
      aggregationStartDate,
      aggregationEndDate,
      teamIds,
      reportRecords,
      mockTextAnalysisServiceAdapter,
    );

    expect(result).toEqual(
      expect.objectContaining({
        isValid: false,
        validationErrors: expect.arrayContaining([
          expect.stringMatching(/集約期間の終了日が未指定です/),
        ]),
      }),
    );

    expect(result.error).toMatchObject({
      errorCode: 'INVALID_END_DATE',
    });

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});