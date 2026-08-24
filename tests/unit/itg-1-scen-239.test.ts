import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type {
  GenerateAndSendSummaryEmailInput,
  GenerateAndSendSummaryEmailOutput,
  SubmittedReportSummary,
} from '../../src/logic/notification-delivery';

describe('generateAndSendSummaryEmail', () => {
  // SCEN-239
  test('when impact score is exactly 100, email includes issue with highest priority rank and highest included issue count reflects maximum impact', async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ deliveryStatus: 'success' }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduleId: 'sched-001' }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'delivered' }),
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['システム障害', '全機能停止'],
        frequency: { 'システム障害': 2, '全機能停止': 1 },
      }),
      assessImpactScore: jest.fn().mockResolvedValue(100),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const submittedReports: SubmittedReportSummary[] = [
      {
        reporterId: 'eng-001',
        reporterName: 'Engineer A',
        submittedAt: '2024-01-15T08:45:00Z',
        challenges: ['システム障害により全機能停止'],
      },
      {
        reporterId: 'eng-002',
        reporterName: 'Engineer B',
        submittedAt: '2024-01-15T08:50:00Z',
        challenges: ['データベース接続エラー'],
      },
    ];

    const input: GenerateAndSendSummaryEmailInput = {
      teamId: 'team-dev-001',
      reportDate: '2024-01-15',
      managerUserId: 'manager-001',
      submittedReports: submittedReports,
      unsubmittedMemberIds: ['eng-003', 'eng-004'],
      reportDeadlineTime: '09:00',
    };

    const output = await generateAndSendSummaryEmail(input, {
      notificationServiceAdapter: mockNotificationServiceAdapter,
      textAnalysisServiceAdapter: mockTextAnalysisServiceAdapter,
    });

    expect(output).toBeDefined();
    expect(typeof output.emailId).toBe('string');
    expect(output.emailId.length).toBeGreaterThan(0);

    expect(output.sentAt).toBeDefined();
    const sentDateTime = new Date(output.sentAt);
    expect(sentDateTime.getFullYear()).toBe(2024);

    expect(output.recipientEmail).toBeDefined();
    expect(typeof output.recipientEmail).toBe('string');

    expect(output.includedIssueCount).toBe(2);

    expect(output.submissionSummary).toBeDefined();
    expect(output.submissionSummary.submittedCount).toBe(2);
    expect(output.submissionSummary.unsubmittedCount).toBe(2);
    expect(output.submissionSummary.submissionRate).toBe(50);

    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
    const assessImpactScoreCalls = mockTextAnalysisServiceAdapter.assessImpactScore.mock.calls;
    expect(assessImpactScoreCalls.length).toBeGreaterThanOrEqual(1);

    const systemFailureCall = assessImpactScoreCalls.find(
      (callArgs: any[]) =>
        typeof callArgs[0] === 'string' &&
        callArgs[0].includes('システム障害')
    );
    expect(systemFailureCall).toBeDefined();

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();
  });
});