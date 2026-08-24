import { fetchYesterdayReport } from '../../src/logic/report-submission';

describe('fetchYesterdayReport - Authorization Denial', () => {
  // SCEN-2697
  test('should reject access when user lacks permission to fetch previous reports', async () => {
    const unauthorizedUserId = 'userA';
    const requestingUserId = 'userA';
    const targetDate = new Date('2024-01-14');

    const mockAuthorizationDenialError = new Error('アクセス権限がありません');
    (mockAuthorizationDenialError as any).code = 'PERMISSION_DENIED';
    (mockAuthorizationDenialError as any).statusCode = 403;

    const mockFetchYesterdayReportWithoutPermission = jest.fn().mockRejectedValue(
      mockAuthorizationDenialError
    );

    await expect(
      fetchYesterdayReport({
        engineerId: unauthorizedUserId,
        targetDate,
        requestingUserId,
      })
    ).rejects.toThrow(/アクセス権限/);
  });
});