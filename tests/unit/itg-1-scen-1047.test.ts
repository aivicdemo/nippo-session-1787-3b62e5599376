import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('ダッシュボード機能 - データ鮮度確保処理', () => {
  // SCEN-1047: [error] ダッシュボードデータ更新機能 - 昨日実績データが null のとき、更新処理がエラーになる
  test('should return error status when yesterday performance data is null', () => {
    const yesterdayReportData = null;
    const userId = 'user-001';
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const maxStalenessSeconds = 300;

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((reportData: unknown) => {
        if (reportData === null) {
          throw new Error('Invalid data: yesterday performance data is null');
        }
        return {
          keywords: ['keyword1'],
          frequency: { keyword1: 5 },
        };
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      userId,
      teamId,
      reportDate,
      maxStalenessSeconds,
      yesterdayReportData,
    };

    const result = ensureDashboardDataFreshness(
      input,
      mockTextAnalysisAdapter,
    );

    expect(result).toEqual({
      isDataFresh: false,
      statusCode: 400,
      message: 'Invalid data: yesterday performance data is null',
      lastUpdateTimestamp: expect.any(String),
      displayTimestamp: expect.any(String),
      stalenessSeconds: expect.any(Number),
      emailSent: false,
      dashboardPreserved: true,
      auditLog: expect.objectContaining({
        timestamp: expect.any(String),
        eventType: 'DASHBOARD_UPDATE_ERROR',
        userId,
        teamId,
        errorCode: 400,
        errorMessage: 'Invalid data: yesterday performance data is null',
        inputData: {
          yesterdayReportData: null,
        },
      }),
    });

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(null);
    expect(result.emailSent).toBe(false);
    expect(result.dashboardPreserved).toBe(true);
  });
});