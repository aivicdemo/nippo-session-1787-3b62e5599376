import { describe, test, expect, beforeEach } from '@jest/globals';
import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import { type GenerateAndSendSummaryEmailInput, type GenerateAndSendSummaryEmailOutput, type SubmittedReportSummary, type SubmissionSummary } from '../../src/logic/notification-delivery';

describe('notification-delivery: generateAndSendSummaryEmail', () => {
  // SCEN-205: [normal] 未提出者リスト生成機能 - 全員提出済みの場合、未提出者リストが0件として集約メールに含まれる
  test('should generate summary email with zero unsubmitted members when all team members have submitted reports', async () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const managerUserId = 'manager-001';
    const reportDeadlineTime = '09:00';

    const submittedReports: SubmittedReportSummary[] = [
      {
        reporterId: 'engineer-001',
        reporterName: 'Engineer A',
        submittedAt: '2024-01-15T08:45:00Z',
        challenges: ['Database connection timeout issue', 'Memory leak in background task'],
      },
      {
        reporterId: 'engineer-002',
        reporterName: 'Engineer B',
        submittedAt: '2024-01-15T08:50:00Z',
        challenges: ['API response delay', 'Cache invalidation problem'],
      },
      {
        reporterId: 'engineer-003',
        reporterName: 'Engineer C',
        submittedAt: '2024-01-15T08:55:00Z',
        challenges: ['Unit test coverage below threshold'],
      },
      {
        reporterId: 'engineer-004',
        reporterName: 'Engineer D',
        submittedAt: '2024-01-15T08:30:00Z',
        challenges: ['Integration test failure', 'Deployment pipeline issue'],
      },
      {
        reporterId: 'engineer-005',
        reporterName: 'Engineer E',
        submittedAt: '2024-01-15T08:40:00Z',
        challenges: ['Security vulnerability in user authentication'],
      },
      {
        reporterId: 'engineer-006',
        reporterName: 'Engineer F',
        submittedAt: '2024-01-15T08:52:00Z',
        challenges: ['Documentation outdated'],
      },
      {
        reporterId: 'engineer-007',
        reporterName: 'Engineer G',
        submittedAt: '2024-01-15T08:48:00Z',
        challenges: ['Code review backlog growing'],
      },
      {
        reporterId: 'engineer-008',
        reporterName: 'Engineer H',
        submittedAt: '2024-01-15T08:35:00Z',
        challenges: [],
      },
      {
        reporterId: 'engineer-009',
        reporterName: 'Engineer I',
        submittedAt: '2024-01-15T08:58:00Z',
        challenges: ['Performance regression detected'],
      },
      {
        reporterId: 'engineer-010',
        reporterName: 'Engineer J',
        submittedAt: '2024-01-15T08:42:00Z',
        challenges: ['Third-party library compatibility issue'],
      },
    ];

    const unsubmittedMemberIds: string[] = [];

    const input: GenerateAndSendSummaryEmailInput = {
      teamId,
      reportDate,
      managerUserId,
      submittedReports,
      unsubmittedMemberIds,
      reportDeadlineTime,
    };

    const result: GenerateAndSendSummaryEmailOutput = await generateAndSendSummaryEmail(input);

    expect(result).toHaveProperty('emailId');
    expect(typeof result.emailId).toBe('string');
    expect(result.emailId.length).toBeGreaterThan(0);

    expect(result).toHaveProperty('sentAt');
    expect(typeof result.sentAt).toBe('string');

    expect(result).toHaveProperty('recipientEmail');
    expect(typeof result.recipientEmail).toBe('string');

    expect(result).toHaveProperty('includedIssueCount');
    expect(typeof result.includedIssueCount).toBe('number');
    expect(result.includedIssueCount).toBe(9);

    expect(result).toHaveProperty('submissionSummary');
    const submissionSummary: SubmissionSummary = result.submissionSummary;

    expect(submissionSummary).toHaveProperty('submittedCount');
    expect(submissionSummary.submittedCount).toBe(10);

    expect(submissionSummary).toHaveProperty('unsubmittedCount');
    expect(submissionSummary.unsubmittedCount).toBe(0);

    expect(submissionSummary).toHaveProperty('submissionRate');
    expect(submissionSummary.submissionRate).toBe(100);
  });
});