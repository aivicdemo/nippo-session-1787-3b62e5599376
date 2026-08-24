import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import { type Tx11Imp1AiClient } from '../../src/agents/tx-11-imp-1/orchestrator';
import { type Tx11AgentInput, type Tx11AgentOutput } from '../../src/agents/tx-11-imp-1/orchestrator';

describe('TX11 AI Agent - Invalid/Ambiguous AI Output Rejection', () => {
  // SCEN-3245: [error] 日報収集・確認・催促の自動化エージェント AIエージェント - 不正・曖昧・低確信度のAI出力を拒否して安全に引き継ぐ
  test('should reject invalid AI outputs and escalate to manager with audit trail', async () => {
    const executionTimestamp = new Date('2024-01-15T08:30:00Z');
    const teamId = 'team-dev-001';
    const reportDeadlineTime = '09:00';
    const managerEmail = 'manager@company.com';

    const mockAiClient: Tx11Imp1AiClient = {
      extractKeywords: jest.fn().mockResolvedValue(null),
      assessImpactScore: jest.fn().mockResolvedValue({
        keyword: 'database_lag',
        impactScore: 45,
        confidence: 0.2,
        affectedTeamMembers: 3
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        keyword: 'database_lag',
        severity: '極高',
        rationale: 'unexpected_value'
      }),
      determinePriorityReason: jest.fn().mockResolvedValue({
        keyword: 'database_lag',
        reason: '判定困難'
      })
    };

    const mockNotificationService = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        sent: true,
        timestamp: new Date('2024-01-15T08:30:15Z'),
        deliveryStatus: 'success'
      })
    };

    const input: Tx11AgentInput = {
      executionTimestamp,
      teamId,
      reportDeadlineTime,
      managerEmail
    };

    const result = await runTx11Imp1Agent(input, mockAiClient, mockNotificationService);

    expect(result.executionStatus).toBe('ESCALATED_INVALID_OUTPUT');
    expect(result.submissionStatusSummary).toBeDefined();
    expect(result.prioritizedIssuesList).toEqual([]);
    expect(result.managerSummaryEmailSent).toBe(false);
    expect(result.reminderNotificationsSent).toBe(0);
    expect(result.pastIssueReferencesProvided).toBe(false);

    expect(mockNotificationService.sendReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: managerEmail,
        content: expect.stringContaining('AI判定結果の人間確認が必要')
      })
    );

    const notificationCall = mockNotificationService.sendReminderNotification.mock.calls[0][0];
    expect(notificationCall.content).toMatch(/AI出力が不正です|判定精度が不十分|分類値が範囲外|判定根拠が不明確/);

    expect(result.dashboardRedirect).toEqual({
      targetTab: 'pending-review',
      reason: 'invalid_ai_output',
      redirectUrl: expect.stringContaining('dashboard?tab=pending-review&reason=invalid_ai_output')
    });

    expect(result.auditLog).toBeDefined();
    expect(result.auditLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          timestamp: expect.any(Date),
          eventType: 'AI出力検証失敗',
          details: expect.any(String),
          escalationTarget: managerEmail,
          userActionRequired: false,
          teamId,
          failureReason: expect.stringMatching(/null返値|confidence|範囲外|判定困難/)
        })
      ])
    );
  });
});