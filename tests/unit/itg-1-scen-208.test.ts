import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type { GenerateAndSendSummaryEmailInput, GenerateAndSendSummaryEmailOutput } from '../../src/logic/notification-delivery';

describe('generateAndSendSummaryEmail - 課題抽出0件の場合', () => {
  // SCEN-208
  it('課題が1件も抽出されない場合、課題一覧が0件として集約メールに含まれる', async () => {
    const reportDate = '2024-01-15';
    const teamId = 'team-001';
    const managerUserId = 'manager-001';
    const reportDeadlineTime = '09:00';

    const submittedReports = [
      {
        reporterId: 'user-001',
        reporterName: 'Engineer A',
        submittedAt: '2024-01-15T08:55:00Z',
        challenges: [],
      },
      {
        reporterId: 'user-002',
        reporterName: 'Engineer B',
        submittedAt: '2024-01-15T08:52:00Z',
        challenges: [],
      },
      {
        reporterId: 'user-003',
        reporterName: 'Engineer C',
        submittedAt: '2024-01-15T08:50:00Z',
        challenges: [],
      },
      {
        reporterId: 'user-004',
        reporterName: 'Engineer D',
        submittedAt: '2024-01-15T08:48:00Z',
        challenges: [],
      },
      {
        reporterId: 'user-005',
        reporterName: 'Engineer E',
        submittedAt: '2024-01-15T08:46:00Z',
        challenges: [],
      },
      {
        reporterId: 'user-006',
        reporterName: 'Engineer F',
        submittedAt: '2024-01-15T08:44:00Z',
        challenges: [],
      },
      {
        reporterId: 'user-007',
        reporterName: 'Engineer G',
        submittedAt: '2024-01-15T08:42:00Z',
        challenges: [],
      },
      {
        reporterId: 'user-008',
        reporterName: 'Engineer H',
        submittedAt: '2024-01-15T08:40:00Z',
        challenges: [],
      },
      {
        reporterId: 'user-009',
        reporterName: 'Engineer I',
        submittedAt: '2024-01-15T08:38:00Z',
        challenges: [],
      },
      {
        reporterId: 'user-010',
        reporterName: 'Engineer J',
        submittedAt: '2024-01-15T08:36:00Z',
        challenges: [],
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

    const output: GenerateAndSendSummaryEmailOutput = await generateAndSendSummaryEmail(input);

    expect(output.emailId).toBeDefined();
    expect(typeof output.emailId).toBe('string');
    expect(output.emailId.length).toBeGreaterThan(0);

    expect(output.sentAt).toBeDefined();
    expect(typeof output.sentAt).toBe('string');
    const sentDate = new Date(output.sentAt);
    expect(sentDate.getTime()).toBeGreaterThan(0);

    expect(output.recipientEmail).toBeDefined();
    expect(typeof output.recipientEmail).toBe('string');
    expect(output.recipientEmail).toContain('@');

    expect(output.includedIssueCount).toBe(0);

    expect(output.submissionSummary).toBeDefined();
    expect(output.submissionSummary.submittedCount).toBe(10);
    expect(output.submissionSummary.unsubmittedCount).toBe(0);
    expect(output.submissionSummary.submissionRate).toBe(100);
  });
});