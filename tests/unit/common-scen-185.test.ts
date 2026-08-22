import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

// Mock dependencies
jest.mock('../../src/agents/tx-10-imp-1/orchestrator');
jest.mock('../../src/db/client');
jest.mock('../../src/audit/logger');
jest.mock('../../src/notification/email-client');

describe('notification-delivery: sendUnsubmittedReminder with escalation handling', () => {
  // SCEN-185
  test('should escalate and halt side effects when training material conflicts with business rules', async () => {
    // Setup: Import mock modules
    const { runTx10Imp1Agent } = require('../../src/agents/tx-10-imp-1/orchestrator');
    const { getDb } = require('../../src/db/client');
    const { auditLog } = require('../../src/audit/logger');
    const { sendEmail } = require('../../src/notification/email-client');

    // Setup: Mock database client
    const mockDb = {
      query: jest.fn(),
      transaction: jest.fn(),
      updateAgentStatus: jest.fn(),
      recordEscalation: jest.fn(),
    };
    getDb.mockReturnValue(mockDb);

    // Setup: Mock audit logger
    const auditLogMock = jest.fn();
    auditLog.mockImplementation(auditLogMock);

    // Setup: Mock email sender
    const emailSendMock = jest.fn().mockResolvedValue({ success: true });
    sendEmail.mockImplementation(emailSendMock);

    // Setup: Mock AI agent to simulate training material business rule mismatch
    const escalationError = new Error('training_material_business_rule_mismatch');
    escalationError.name = 'EscalationCondition';
    (escalationError as any).escalationReason = 'training_material_business_rule_mismatch';
    (escalationError as any).details = {
      businessRuleDefinition: 'Morning standup reports must be submitted by 10:00 AM daily. Required fields: yesterday results, today plans, issues. Target members: 10 engineers.',
      generatedMaterialIssue: 'Generated training material states: "Submit standup reports anytime during day, evening submission acceptable." This contradicts the 10:00 AM deadline.',
      recommendedFix: 'Regenerate training material to align with 10:00 AM submission deadline and mandatory fields requirement.',
    };

    // Simulate Agent Action 3 returning mismatched training material
    runTx10Imp1Agent.mockImplementation(async (config: any, aiClient: any) => {
      // Simulate Action 3 output
      const action3Output = {
        trainingMaterial: {
          submissionTime: 'anytime during business hours, evening acceptable',
          requiredFields: ['standup_content'],
          targetMemberCount: 10,
          content: 'You can submit reports flexibly throughout the day.',
        },
      };

      // Validate against business rule
      const businessRule = {
        submissionDeadline: '10:00 AM',
        requiredFields: ['yesterday_results', 'today_plans', 'issues'],
        targetMemberCount: 10,
      };

      // Detect mismatch
      if (
        action3Output.trainingMaterial.submissionTime !== businessRule.submissionDeadline ||
        action3Output.trainingMaterial.requiredFields.length !== businessRule.requiredFields.length
      ) {
        throw escalationError;
      }

      return action3Output;
    });

    // Setup: Database mock to record escalation status
    mockDb.updateAgentStatus.mockResolvedValue({
      agentExecutionId: 'tx_10_imp_1_exec_20240115_001',
      status: 'ESCALATION_PENDING_REVIEW',
      escalationReason: 'training_material_business_rule_mismatch',
      timestamp: new Date('2024-01-15T08:30:00Z').toISOString(),
    });

    mockDb.recordEscalation.mockResolvedValue({
      escalationId: 'esc_tx_10_imp_1_001',
      agentExecutionId: 'tx_10_imp_1_exec_20240115_001',
      escalationReason: 'training_material_business_rule_mismatch',
      details: {
        businessRuleDefinition: 'Morning standup reports must be submitted by 10:00 AM daily. Required fields: yesterday results, today plans, issues. Target members: 10 engineers.',
        generatedMaterialIssue: 'Generated training material states: "Submit standup reports anytime during day, evening submission acceptable." This contradicts the 10:00 AM deadline.',
        recommendedFix: 'Regenerate training material to align with 10:00 AM submission deadline and mandatory fields requirement.',
      },
      targetMemberIds: ['eng001', 'eng002', 'eng003', 'eng004', 'eng005', 'eng006', 'eng007', 'eng008', 'eng009', 'eng010'],
      recordedAt: new Date('2024-01-15T08:30:00Z').toISOString(),
    });

    // Setup: Test input parameters
    const managerUserId = 'mgr_20240115_001';
    const agentExecutionContext = {
      contractId: 'tx_10_imp_1',
      agentExecutionId: 'tx_10_imp_1_exec_20240115_001',
      departmentId: 'dept_engineering_001',
      targetMemberCount: 10,
      businessRuleCheckpoint: 'training_material_validation',
    };

    // Execute: Call sendUnsubmittedReminder with mocked dependencies
    let caughtError: any = null;
    let result: any = null;

    try {
      result = await sendUnsubmittedReminder(managerUserId, agentExecutionContext);
    } catch (err) {
      caughtError = err;
    }

    // Verify: Escalation condition detected
    expect(caughtError).toBeDefined();
    expect(caughtError.name).toBe('EscalationCondition');
    expect(caughtError.escalationReason).toBe('training_material_business_rule_mismatch');

    // Verify: Database status updated to escalation pending
    expect(mockDb.updateAgentStatus).toHaveBeenCalledWith(
      'tx_10_imp_1_exec_20240115_001',
      'ESCALATION_PENDING_REVIEW',
    );

    // Verify: Escalation record created with full details
    expect(mockDb.recordEscalation).toHaveBeenCalledWith({
      agentExecutionId: 'tx_10_imp_1_exec_20240115_001',
      escalationReason: 'training_material_business_rule_mismatch',
      details: expect.objectContaining({
        businessRuleDefinition: expect.stringMatching(/10:00 AM/),
        generatedMaterialIssue: expect.stringMatching(/anytime during day/),
        recommendedFix: expect.any(String),
      }),
      targetMemberIds: expect.arrayContaining(['eng001', 'eng002', 'eng003']),
    });

    // Verify: No email sent to members (side effects not confirmed)
    expect(emailSendMock).not.toHaveBeenCalled();

    // Verify: Audit log records escalation event
    expect(auditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'tx_10_imp_1_escalation_triggered',
        agentExecutionId: 'tx_10_imp_1_exec_20240115_001',
        escalationReason: 'training_material_business_rule_mismatch',
        timestamp: expect.any(String),
      }),
    );

    // Verify: Audit log contains escalation details including target member count
    const auditCallArgs = auditLogMock.mock.calls[0][0];
    expect(auditCallArgs).toMatchObject({
      eventType: 'tx_10_imp_1_escalation_triggered',
      escalationReason: 'training_material_business_rule_mismatch',
      targetMemberCount: 10,
    });

    // Verify: Agent execution status remains in escalation pending state
    expect(mockDb.updateAgentStatus).toHaveBeenCalledWith(
      'tx_10_imp_1_exec_20240115_001',
      'ESCALATION_PENDING_REVIEW',
    );

    // Verify: Side effects (Actions 4, 5, 6) were not executed
    const allDbCalls = mockDb.query.mock.calls;
    const feedbackDistributionCalls = allDbCalls.filter((call: any) =>
      call[0]?.includes?.('feedback_distribution') ||
      call[0]?.includes?.('member_notification_batch'),
    );
    expect(feedbackDistributionCalls.length).toBe(0);

    // Verify: No member autofeed or plan distribution occurred
    expect(mockDb.query).not.toHaveBeenCalledWith(
      expect.stringMatching(/INSERT INTO member_feedback_queue/),
    );
  });
});