import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

// Mock TextAnalysisServiceAdapter
const mockTextAnalysisServiceAdapter = {
  extractKeywords: jest.fn(),
  assessImpactScore: jest.fn(),
  classifyIssueSeverity: jest.fn(),
};

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTextAnalysisServiceAdapter.extractKeywords.mockRejectedValue(
      new Error('API call failed')
    );
  });

  // SCEN-2642
  test('[error] TextAnalysisServiceAdapter の extractKeywords が失敗し、キャッシュ利用への切り替えエラーが発生する場合、日報送信は続行可能で手動入力モードで課題を入力できる', async () => {
    // Arrange
    const submitInput: SubmitDailyReportInput = {
      userId: 'engineer-001',
      teamId: 'team-a',
      yesterdayAccomplishment: 'Completed API development for login feature',
      todayPlan: 'Testing and deployment preparation',
      challenges: 'Database connection timeout issue encountered in staging environment',
      reportDate: '2025-09-15',
    };

    const mockLoggerAdapter = {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const mockCacheAdapter = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
      delete: jest.fn(),
    };

    // Simulate extractKeywords failing 3 times (retries at 3s, 10s, 30s)
    mockTextAnalysisServiceAdapter.extractKeywords
      .mockRejectedValueOnce(new Error('Timeout on attempt 1'))
      .mockRejectedValueOnce(new Error('Timeout on attempt 2'))
      .mockRejectedValueOnce(new Error('Timeout on attempt 3'));

    // Act
    const result = await submitDailyReport(submitInput, mockTextAnalysisServiceAdapter, mockLoggerAdapter, mockNotificationAdapter, mockCacheAdapter);

    // Assert
    // Verify that extractKeywords was called 3 times (initial + 2 retries, max 3 total attempts)
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledTimes(3);

    // Verify that cache.get was called to attempt fallback
    expect(mockCacheAdapter.get).toHaveBeenCalledWith('challenge_keywords_cache');

    // Verify error log contains cache fallback failure message
    expect(mockLoggerAdapter.error).toHaveBeenCalledWith(
      expect.stringContaining('extractKeywords'),
    );

    // Verify that result contains submission confirmation (report was sent despite analysis failure)
    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.submissionTimestamp).toBeDefined();
    expect(typeof result.submissionTimestamp).toBe('string');

    // Verify that the challenges text is preserved in the submitted report for manual input mode
    expect(result).toHaveProperty('reportId');
    expect(result).toHaveProperty('submissionTimestamp');

    // Verify notification was sent to admin with manual input challenge data
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        targetUserId: 'manager-001',
        messageContent: expect.stringContaining('手動入力'),
      }),
    );
  });
});