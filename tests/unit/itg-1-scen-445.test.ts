import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { generateAndSendConfirmationEmail } from '../../src/logic/notification-delivery';
import type { ConfirmationEmailInput, ConfirmationEmailOutput } from '../../src/logic/notification-delivery';

// Mock the TextAnalysisServiceAdapter
const mockTextAnalysisServiceAdapter = {
  extractKeywords: jest.fn(),
  assessImpactScore: jest.fn(),
  classifyIssueSeverity: jest.fn(),
};

// Mock the notification service adapter
const mockNotificationServiceAdapter = {
  sendReminderNotification: jest.fn(),
  scheduleNotification: jest.fn(),
  getDeliveryStatus: jest.fn(),
};

// Mock the cache/keyword dictionary
const mockKeywordCache = new Map();

describe('generateAndSendConfirmationEmail - TextAnalysisServiceAdapter failure handling with cache fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockKeywordCache.clear();

    // Pre-register cached analysis result from 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    mockKeywordCache.set('サーバ障害', {
      keyword: 'サーバ障害',
      impactScore: 65,
      frequency: 2,
      lastAnalyzedAt: threeDaysAgo.toISOString(),
      severity: '中',
      source: 'cache',
    });

    // Configure assessImpactScore to fail with connection error
    mockTextAnalysisServiceAdapter.assessImpactScore.mockRejectedValue(
      new Error('API connection failed: Unable to reach TextAnalysisService endpoint')
    );

    // Configure successful email send
    mockNotificationServiceAdapter.sendReminderNotification.mockResolvedValue({
      status: 'sent',
      messageId: 'msg-20240115-001',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockKeywordCache.clear();
  });

  // SCEN-445: TextAnalysisServiceAdapter assessImpactScore failure triggers cache fallback and error handling
  test('should display cache fallback message and previous analysis results when assessImpactScore fails, and enable manual keyword input form', async () => {
    const analysisDate = new Date('2024-01-15T09:00:00Z');
    const reportDeadlineDateTime = new Date('2024-01-15T09:30:00Z');

    const aggregatedReports = [
      {
        reportId: 'rep-001',
        reporterUserId: 'user-alice',
        reporterName: 'Alice Engineer',
        yesterdayAccomplishment: '修正対応',
        todayPlan: 'テスト実施',
        challenges: 'サーバ障害が継続',
        submissionDateTime: new Date('2024-01-15T08:45:00Z'),
      },
    ];

    const confirmationEmailInput: ConfirmationEmailInput = {
      reportDeadlineDateTime,
      aggregatedReports,
      managerUserId: 'mgr-001',
      teamId: 'team-dev',
      analysisDate,
    };

    const result = await generateAndSendConfirmationEmail(
      confirmationEmailInput,
      mockTextAnalysisServiceAdapter,
      mockKeywordCache
    );

    // Verify that assessImpactScore was attempted
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();

    // Verify output structure
    expect(result).toHaveProperty('emailId');
    expect(result).toHaveProperty('sentDateTime');
    expect(result).toHaveProperty('extractedIssuesCount');
    expect(result).toHaveProperty('prioritizedIssuesList');
    expect(result).toHaveProperty('submissionStatus');

    const typedResult = result as ConfirmationEmailOutput;

    // Verify that the output indicates cache fallback is active
    expect(typedResult.prioritizedIssuesList).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          keyword: 'サーバ障害',
          priorityScore: 65,
          priorityRank: '中',
          source: 'cache',
          cacheNotice: true,
        })
      ])
    );

    // Verify manual input form is available
    expect(result).toHaveProperty('manualInputFormAvailable', true);
    expect(result).toHaveProperty('analysisFallbackMessage', 
      '課題分析が一時的に利用できません。手動入力をご利用ください'
    );

    // Verify cache analysis metadata
    const cachedIssue = typedResult.prioritizedIssuesList.find(
      (issue) => issue.keyword === 'サーバ障害'
    );
    expect(cachedIssue).toBeDefined();
    expect(cachedIssue?.source).toBe('cache');

    // Verify submission status still reports correctly
    expect(typedResult.submissionStatus).toHaveProperty('submittedCount', 1);
    expect(typedResult.submissionStatus).toHaveProperty('unsubmittedMembers', []);

    // Verify email was sent with fallback content
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: 'mgr-001',
        messageType: 'confirmation_with_fallback',
        includesCacheFallback: true,
      })
    );

    // Verify sent timestamp is within reasonable range
    expect(new Date(typedResult.sentDateTime).getTime()).toBeLessThanOrEqual(
      new Date().getTime()
    );
    expect(new Date(typedResult.sentDateTime).getTime()).toBeGreaterThan(
      new Date('2024-01-15T08:00:00Z').getTime()
    );

    // Verify that extracted issues count reflects cached issues
    expect(typedResult.extractedIssuesCount).toBeGreaterThanOrEqual(1);
  });
});