import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis - Extract Report Data', () => {
  test('SCEN-1625: Should return error when reporter ID is missing in daily report records', async () => {
    const incompleteReport = {
      reportDate: new Date('2024-01-08'),
      reportCount: 1,
      submittedByUserIds: [null as unknown as string],
      challengeItems: ['Database connection timeout'],
    };

    const weeklyRequestWithMissingReporter = {
      weekStartDate: new Date('2024-01-08T00:00:00Z'),
      weekEndDate: new Date('2024-01-14T23:59:59Z'),
      teamIds: ['team-001'],
      requestedByUserId: 'user-manager-001',
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['Database connection timeout'],
        frequency: 1,
      }),
      assessImpactScore: jest.fn().mockResolvedValue({ impactScore: 75 }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: 'high' }),
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: 'sent' }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: true }),
    };

    const errorResult = await extractWeeklyReportData(
      [incompleteReport],
      weeklyRequestWithMissingReporter,
      mockTextAnalysisServiceAdapter,
      mockNotificationServiceAdapter,
    ).catch((error) => error);

    expect(errorResult).toMatchObject({
      code: 'REPORTER_ID_MISSING',
      message: expect.stringMatching(/報告者IDが欠落しているレコードが存在します/),
    });

    expect(errorResult.message).toContain('2024-01-08');
    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});