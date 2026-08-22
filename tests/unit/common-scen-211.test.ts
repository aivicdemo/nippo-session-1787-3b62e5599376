import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import { type Tx11AgentInput, type Tx11AgentOutput } from '../../src/agents/tx-11-imp-1/types';
import { type Tx11Imp1AiClient } from '../../src/agents/tx-11-imp-1/types';

describe('Tx11Imp1Agent', () => {
  // SCEN-211
  test('should rollback compensation when Action 3 fails after Actions 1-2 succeed, preserving Action 1 results and audit logs', async () => {
    const executionTimestamp = new Date('2024-01-15T06:00:00Z');
    const teamId = 'team-001';
    const reportDeadlineTime = '09:00';
    const managerEmail = 'manager@example.com';

    const input: Tx11AgentInput = {
      executionTimestamp,
      teamId,
      reportDeadlineTime,
      managerEmail,
    };

    const submissionRecords: Record<string, boolean> = {
      memberA: true,
      memberB: false,
      memberC: true,
      memberD: false,
      memberE: true,
      memberF: true,
      memberG: true,
      memberH: true,
      memberI: true,
      memberJ: true,
    };

    const notificationSentRecords: Array<{ memberId: string; sentAt: Date }> = [];
    const auditEventRecords: Array<{
      timestamp: Date;
      action: string;
      status: string;
      details: string;
    }> = [];
    const extractedIssues: Array<{
      issueId: string;
      title: string;
      priority: number;
    }> = [];

    let action2CompleteFlag = false;
    let action3ErrorTriggered = false;

    const mockAiClient: Tx11Imp1AiClient = {
      action01_fetchSubmissionStatus: jest.fn(async () => {
        auditEventRecords.push({
          timestamp: new Date('2024-01-15T06:00:05Z'),
          action: 'Action 1 - Fetch Submission Status',
          status: 'success',
          details: 'Retrieved submission status for 10 members',
        });
        return {
          totalMembers: 10,
          submittedCount: 8,
          unsubmittedMembers: ['memberB', 'memberD'],
        };
      }),

      action02_sendReminderNotifications: jest.fn(async (unsubmittedMembers) => {
        notificationSentRecords.push({
          memberId: 'memberB',
          sentAt: new Date('2024-01-15T06:00:10Z'),
        });
        notificationSentRecords.push({
          memberId: 'memberD',
          sentAt: new Date('2024-01-15T06:00:11Z'),
        });
        action2CompleteFlag = true;
        auditEventRecords.push({
          timestamp: new Date('2024-01-15T06:00:10Z'),
          action: 'Action 2 - Send Reminder Notifications',
          status: 'success',
          details: `Sent reminder notifications to ${unsubmittedMembers.length} members`,
        });
        return {
          notificationsSent: [
            { memberId: 'memberB', type: 'email', status: 'sent' },
            { memberId: 'memberD', type: 'email', status: 'sent' },
          ],
        };
      }),

      action03_extractIssuesFromReports: jest.fn(async () => {
        action3ErrorTriggered = true;
        throw new Error('LLM_RESPONSE_TIMEOUT');
      }),

      action04_assignPrioritiesToIssues: jest.fn(async () => {
        return { prioritizedIssues: [] };
      }),

      action05_generateMorningMeetingSummary: jest.fn(async () => {
        return {
          summaryContent: 'Morning meeting summary',
          issuesCount: 0,
        };
      }),

      action06_sendSummaryToManager: jest.fn(async () => {
        return { emailSent: false };
      }),

      action07_compensateRollback: jest.fn(async (failedActionNumber) => {
        if (failedActionNumber === 3 && action2CompleteFlag) {
          notificationSentRecords.length = 0;
          auditEventRecords.push({
            timestamp: new Date('2024-01-15T06:00:15Z'),
            action: 'Rollback Compensation',
            status: 'completed',
            details:
              'tx_11_imp_1 Action 3失敗に伴うロールバック実行。Action 2で送信した催促通知2件を無効化。復帰時刻：2024-01-15 06:00:15',
          });
        }
        return { rollbackCompleted: true };
      }),
    };

    let caughtError: Error | null = null;
    let finalOutput: Tx11AgentOutput | null = null;

    try {
      finalOutput = await runTx11Imp1Agent(input, mockAiClient);
    } catch (error) {
      caughtError = error as Error;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError?.message).toMatch(/LLM_RESPONSE_TIMEOUT/);

    expect(mockAiClient.action01_fetchSubmissionStatus).toHaveBeenCalledWith(
      teamId,
      reportDeadlineTime
    );

    expect(mockAiClient.action02_sendReminderNotifications).toHaveBeenCalledWith(
      ['memberB', 'memberD'],
      teamId
    );

    expect(mockAiClient.action03_extractIssuesFromReports).toHaveBeenCalled();

    expect(action3ErrorTriggered).toBe(true);

    expect(notificationSentRecords.length).toBe(0);

    const action1AuditEvent = auditEventRecords.find(
      (e) => e.action === 'Action 1 - Fetch Submission Status'
    );
    expect(action1AuditEvent).toBeDefined();
    expect(action1AuditEvent?.status).toBe('success');

    const action2AuditEvent = auditEventRecords.find(
      (e) => e.action === 'Action 2 - Send Reminder Notifications'
    );
    expect(action2AuditEvent).toBeDefined();
    expect(action2AuditEvent?.status).toBe('success');

    const rollbackAuditEvent = auditEventRecords.find(
      (e) => e.action === 'Rollback Compensation'
    );
    expect(rollbackAuditEvent).toBeDefined();
    expect(rollbackAuditEvent?.status).toBe('completed');
    expect(rollbackAuditEvent?.details).toMatch(
      /tx_11_imp_1 Action 3失敗に伴うロールバック実行/
    );
    expect(rollbackAuditEvent?.details).toMatch(/催促通知2件を無効化/);
    expect(rollbackAuditEvent?.details).toMatch(/復帰時刻/);

    expect(mockAiClient.action07_compensateRollback).toHaveBeenCalledWith(3);

    const submissionAuditEvent = auditEventRecords.find(
      (e) => e.details.includes('Retrieved submission status')
    );
    expect(submissionAuditEvent).toBeDefined();
  });
});