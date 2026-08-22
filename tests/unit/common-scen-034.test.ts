import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  test('SCEN-034: should reject malformed AI output and halt execution with human review required', async () => {
    const mockAiClient = {
      generateAction01Response: jest.fn().mockResolvedValue({
        submittedEmployeeIds: 'not-an-array',
        unsubmittedEmployeeIds: ['EMP001'],
        timestamp: '2024-01-15T09:00:00Z',
      }),
    };

    const mockAuditLogger = {
      log: jest.fn(),
    };

    const mockEmailService = {
      send: jest.fn(),
    };

    const mockStateManager = {
      setState: jest.fn(),
    };

    const executionContext = {
      agentId: 'tx-1-imp-1',
      executionId: 'exec-20240115-001',
      actionVersion: 'ACTION_01_PROMPT_VERSION_1.0.0',
    };

    const result = await sendUnsubmittedReminder(
      {
        aiClient: mockAiClient,
        auditLogger: mockAuditLogger,
        emailService: mockEmailService,
        stateManager: mockStateManager,
        executionContext,
      }
    );

    expect(result.status).toBe('HALTED_AWAITING_HUMAN_REVIEW');
    expect(result.error).toMatch(/submittedEmployeeIds.*array/i);
    expect(result.errorType).toBe('MALFORMED_OUTPUT');

    expect(mockAuditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
        action: 'Action-01',
        error_type: 'MALFORMED_OUTPUT',
        prompt_version: 'ACTION_01_PROMPT_VERSION_1.0.0',
        rejection_reason: 'type_mismatch',
        executionId: 'exec-20240115-001',
      })
    );

    expect(mockEmailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: 'director@example.com',
        subject: expect.stringContaining('朝会資料作成が保留中'),
        body: expect.stringContaining('AI出力の妥当性確認が必要です'),
        template: 'HUMAN_REVIEW_REQUIRED',
      })
    );

    expect(mockStateManager.setState).toHaveBeenCalledWith(
      'exec-20240115-001',
      'HALTED_AWAITING_HUMAN_REVIEW'
    );

    expect(result.executionFlow).toEqual({
      completedActions: [],
      haltedAtAction: 'Action-01',
      pendingActions: ['Action-02', 'Action-03', 'Action-04', 'Action-05', 'Action-06'],
      nextStepForHuman: 'Verify AI output format and retry or adjust prompt',
    });

    expect(mockAiClient.generateAction01Response).toHaveBeenCalled();
    expect(mockEmailService.send).not.toHaveBeenCalledWith(
      expect.objectContaining({
        template: 'UNSUBMITTED_REMINDER',
      })
    );
    expect(mockEmailService.send).not.toHaveBeenCalledWith(
      expect.objectContaining({
        template: 'PRIORITY_RANKED_ISSUES',
      })
    );
  });
});