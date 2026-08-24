import { generateAndSendConfirmationEmail } from '../../src/logic/notification-delivery';
import { type ConfirmationEmailInput, type ConfirmationEmailOutput } from '../../src/logic/notification-delivery';

describe('generateAndSendConfirmationEmail - empty report data error handling', () => {
  // SCEN-439
  test('should return error and not invoke external services when aggregatedReports is empty array', async () => {
    // Arrange
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input: ConfirmationEmailInput = {
      reportDeadlineDateTime: new Date('2024-01-15T09:00:00Z'),
      aggregatedReports: [],
      managerUserId: 'user-manager-001',
      teamId: 'team-001',
      analysisDate: new Date('2024-01-15T00:00:00Z'),
    };

    // Act
    const result = await generateAndSendConfirmationEmail(
      input,
      mockTextAnalysisServiceAdapter,
      mockNotificationServiceAdapter
    );

    // Assert
    expect(result).toEqual({
      success: false,
      error: {
        code: 'E_EMPTY_REPORT_DATA',
        message: 'チームメンバー報告データが空です。処理を中止しました',
      },
    });

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).not.toHaveBeenCalled();

    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(mockNotificationServiceAdapter.scheduleNotification).not.toHaveBeenCalled();
  });
});