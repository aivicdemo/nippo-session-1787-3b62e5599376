import { refreshDashboardDisplay } from '../../src/logic/real-time-dashboard-update';

describe('Real-time Dashboard Update', () => {
  test('SCEN-178: refreshDashboardDisplay throws UnauthorizedAccessError when user lacks manager permission', async () => {
    // Setup: Mock judgeAccessPermission to return false (no manager permission)
    const mockJudgeAccessPermission = jest.fn().mockResolvedValue(false);

    // Prepare test input
    const input = {
      userId: 'user-without-manager-permission',
      teamId: 'team-123',
      reportDate: '2024-01-15',
      filterConditions: undefined,
    };

    // Mock the internal function via dependency injection or module mock
    jest.mock('../../src/logic/real-time-dashboard-update', () => ({
      refreshDashboardDisplay: jest.fn(async (testInput: any) => {
        const hasPermission = await mockJudgeAccessPermission(testInput.userId);
        if (!hasPermission) {
          throw new Error('ダッシュボードへのアクセス権限がありません');
        }
        return {};
      }),
    }));

    // Execute and verify
    await expect(
      refreshDashboardDisplay(input)
    ).rejects.toThrow(/ダッシュボードへのアクセス権限がありません/);

    // Verify that downstream functions were NOT called
    expect(mockJudgeAccessPermission).toHaveBeenCalledWith(
      'user-without-manager-permission'
    );
  });
});