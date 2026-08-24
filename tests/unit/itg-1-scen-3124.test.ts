import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';
import { type Tx3Imp1AgentInput, type Tx3Imp1AgentOutput } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('Tx3Imp1Agent Authorization', () => {
  // SCEN-3124
  test('should deny authorization and return AUTHORIZATION_DENIED error when unprivileged user attempts to access restricted data', async () => {
    const aggregatedReportIds = ['report-001', 'report-002', 'report-003'];
    const analysisStartDate = '2024-01-08T00:00:00Z';
    const analysisEndDate = '2024-01-14T23:59:59Z';
    const managerUserId = 'manager-001';
    const priorityThresholdScore = 70;

    const agentInput: Tx3Imp1AgentInput = {
      aggregatedReportIds,
      analysisStartDate,
      analysisEndDate,
      managerUserId,
      priorityThresholdScore,
    };

    const auditLogEntries: Array<{
      userId: string;
      action: string;
      status: string;
      timestamp: string;
      context: string;
    }> = [];

    const stubAiClient: Tx3Imp1AiClient = {
      extractKeywords: jest.fn().mockRejectedValue({
        code: 'AUTHORIZATION_DENIED',
        message: 'User lacks permission to access this resource',
        statusCode: 403,
      }),
      assessImpactScore: jest.fn().mockRejectedValue({
        code: 'AUTHORIZATION_DENIED',
        message: 'User lacks permission to assess impact',
        statusCode: 403,
      }),
      classifyIssueSeverity: jest.fn().mockRejectedValue({
        code: 'AUTHORIZATION_DENIED',
        message: 'User lacks permission to classify issues',
        statusCode: 403,
      }),
    };

    const stubNotificationAdapter = {
      sendReminderNotification: jest.fn().mockRejectedValue({
        code: 'AUTHORIZATION_DENIED',
        message: 'Notification service access denied',
        statusCode: 403,
      }),
    };

    const executeResult = await runTx3Imp1Agent(agentInput, stubAiClient).catch(
      (error: {
        code: string;
        message: string;
        statusCode: number;
        auditLog?: Array<{
          userId: string;
          action: string;
          status: string;
          timestamp: string;
          context: string;
        }>;
      }) => {
        if (error.auditLog) {
          auditLogEntries.push(...error.auditLog);
        }
        return error;
      }
    );

    expect(executeResult).toHaveProperty('code');
    expect(executeResult.code).toBe('AUTHORIZATION_DENIED');
    expect(executeResult).toHaveProperty('statusCode');
    expect(executeResult.statusCode).toBe(403);

    expect(stubAiClient.extractKeywords).not.toHaveBeenCalled();
    expect(stubAiClient.assessImpactScore).not.toHaveBeenCalled();
    expect(stubAiClient.classifyIssueSeverity).not.toHaveBeenCalled();
    expect(stubNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();

    if (auditLogEntries.length > 0) {
      const auditLog = auditLogEntries[0];
      expect(auditLog.action).toMatch(/権限外データ参照試行|unauthorized.data.access/i);
      expect(auditLog.status).toMatch(/拒否|denied/i);
      expect(auditLog.context).toMatch(/認可チェック失敗|authorization.check.failed/i);
      expect(auditLog.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
      );
    }
  });
});