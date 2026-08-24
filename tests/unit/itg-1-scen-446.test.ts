import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { generateAndSendConfirmationEmail } from '../../src/logic/notification-delivery';
import type { ConfirmationEmailInput, ConfirmationEmailOutput } from '../../src/logic/notification-delivery';

describe('generateAndSendConfirmationEmail - TextAnalysisServiceAdapter failure with cache fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-446
  test('should display cached keyword severity when classifyIssueSeverity fails after 3 retries and show dashboard error message', async () => {
    const analysisDate = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineDateTime = new Date('2024-01-15T09:00:00Z');
    const teamId = 'team-engineering-001';
    const managerUserId = 'user-manager-001';

    const aggregatedReports = [
      {
        reportId: 'report-001',
        reporterUserId: 'user-engineer-001',
        reporterName: 'Engineer Alice',
        yesterdayAccomplishment: 'Completed API endpoint refactoring',
        todayPlan: 'Deploy to staging environment',
        challenges: 'サーバーレスポンス遅延により本番環境でのデータ同期が停止している',
        submissionDateTime: new Date('2024-01-15T08:45:00Z'),
      },
    ];

    const textAnalysisServiceStub = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { text: 'サーバーレスポンス遅延', frequency: 1, confidence: 0.92 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({ impactScore: 85 }),
      classifyIssueSeverity: jest
        .fn()
        .mockRejectedValueOnce(new Error('Timeout: API response exceeded 30s'))
        .mockRejectedValueOnce(new Error('Timeout: API response exceeded 30s'))
        .mockRejectedValueOnce(new Error('Timeout: API response exceeded 30s')),
    };

    const cachedKeywordDictionary = [
      {
        keywordId: 'keyword-cache-001',
        keyword: 'サーバーレスポンス遅延',
        lastCachedSeverity: 'high',
        lastCachedImpactScore: 85,
        lastUpdatedAt: new Date('2024-01-14T09:00:00Z'),
      },
    ];

    const notificationServiceStub = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: 'sent' }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'delivered' }),
    };

    const result: ConfirmationEmailOutput = await generateAndSendConfirmationEmail(
      {
        reportDeadlineDateTime,
        aggregatedReports,
        managerUserId,
        teamId,
        analysisDate,
      } as ConfirmationEmailInput,
      textAnalysisServiceStub,
      notificationServiceStub,
      cachedKeywordDictionary,
    );

    expect(textAnalysisServiceStub.classifyIssueSeverity).toHaveBeenCalledTimes(3);

    expect(result.emailId).toBeDefined();
    expect(typeof result.emailId).toBe('string');
    expect(result.sentDateTime).toBeDefined();
    expect(result.sentDateTime instanceof Date).toBe(true);

    expect(result.prioritizedIssuesList).toBeDefined();
    expect(Array.isArray(result.prioritizedIssuesList)).toBe(true);
    expect(result.prioritizedIssuesList.length).toBeGreaterThan(0);

    const cachedIssueFallback = result.prioritizedIssuesList.find(
      (issue) => issue.content === 'サーバーレスポンス遅延',
    );
    expect(cachedIssueFallback).toBeDefined();
    expect(cachedIssueFallback?.rank).toBe('high');
    expect(cachedIssueFallback?.impactScore).toBe(85);
    expect(cachedIssueFallback?.usedCache).toBe(true);

    expect(result.submissionStatus).toBeDefined();
    expect(result.submissionStatus.totalSubmitted).toBe(1);
    expect(result.submissionStatus.unsubmittedMembers).toEqual([]);

    expect(result.dashboardErrorMessage).toBe(
      '課題分析が一時的に利用できません。手動入力をご利用ください',
    );
    expect(result.manualInputModeEnabled).toBe(true);
  });
});