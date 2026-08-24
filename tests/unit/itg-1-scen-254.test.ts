import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('Daily Report Submission - Deadline Validation', () => {
  test('SCEN-254: submitDailyReport throws ValidationError when deadline is null', async () => {
    // Arrange
    const reportSubmissionInput = {
      reportId: 'report-001',
      userId: 'user-123',
      submissionTimestamp: new Date('2024-01-15T08:30:00Z'),
      reportContent: {
        yesterdayAccomplishment: 'Completed feature development for user authentication module',
        todayPlan: 'Testing and code review for the authentication module',
        challenges: 'Encountered database connection timeout issues during testing'
      }
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn()
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn()
    };

    const reportDeadline = null;

    // Act & Assert
    await expect(
      submitDailyReport(
        reportSubmissionInput,
        reportDeadline,
        mockNotificationServiceAdapter,
        mockTextAnalysisServiceAdapter
      )
    ).rejects.toThrow(/報告期限/);

    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});