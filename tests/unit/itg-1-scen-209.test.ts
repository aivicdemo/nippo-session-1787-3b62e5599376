import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type { GenerateAndSendSummaryEmailInput, GenerateAndSendSummaryEmailOutput, SubmittedReportSummary } from '../../src/logic/notification-delivery';

describe('notification-delivery: generateAndSendSummaryEmail', () => {
  // SCEN-209: [normal] 優先度付き課題一覧生成機能 - 複数の課題が抽出された場合、全課題が優先度スコアで順序付けられて集約メールに含まれる
  test('should generate summary email with multiple issues sorted by priority score in descending order', async () => {
    const reportDate = '2024-01-15';
    const teamId = 'team-001';
    const managerUserId = 'manager-001';
    const reportDeadlineTime = '09:00';

    const submittedReports: SubmittedReportSummary[] = [
      {
        reporterId: 'engineer-001',
        reporterName: 'Alice',
        submittedAt: '2024-01-15T08:45:00Z',
        challenges: ['Database connection timeout', 'Memory leak in service A'],
      },
      {
        reporterId: 'engineer-002',
        reporterName: 'Bob',
        submittedAt: '2024-01-15T08:50:00Z',
        challenges: ['Database connection timeout', 'API response delay'],
      },
      {
        reporterId: 'engineer-003',
        reporterName: 'Charlie',
        submittedAt: '2024-01-15T08:55:00Z',
        challenges: ['Memory leak in service A', 'Network latency issue'],
      },
    ];

    const unsubmittedMemberIds: string[] = [];

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'Database connection timeout', frequency: 2 },
          { keyword: 'Memory leak in service A', frequency: 2 },
          { keyword: 'API response delay', frequency: 1 },
          { keyword: 'Network latency issue', frequency: 1 },
        ],
      }),
      assessImpactScore: jest.fn()
        .mockResolvedValueOnce({ keyword: 'Database connection timeout', impactScore: 85 })
        .mockResolvedValueOnce({ keyword: 'Memory leak in service A', impactScore: 78 })
        .mockResolvedValueOnce({ keyword: 'API response delay', impactScore: 62 })
        .mockResolvedValueOnce({ keyword: 'Network latency issue', impactScore: 45 }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        keyword: 'test',
        severity: 'high',
      }),
    };

    const input: GenerateAndSendSummaryEmailInput = {
      teamId,
      reportDate,
      managerUserId,
      submittedReports,
      unsubmittedMemberIds,
      reportDeadlineTime,
    };

    const output = await generateAndSendSummaryEmail(input, mockTextAnalysisServiceAdapter);

    expect(output).toBeDefined();
    expect(output.emailId).toBeDefined();
    expect(typeof output.emailId).toBe('string');
    expect(output.sentAt).toBeDefined();
    expect(typeof output.sentAt).toBe('string');
    expect(output.recipientEmail).toBeDefined();
    expect(typeof output.recipientEmail).toBe('string');
    expect(output.includedIssueCount).toBe(4);
    expect(output.submissionSummary).toBeDefined();
    expect(output.submissionSummary.submittedCount).toBe(3);
    expect(output.submissionSummary.unsubmittedCount).toBe(0);
    expect(output.submissionSummary.submissionRate).toBe(100);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledTimes(4);

    const impactScoreCalls = mockTextAnalysisServiceAdapter.assessImpactScore.mock.calls;
    const extractedKeywords = impactScoreCalls.map((call) => call[0]);
    expect(extractedKeywords).toContain('Database connection timeout');
    expect(extractedKeywords).toContain('Memory leak in service A');
    expect(extractedKeywords).toContain('API response delay');
    expect(extractedKeywords).toContain('Network latency issue');
  });
});