import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import type { Tx11Imp1AiClient } from '../../src/agents/tx-11-imp-1/orchestrator';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-3244
  test('課題の優先度付けが不確実な場合は部長に判断を仰ぎ、副作用確定前に人へ引き継ぐ', async () => {
    const executionTimestamp = new Date('2024-09-19T08:30:00Z');
    const teamId = 'team-dev-001';
    const reportDeadlineTime = '09:00';
    const managerEmail = 'manager@company.com';

    const notificationLogs: Array<{
      recipientEmail: string;
      messageType: string;
      confidenceLevel?: number;
      targetIssues?: string[];
      status: string;
    }> = [];

    const auditLogs: Array<{
      timestamp: Date;
      eventType: string;
      message: string;
    }> = [];

    const priorityJudgmentResults: Array<{
      marked: boolean;
      confirmed: boolean;
    }> = [];

    const mockAiClient: Tx11Imp1AiClient = {
      async action01FetchSubmissionStatus() {
        return {
          totalMembers: 10,
          submittedCount: 8,
          unsubmittedMembers: ['eng-003', 'eng-007'],
        };
      },

      async action02SendReminderNotifications() {
        notificationLogs.push({
          recipientEmail: 'eng-003@company.com',
          messageType: 'reminder',
          status: 'sent',
        });
        notificationLogs.push({
          recipientEmail: 'eng-007@company.com',
          messageType: 'reminder',
          status: 'sent',
        });
        return {
          sentCount: 2,
          failedCount: 0,
        };
      },

      async action03ExtractIssuesFromReports() {
        return {
          issues: [
            {
              keyword: 'システム性能低下',
              frequency: 3,
              affectedMembers: ['eng-001', 'eng-002', 'eng-004'],
            },
            {
              keyword: 'テスト環境不安定',
              frequency: 2,
              affectedMembers: ['eng-005', 'eng-008'],
            },
          ],
        };
      },

      async action04SearchPastIssuesAndExamples() {
        return {
          similarPastIssues: [
            {
              keyword: 'システム性能低下',
              previousOccurrences: 5,
              lastResolvedDate: '2024-08-15',
            },
          ],
          relatedExamples: [],
        };
      },

      async action05PrioritizeIssues() {
        priorityJudgmentResults.push({
          marked: false,
          confirmed: false,
        });

        return {
          prioritizedIssues: [
            {
              keyword: 'システム性能低下',
              priorityScore: 72,
              confidenceLevel: 80,
              frequencyCount: 3,
              impactLevel: 'high',
              recommendation: 'investigation_required',
            },
            {
              keyword: 'テスト環境不安定',
              priorityScore: 55,
              confidenceLevel: 85,
              frequencyCount: 2,
              impactLevel: 'medium',
              recommendation: 'monitor',
            },
          ],
          escalationDetected: true,
          escalationReason: 'priority_confidence_below_threshold',
          uncertainConfidenceLevel: 80,
        };
      },

      async action06SendManagerSummaryEmail() {
        throw new Error('Should not be called due to escalation');
      },
    };

    const result = await runTx11Imp1Agent(
      {
        executionTimestamp,
        teamId,
        reportDeadlineTime,
        managerEmail,
      },
      mockAiClient,
      {
        onEscalation: (escalationData) => {
          priorityJudgmentResults[0].marked = true;
          priorityJudgmentResults[0].confirmed = false;

          notificationLogs.push({
            recipientEmail: managerEmail,
            messageType: 'escalation_confirmation_request',
            confidenceLevel: escalationData.confidenceLevel,
            targetIssues: escalationData.issues.map((i) => i.keyword),
            status: 'sent',
          });

          auditLogs.push({
            timestamp: new Date('2024-09-19T08:35:00Z'),
            eventType: 'escalation_detected',
            message: `エスカレーション：優先度付け確実性不足により部長判断へ引き継ぎ (信頼度: ${escalationData.confidenceLevel}%)`,
          });
        },
        onTimeout: () => {
          auditLogs.push({
            timestamp: new Date('2024-09-19T08:50:00Z'),
            eventType: 'escalation_timeout',
            message: 'エスカレーション：優先度付けエスカレーション：部長判断待ち中に時間切れ',
          });
        },
      }
    );

    expect(result.executionStatus).toBe('escalation_pending');
    expect(result.submissionStatusSummary.totalMembers).toBe(10);
    expect(result.submissionStatusSummary.submittedCount).toBe(8);
    expect(result.submissionStatusSummary.unsubmittedMembers).toEqual(['eng-003', 'eng-007']);

    expect(result.prioritizedIssuesList).toHaveLength(2);
    expect(result.prioritizedIssuesList[0].keyword).toBe('システム性能低下');
    expect(result.prioritizedIssuesList[0].priorityScore).toBe(72);
    expect(result.prioritizedIssuesList[0].confidenceLevel).toBe(80);

    expect(priorityJudgmentResults).toHaveLength(1);
    expect(priorityJudgmentResults[0].marked).toBe(true);
    expect(priorityJudgmentResults[0].confirmed).toBe(false);

    const escalationNotification = notificationLogs.find(
      (log) => log.messageType === 'escalation_confirmation_request'
    );
    expect(escalationNotification).toBeDefined();
    expect(escalationNotification?.recipientEmail).toBe(managerEmail);
    expect(escalationNotification?.confidenceLevel).toBe(80);
    expect(escalationNotification?.targetIssues).toContain('システム性能低下');
    expect(escalationNotification?.status).toBe('sent');

    expect(result.managerSummaryEmailSent).toBe(false);

    expect(auditLogs).toHaveLength(2);
    expect(auditLogs[0].eventType).toBe('escalation_detected');
    expect(auditLogs[0].message).toMatch(/エスカレーション：優先度付け確実性不足により部長判断へ引き継ぎ/);
    expect(auditLogs[1].eventType).toBe('escalation_timeout');
    expect(auditLogs[1].message).toMatch(/部長判断待ち中に時間切れ/);
  });
});