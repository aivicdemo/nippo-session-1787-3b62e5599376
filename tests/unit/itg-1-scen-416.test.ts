import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム集計機能', () => {
  // SCEN-416
  test('報告データベースから提出状況情報を取得できないときエラーが返される', async () => {
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true,
    };

    const dbConnectionError = new Error('Database connection failed');
    (dbConnectionError as any).code = 'DB_CONNECTION_FAILED';

    const mockDatabaseAdapter = {
      getReportSubmissionStatus: jest.fn().mockRejectedValue(dbConnectionError),
    };

    try {
      await aggregateReportSubmissionStatus(input, mockDatabaseAdapter);
      fail('should have thrown an error');
    } catch (error: any) {
      expect(error.code).toBe('DB_CONNECTION_FAILED');
      expect(error.message).toMatch(/データベース/);
      expect(mockDatabaseAdapter.getReportSubmissionStatus).toHaveBeenCalledWith(
        input.teamId,
        input.reportDate
      );
    }
  });
});