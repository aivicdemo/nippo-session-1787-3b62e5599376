import { describe, test, expect, beforeEach } from '@jest/globals';
import { generateAndSendConfirmationEmail } from '../../src/logic/notification-delivery';
import type { ConfirmationEmailInput, ConfirmationEmailOutput } from '../../src/logic/notification-delivery';

describe('generateAndSendConfirmationEmail - TextAnalysisServiceAdapter failure fallback', () => {
  // SCEN-444
  test('should display fallback message and use previous cache when extractKeywords fails after retries', async () => {
    const failedTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockRejectedValue(new Error('API timeout')),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const previousCacheKeywords = [
      { keyword: 'データベース接続エラー', frequency: 3, confidenceScore: 0.92 },
      { keyword: 'メモリリーク', frequency: 2, confidenceScore: 0.85 },
    ];

    const keywordCacheStore = {
      getPreviousAnalysisResult: jest.fn().mockResolvedValue({
        keywords: previousCacheKeywords,
        analysisDate: new Date('2024-01-14T09:00:00Z'),
      }),
      saveFallbackIndicator: jest.fn().mockResolvedValue(true),
      enableManualKeywordInput: jest.fn().mockResolvedValue(true),
    };

    const emailServiceAdapter = {
      sendConfirmationEmail: jest.fn().mockResolvedValue({
        messageId: 'msg-20240115-001',
        sentAt: new Date('2024-01-15T09:15:30Z'),
      }),
    };

    const input: ConfirmationEmailInput = {
      reportDeadlineDateTime: new Date('2024-01-15T09:00:00Z'),
      aggregatedReports: [
        {
          reportId: 'report-001',
          reporterUserId: 'user-001',
          reporterName: 'Alice Johnson',
          yesterdayAccomplishment: 'Fixed user authentication module, updated API documentation',
          todayPlan: 'Implement database caching layer, conduct code review session',
          challenges: 'Database connection timeout occurring intermittently, memory leak in background service detected',
          submissionDateTime: new Date('2024-01-15T08:45:00Z'),
        },
        {
          reportId: 'report-002',
          reporterUserId: 'user-002',
          reporterName: 'Bob Smith',
          yesterdayAccomplishment: 'Completed unit test coverage for payment module',
          todayPlan: 'Deploy to staging environment, monitor performance metrics',
          challenges: 'Database connection stability issues, slow query response times',
          submissionDateTime: new Date('2024-01-15T08:50:00Z'),
        },
      ],
      managerUserId: 'manager-001',
      teamId: 'team-dev-001',
      analysisDate: new Date('2024-01-15T09:00:00Z'),
    };

    const output = await generateAndSendConfirmationEmail(
      input,
      failedTextAnalysisAdapter,
      keywordCacheStore,
      emailServiceAdapter
    );

    expect(failedTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(4);

    expect(keywordCacheStore.getPreviousAnalysisResult).toHaveBeenCalledWith('team-dev-001');
    expect(keywordCacheStore.saveFallbackIndicator).toHaveBeenCalledWith({
      teamId: 'team-dev-001',
      analysisDate: input.analysisDate,
      fallbackReason: 'TextAnalysisServiceAdapter_extract_failure',
      fallbackMessage: '課題分析が一時的に利用できません。手動入力をご利用ください',
    });
    expect(keywordCacheStore.enableManualKeywordInput).toHaveBeenCalledWith('team-dev-001');

    expect(emailServiceAdapter.sendConfirmationEmail).toHaveBeenCalled();
    const emailCall = emailServiceAdapter.sendConfirmationEmail.mock.calls[0][0];
    expect(emailCall.fallbackIndicator).toEqual({
      isActive: true,
      message: '課題分析が一時的に利用できません。手動入力をご利用ください',
      previousCacheAvailable: true,
      cachedKeywords: previousCacheKeywords,
      cacheDate: new Date('2024-01-14T09:00:00Z'),
    });
    expect(emailCall.manualKeywordInputEnabled).toBe(true);

    expect(output.emailId).toBeDefined();
    expect(typeof output.emailId).toBe('string');
    expect(output.sentDateTime).toEqual(expect.any(Date));
    expect(output.extractedIssuesCount).toBe(0);
    expect(output.prioritizedIssuesList).toEqual([]);
    expect(output.submissionStatus).toEqual({
      submittedCount: 2,
      unsubmittedMembers: [],
    });
    expect(output.fallbackMode).toBe(true);
    expect(output.fallbackReason).toBe('TextAnalysisServiceAdapter_extract_failure');
    expect(output.cachedDataUsed).toBe(true);
    expect(output.manualInputRequired).toBe(false);
  });
});