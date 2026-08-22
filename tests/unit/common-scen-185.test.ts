import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx10Imp1Agent } from '../../src/agents/tx-10-imp-1/orchestrator';
import type { Tx10Imp1AiClient } from '../../src/agents/tx-10-imp-1/orchestrator';
import type { Tx10AgentInput, Tx10AgentOutput } from '../../src/types/tx10-types';

describe('Tx10Imp1Agent - Orchestrator', () => {
  // SCEN-185: [error] 導入計画・研修実施・フィードバック対応の自動化・統合 AIエージェント - 研修教材の内容が業務ルールと不整合の場合に副作用の確定前に人へ引き継ぐ
  test('should escalate to manager when training material content conflicts with business rules before confirming side effects', async () => {
    // Setup: Test data with business rule definitions
    const businessRuleDefinition = {
      reportingDeadlineTime: '10:00',
      requiredFields: ['yesterday', 'today', 'issues'],
      targetEngineerCount: 10,
      deploymentInitiationTimestamp: new Date('2024-01-15T09:00:00Z'),
    };

    const agentInput: Tx10AgentInput = {
      deploymentInitiationTimestamp: new Date('2024-01-15T09:00:00Z'),
      participantList: [
        { userId: 'pm-001', role: 'ProjectManager', email: 'pm@example.com' },
        { userId: 'mgr-001', role: 'Manager', email: 'manager@example.com' },
        ...Array.from({ length: 10 }, (_, i) => ({
          userId: `eng-${String(i + 1).padStart(3, '0')}`,
          role: 'Engineer',
          email: `eng${i + 1}@example.com`,
        })),
      ],
      preparationDaysRequired: 5,
      reportingDeadlineTime: '10:00',
    };

    // Mock AI client with malformed training material response (conflicts with business rule)
    const mockAiClient: Tx10Imp1AiClient = {
      buildAction01Prompt: async () => ({
        deploymentSchedule: {
          startDate: new Date('2024-01-16T00:00:00Z'),
          phaseDeadlines: [
            { phase: 'setup', deadline: new Date('2024-01-17T00:00:00Z') },
            { phase: 'training', deadline: new Date('2024-01-19T00:00:00Z') },
          ],
          productionStartDate: new Date('2024-01-22T00:00:00Z'),
        },
      }),
      buildAction02Prompt: async () => ({
        managerGuideContent: 'Manager operation guide document',
      }),
      // Action 3: Generate training material with BUSINESS RULE MISMATCH
      buildAction03Prompt: async () => ({
        trainingMaterials: [
          {
            title: 'Engineer Training Material',
            content:
              'Daily report submission is allowed once per day in the evening after work. Submit to the system anytime between 17:00 and 23:59.',
            targetRole: 'Engineer',
          },
        ],
      }),
      buildAction04Prompt: async () => ({
        initialReportData: { submissions: [] },
      }),
      buildAction05Prompt: async () => ({
        feedbackItems: [],
      }),
      buildAction06Prompt: async () => ({
        onboardingApprovalStatus: { approved: false },
      }),
    };

    // Mock database and audit log storage
    const mockDb = {
      agents: new Map<string, unknown>(),
      auditLogs: new Array<unknown>(),
    };

    const mockEmailClient = {
      sendEmails: jest.fn().mockResolvedValue([]),
    };

    const mockMessageQueue = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    // Execute agent
    const result = await runTx10Imp1Agent(agentInput, mockAiClient);

    // Verify escalation was triggered (Action 3 validation detected mismatch)
    expect(result.status).toBe('ESCALATION_PENDING_REVIEW');

    // Verify side effects were NOT executed
    // Action 4, 5, 6 should not have created database entries or sent messages
    expect(mockDb.agents.size).toBe(0);
    expect(mockEmailClient.sendEmails).not.toHaveBeenCalled();
    expect(mockMessageQueue.publish).not.toHaveBeenCalled();

    // Verify escalation details in result
    expect(result.escalationDetails).toBeDefined();
    expect(result.escalationDetails.reason).toBe('training_material_business_rule_mismatch');
    expect(result.escalationDetails.businessRuleViolation).toContain('reporting_deadline_mismatch');
    expect(result.escalationDetails.conflictDescription).toContain('朝会提出時間ルール矛盾');
    expect(result.escalationDetails.recommendedAction).toContain('修正');

    // Verify audit log entry
    expect(mockDb.auditLogs.length).toBe(1);
    const auditEntry = mockDb.auditLogs[0] as Record<string, unknown>;
    expect(auditEntry.eventType).toBe('tx_10_imp_1_escalation_triggered');
    expect(auditEntry.reason).toBe('training_material_business_rule_mismatch');
    expect(auditEntry.timestamp).toBeDefined();
    expect((auditEntry.affectedEngineerCount as number)).toBe(10);

    // Verify no side effect confirmations
    expect(result.sideEffectsConfirmed).toBe(false);
    expect(result.actionsPending).toEqual([
      'buildAction04Prompt',
      'buildAction05Prompt',
      'buildAction06Prompt',
    ]);

    // Verify manager handoff payload contains detailed conflict information
    expect(result.handoffPayload).toBeDefined();
    expect(result.handoffPayload.conflictDetails).toContain('業務ルール定義');
    expect(result.handoffPayload.conflictDetails).toContain('生成教材の問題点');
    expect(result.handoffPayload.businessRuleDefinition).toEqual({
      reportingDeadlineTime: '10:00',
      requiredFields: ['yesterday', 'today', 'issues'],
    });
    expect(result.handoffPayload.generatedMaterialContent).toContain(
      'anytime between 17:00 and 23:59'
    );

    // Verify agent state persisted correctly
    expect(result.agentExecutionId).toBeDefined();
    expect(result.agentExecutionId).toMatch(/^tx_10_imp_1_/);
  });
});