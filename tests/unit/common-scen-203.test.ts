import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';

describe('Tx11Imp1Agent - Handoff to Human on Recurring Issue Detection', () => {
  let mockAiClient: any;
  let auditLog: any[] = [];
  let handoffTriggered: boolean = false;
  let humanApprovalGiven: boolean = false;

  beforeEach(() => {
    auditLog = [];
    handoffTriggered = false;
    humanApprovalGiven = false;

    mockAiClient = {
      action01: jest.fn(async (prompt: string) => ({
        submittedMembers: ['user001', 'user002', 'user003', 'user004', 'user005'],
        unsubmittedMembers: ['user006', 'user007'],
      })),
      action02: jest.fn(async (prompt: string) => ({
        notificationsSent: [
          { memberId: 'user006', email: 'user006@example.com', timestamp: new Date('2024-01-15T08:30:00Z') },
          { memberId: 'user007', email: 'user007@example.com', timestamp: new Date('2024-01-15T08:30:00Z') },
        ],
      })),
      action03: jest.fn(async (prompt: string) => ({
        extractedIssues: [
          {
            id: 'issue001',
            title: 'サーバーログイン遅延',
            description: 'サーバーへのSSHログインが遅延している',
            reportedBy: 'user001',
            reportDate: new Date('2024-01-15T07:00:00Z'),
          },
          {
            id: 'issue002',
            title: 'ネットワーク遅延',
            description: 'ネットワーク通信が不安定',
            reportedBy: 'user002',
            reportDate: new Date('2024-01-15T07:15:00Z'),
          },
          {
            id: 'issue003',
            title: 'サーバーログイン遅延',
            description: 'サーバーへのログインが遅い',
            reportedBy: 'user003',
            reportDate: new Date('2024-01-15T07:30:00Z'),
          },
          {
            id: 'issue004',
            title: 'サーバーログイン遅延',
            description: 'ログイン応答時間が増加',
            reportedBy: 'user004',
            reportDate: new Date('2024-01-15T07:45:00Z'),
          },
          {
            id: 'issue005',
            title: 'サーバーログイン遅延',
            description: 'ログイン待機時間が長い',
            reportedBy: 'user005',
            reportDate: new Date('2024-01-15T08:00:00Z'),
          },
        ],
      })),
      action04: jest.fn(async (prompt: string) => ({
        classifiedIssues: [
          { issueId: 'issue001', category: 'インフラ', severity: 'high' },
          { issueId: 'issue002', category: 'ネットワーク', severity: 'medium' },
          { issueId: 'issue003', category: 'インフラ', severity: 'high' },
          { issueId: 'issue004', category: 'インフラ', severity: 'high' },
          { issueId: 'issue005', category: 'インフラ', severity: 'high' },
        ],
      })),
      action05: jest.fn(async (prompt: string) => {
        auditLog.push({
          timestamp: new Date('2024-01-15T08:45:00Z'),
          eventType: 'action_05_prioritization_started',
        });

        const response = {
          prioritizedIssues: [
            {
              issueId: 'issue001',
              title: 'サーバーログイン遅延',
              priority: 1,
              recurrenceCount: 5,
              recommendedAction: '対応方針の見直し検討が必要',
            },
            {
              issueId: 'issue002',
              title: 'ネットワーク遅延',
              priority: 2,
              recurrenceCount: 1,
              recommendedAction: '原因調査を進める',
            },
          ],
          escalationDetected: true,
          escalationReason: 'recurring_issue_detected',
          recurringIssueDetails: {
            issueTitle: 'サーバーログイン遅延',
            occurrenceCount: 5,
            lastOccurrenceDate: new Date('2024-01-15T08:00:00Z'),
            firstOccurrenceDate: new Date('2023-10-20T09:15:00Z'),
            proposedReview: '対応方針の見直し',
          },
        };

        if (response.escalationDetected) {
          handoffTriggered = true;
          auditLog.push({
            timestamp: new Date('2024-01-15T08:46:00Z'),
            eventType: 'escalation_triggered',
            reason: response.escalationReason,
            recurringIssueTitle: response.recurringIssueDetails.issueTitle,
            occurrenceCount: response.recurringIssueDetails.occurrenceCount,
          });
        }

        return response;
      }),
      action06: jest.fn(async (prompt: string) => {
        if (handoffTriggered && !humanApprovalGiven) {
          auditLog.push({
            timestamp: new Date('2024-01-15T08:47:00Z'),
            eventType: 'handoff_to_human',
            status: 'awaiting_approval',
            summaryContent: 'サーバーログイン遅延（発生5回）対応方針見直し提案を含む朝会サマリー',
          });

          return {
            summaryEmailSent: false,
            status: 'pending_human_approval',
            handoffNotificationSent: true,
            pendingSummary: {
              submissionStatus: {
                totalMembers: 7,
                submittedCount: 5,
                unsubmittedMembers: ['user006', 'user007'],
              },
              prioritizedIssues: [
                {
                  issueId: 'issue001',
                  title: 'サーバーログイン遅延',
                  priority: 1,
                  recommendedAction: '対応方針の見直し検討が必要',
                },
                {
                  issueId: 'issue002',
                  title: 'ネットワーク遅延',
                  priority: 2,
                  recommendedAction: '原因調査を進める',
                },
              ],
            },
          };
        } else if (handoffTriggered && humanApprovalGiven) {
          auditLog.push({
            timestamp: new Date('2024-01-15T09:00:00Z'),
            eventType: 'action_06_resumed_after_approval',
          });

          auditLog.push({
            timestamp: new Date('2024-01-15T09:01:00Z'),
            eventType: 'side_effect_confirmed',
            action: 'summary_email_sent_to_manager',
          });

          return {
            summaryEmailSent: true,
            status: 'completed',
            emailSentTimestamp: new Date('2024-01-15T09:01:00Z'),
            emailRecipient: 'manager@example.com',
            summaryContent: {
              submissionStatus: {
                totalMembers: 7,
                submittedCount: 5,
                unsubmittedMembers: ['user006', 'user007'],
              },
              prioritizedIssues: [
                {
                  issueId: 'issue001',
                  title: 'サーバーログイン遅延',
                  priority: 1,
                  recommendedAction: '対応方針の見直し検討が必要',
                },
                {
                  issueId: 'issue002',
                  title: 'ネットワーク遅延',
                  priority: 2,
                  recommendedAction: '原因調査を進める',
                },
              ],
            },
          };
        }

        return {
          summaryEmailSent: true,
          status: 'completed',
          emailSentTimestamp: new Date('2024-01-15T08:48:00Z'),
          emailRecipient: 'manager@example.com',
        };
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-203
  test('should trigger handoff to human when recurring issue detected and resume action06 after human approval', async () => {
    const executionTimestamp = new Date('2024-01-15T09:00:00Z');
    const teamId = 'team-alpha';
    const reportDeadlineTime = '09:00';
    const managerEmail = 'manager@example.com';

    const input = {
      executionTimestamp,
      teamId,
      reportDeadlineTime,
      managerEmail,
    };

    let output: any = null;

    try {
      output = await runTx11Imp1Agent(input, mockAiClient);

      expect(handoffTriggered).toBe(true);
      expect(output.summaryEmailSent).toBe(false);
      expect(output.status).toBe('pending_human_approval');
      expect(output.handoffNotificationSent).toBe(true);

      const escalationEvent = auditLog.find((e) => e.eventType === 'escalation_triggered');
      expect(escalationEvent).toBeDefined();
      expect(escalationEvent?.reason).toBe('recurring_issue_detected');
      expect(escalationEvent?.occurrenceCount).toBe(5);

      const handoffEvent = auditLog.find((e) => e.eventType === 'handoff_to_human');
      expect(handoffEvent).toBeDefined();
      expect(handoffEvent?.status).toBe('awaiting_approval');

      const summaryInPending = output.pendingSummary;
      expect(summaryInPending).toBeDefined();
      expect(summaryInPending.prioritizedIssues).toHaveLength(2);
      expect(summaryInPending.prioritizedIssues[0].title).toBe('サーバーログイン遅延');
      expect(summaryInPending.prioritizedIssues[0].recommendedAction).toBe('対応方針の見直し検討が必要');

      humanApprovalGiven = true;

      const outputAfterApproval = await runTx11Imp1Agent(input, mockAiClient);

      expect(outputAfterApproval.summaryEmailSent).toBe(true);
      expect(outputAfterApproval.status).toBe('completed');
      expect(outputAfterApproval.emailRecipient).toBe('manager@example.com');

      const resumeEvent = auditLog.find((e) => e.eventType === 'action_06_resumed_after_approval');
      expect(resumeEvent).toBeDefined();

      const sideEffectEvent = auditLog.find((e) => e.eventType === 'side_effect_confirmed');
      expect(sideEffectEvent).toBeDefined();
      expect(sideEffectEvent?.action).toBe('summary_email_sent_to_manager');

      const eventSequence = auditLog
        .map((e) => e.eventType)
        .filter(
          (t) =>
            t === 'escalation_triggered' ||
            t === 'handoff_to_human' ||
            t === 'action_06_resumed_after_approval' ||
            t === 'side_effect_confirmed'
        );

      expect(eventSequence).toEqual([
        'escalation_triggered',
        'handoff_to_human',
        'action_06_resumed_after_approval',
        'side_effect_confirmed',
      ]);

      expect(mockAiClient.action01).toHaveBeenCalled();
      expect(mockAiClient.action02).toHaveBeenCalled();
      expect(mockAiClient.action03).toHaveBeenCalled();
      expect(mockAiClient.action04).toHaveBeenCalled();
      expect(mockAiClient.action05).toHaveBeenCalled();
      expect(mockAiClient.action06).toHaveBeenCalledTimes(2);

      const firstAction06Call = mockAiClient.action06.mock.calls[0];
      expect(firstAction06Call).toBeDefined();

      const secondAction06Call = mockAiClient.action06.mock.calls[1];
      expect(secondAction06Call).toBeDefined();

      expect(output.submissionStatus.totalMembers).toBe(7);
      expect(output.submissionStatus.submittedCount).toBe(5);
      expect(output.submissionStatus.unsubmittedMembers).toEqual(['user006', 'user007']);

      expect(outputAfterApproval.summaryContent.prioritizedIssues[0].priority).toBe(1);
      expect(outputAfterApproval.summaryContent.prioritizedIssues[1].priority).toBe(2);
    } catch (error) {
      throw error;
    }
  });
});