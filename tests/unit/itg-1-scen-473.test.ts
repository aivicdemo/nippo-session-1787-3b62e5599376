import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';

describe('Monthly Analysis Report Generation', () => {
  test('SCEN-473: should handle empty failureType with unknown error message when generating monthly report fails', async () => {
    const targetMonth = '2024-01';
    const projectManagerId = 'pm-001';
    const reportGenerationTimestamp = new Date('2024-02-01T09:00:00Z');
    const pmEmail = 'pm@example.com';
    const directorEmail = 'director@example.com';

    // Mock the external dependencies
    const mockSendNotification = jest.fn().mockResolvedValue({ success: true });
    const mockGetUserEmail = jest.fn().mockImplementation((userId: string) => {
      if (userId === projectManagerId) return pmEmail;
      if (userId === 'director-001') return directorEmail;
      return null;
    });
    const mockLogWarning = jest.fn();

    // Inject mocked dependencies
    const result = await generateMonthlyAnalysisReport(
      {
        targetMonth,
        projectManagerId,
        includeExecutiveSummary: true,
        topChallengesCount: 5,
      },
      {
        sendNotification: mockSendNotification,
        getUserEmail: mockGetUserEmail,
        logWarning: mockLogWarning,
      }
    );

    // Verify the result structure for failure handling
    expect(result).toEqual({
      shouldRetry: true,
      nextRetryDelaySeconds: 60,
      notificationRecipient: pmEmail,
      shouldEscalate: false,
    });

    // Verify sendNotification was called with correct parameters
    // When failureType is empty string, it should use "不明なエラー" (unknown error)
    expect(mockSendNotification).toHaveBeenCalledWith(
      pmEmail,
      'レポート生成を再試行中',
      '不明なエラー'
    );

    // Verify warning log was recorded
    expect(mockLogWarning).toHaveBeenCalledWith(
      expect.stringMatching(/失敗原因が特定できていません/)
    );
  });
});