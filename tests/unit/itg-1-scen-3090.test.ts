import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AgentInput, Tx1Imp1AgentOutput } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

// SCEN-3090
describe('日報集約から課題優先順位付けと未提出通知までの自律実行 - AI出力検証', () => {
  test('不正・曖昧・低確信度のAI出力を拒否してエスカレーション通知を送信し処理を中断する', async () => {
    const executionTimestamp = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const morningMeetingStartTime = new Date('2024-01-15T09:30:00Z');
    const targetTeamIds = ['team-001'];
    const managerUserId = 'manager-001';

    const input: Tx1Imp1AgentInput = {
      executionTimestamp,
      reportDeadlineTime,
      morningMeetingStartTime,
      targetTeamIds,
      managerUserId,
    };

    // Mock NotificationServiceAdapter to track escalation calls
    let escalationNotificationSent = false;
    let escalationNotificationCount = 0;
    const escalationNotificationPayload: any = {};

    // Mock AI client with malformed action 4 output
    const mockAiClient: Tx1Imp1AiClient = {
      action01_retrieveReportStatus: async () => ({
        submittedReports: [
          {
            memberId: 'member-001',
            teamId: 'team-001',
            reportText: 'システムDBが応答しない',
            submittedAt: new Date('2024-01-15T08:45:00Z'),
          },
        ],
        unsubmittedMembers: [
          {
            memberId: 'member-002',
            teamId: 'team-001',
            name: 'Alice Johnson',
          },
        ],
        aggregationCompletedAt: new Date('2024-01-15T08:50:00Z'),
      }),

      action02_sendUnsubmittedNotification: async () => ({
        notificationsSent: 1,
        failedNotifications: 0,
      }),

      action03_extractAndClassifyIssues: async () => ({
        extractedIssues: [
          {
            issueId: 'issue-001',
            text: 'システムDBが応答しない',
            category: 'INFRASTRUCTURE',
            frequency: 1,
            affectedMembers: ['member-001'],
          },
        ],
      }),

      // Action 4: Return malformed output with invalid priority score and low confidence
      action04_prioritizeIssues: async () => ({
        prioritizedIssues: [
          {
            issueId: 'issue-001',
            text: 'システムDBが応答しない',
            priorityScore: 150, // Invalid: exceeds max 100
            priorityRank: 'HIGH',
            rationale: '', // Empty rationale
            confidenceScore: 0.25, // Invalid: below 0.3 threshold
            version: 'ACTION_04_PROMPT_VERSION_1',
          },
        ],
      }),

      action05_generateMeetingMaterial: async () => ({
        materialUrl: 'https://example.com/material.html',
        generatedAt: new Date('2024-01-15T08:55:00Z'),
      }),

      action06_notifyCompletion: async () => ({
        notificationSent: true,
        sentAt: new Date('2024-01-15T08:56:00Z'),
      }),
    };

    // Mock NotificationServiceAdapter
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(async () => ({ status: 'sent' })),
      scheduleNotification: jest.fn(async () => ({ scheduled: true })),
      getDeliveryStatus: jest.fn(async () => ({ status: 'delivered' })),
      sendEscalationNotification: jest.fn(async (payload: any) => {
        escalationNotificationSent = true;
        escalationNotificationCount += 1;
        Object.assign(escalationNotificationPayload, payload);
        return { status: 'sent' };
      }),
    };

    // Execute agent
    const output = await runTx1Imp1Agent(input, mockAiClient, mockNotificationAdapter);

    // Verify execution status indicates failure due to validation
    expect(output.executionStatus).toBe('failure');

    // Verify escalation notification was sent exactly once
    expect(escalationNotificationSent).toBe(true);
    expect(escalationNotificationCount).toBe(1);
    expect(mockNotificationAdapter.sendEscalationNotification).toHaveBeenCalledTimes(1);

    // Verify escalation notification contains required fields
    expect(escalationNotificationPayload).toHaveProperty('issueText');
    expect(escalationNotificationPayload).toHaveProperty('invalidOutputDetails');
    expect(escalationNotificationPayload).toHaveProperty('confidenceScore');
    expect(escalationNotificationPayload).toHaveProperty('requiresHumanReview');
    expect(escalationNotificationPayload).toHaveProperty('timestamp');
    expect(escalationNotificationPayload).toHaveProperty('promptVersion');

    // Verify escalation payload contains specific error details
    expect(escalationNotificationPayload.issueText).toBe('システムDBが応答しない');
    expect(escalationNotificationPayload.requiresHumanReview).toBe(true);
    expect(escalationNotificationPayload.confidenceScore).toBe(0.25);
    expect(escalationNotificationPayload.invalidOutputDetails).toContain('priority');

    // Verify actions 5 and 6 were NOT executed
    expect(output.morningMeetingMaterialUrl).toBeUndefined();
    expect(mockAiClient.action05_generateMeetingMaterial).not.toHaveBeenCalled();
    expect(mockAiClient.action06_notifyCompletion).not.toHaveBeenCalled();

    // Verify internal status is PENDING_HUMAN_REVIEW
    expect(output).toHaveProperty('internalStatus');
    expect(output.internalStatus).toBe('PENDING_HUMAN_REVIEW');

    // Verify error log contains validation failure details
    expect(output).toHaveProperty('errorLog');
    expect(output.errorLog).toContain('ACTION_04');
    expect(output.errorLog).toContain('invalid');
    expect(output.errorLog).toContain('2024-01-15');

    // Verify report aggregation summary is not populated due to failure
    expect(output.reportAggregationSummary).toBeUndefined();

    // Verify prioritized issues list is empty
    expect(output.prioritizedIssuesList).toEqual([]);

    // Verify no duplicate notifications were sent
    expect(mockNotificationAdapter.sendEscalationNotification).toHaveBeenCalledTimes(1);
  });
});