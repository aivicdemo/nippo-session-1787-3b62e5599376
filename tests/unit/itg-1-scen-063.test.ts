import { prepareDashboardData } from '../../src/logic/dashboard-presentation';
import { type DashboardDataPrepareInput } from '../../src/logic/dashboard-presentation';

describe('朝会報告管理システム - ダッシュボード表示', () => {
  // SCEN-063
  test('データベースアクセスエラー時にダッシュボードデータの集計失敗エラーを発生させる', async () => {
    const input: DashboardDataPrepareInput = {
      teamId: 'team-001',
      targetDate: new Date('2024-01-15'),
      requestingUserId: 'user-director-001',
      includeHistoricalTrend: false,
    };

    const mockAggregateSubmissionStatusSummary = jest.fn().mockImplementation(() => {
      const dbError = new Error('Database connection failed');
      (dbError as any).code = 'ECONNREFUSED';
      throw dbError;
    });

    const mockBuildUnsubmittedMembersList = jest.fn();
    const mockFormatIssueListWithColorCoding = jest.fn();

    jest.doMock('../../src/logic/dashboard-presentation', () => ({
      prepareDashboardData: jest.fn(async (inputData: DashboardDataPrepareInput) => {
        try {
          mockAggregateSubmissionStatusSummary();
          mockBuildUnsubmittedMembersList(inputData.teamId, inputData.targetDate);
          mockFormatIssueListWithColorCoding(inputData.teamId, inputData.targetDate);
        } catch (error) {
          const aggregationError = new Error('ダッシュボードデータの集計に失敗しました。');
          (aggregationError as any).name = 'DataAggregationFailureError';
          throw aggregationError;
        }
      }),
    }), { virtual: true });

    try {
      await prepareDashboardData(input);
      fail('Should have thrown DataAggregationFailureError');
    } catch (error) {
      expect((error as any).name).toBe('DataAggregationFailureError');
      expect((error as Error).message).toBe('ダッシュボードデータの集計に失敗しました。');
    }
  });
});