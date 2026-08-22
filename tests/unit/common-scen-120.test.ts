import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import { type Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('Tx6Imp1Agent Authorization Denial', () => {
  // SCEN-120: [error] 日報収集から分析レポート生成までの自動実行 AIエージェント - 権限外のデータ参照とツール操作を拒否する
  test('should deny unauthorized access to personal data, confidential reports, and system tools', async () => {
    const executionTimestamp = new Date('2024-01-08T09:00:00Z');
    const analysisStartDate = '2024-01-01';
    const analysisEndDate = '2024-01-07';
    const teamId = 'team-001';
    const unauthorizedUserId = 'user-unauthorized';
    const denialReason = 'INSUFFICIENT_PERMISSION';

    const auditEvents: Array<{
      user_id: string;
      action: string;
      resource_type: string;
      timestamp: Date;
      denial_reason: string;
    }> = [];

    const mockAiClient: Tx6Imp1AiClient = {
      executeAction01: jest.fn(async () => {
        auditEvents.push({
          user_id: unauthorizedUserId,
          action: 'ACTION_01_FETCH_REPORTS',
          resource_type: 'PERSONAL_DATA_REPORTS',
          timestamp: new Date('2024-01-08T09:00:05Z'),
          denial_reason: denialReason,
        });
        const error = new Error('Unauthorized: Cannot access personal reports database');
        (error as any).statusCode = 403;
        throw error;
      }),

      executeAction02: jest.fn(async () => {
        auditEvents.push({
          user_id: unauthorizedUserId,
          action: 'ACTION_02_IDENTIFY_MISSING',
          resource_type: 'CROSS_DEPARTMENT_REPORTS',
          timestamp: new Date('2024-01-08T09:00:10Z'),
          denial_reason: denialReason,
        });
        const error = new Error('Unauthorized: Cannot access other departments reports');
        (error as any).statusCode = 403;
        throw error;
      }),

      executeAction03: jest.fn(async () => {
        auditEvents.push({
          user_id: unauthorizedUserId,
          action: 'ACTION_03_EXTRACT_ISSUES',
          resource_type: 'ANALYSIS_ENGINE',
          timestamp: new Date('2024-01-08T09:00:15Z'),
          denial_reason: denialReason,
        });
        const error = new Error('Unauthorized: Cannot access analysis engine');
        (error as any).statusCode = 403;
        throw error;
      }),

      executeAction04: jest.fn(async () => {
        auditEvents.push({
          user_id: unauthorizedUserId,
          action: 'ACTION_04_CLASSIFY_ISSUES',
          resource_type: 'REPORT_GENERATION_TOOL',
          timestamp: new Date('2024-01-08T09:00:20Z'),
          denial_reason: denialReason,
        });
        const error = new Error('Unauthorized: Cannot access report generation tool');
        (error as any).statusCode = 403;
        throw error;
      }),

      executeAction05: jest.fn(async () => {
        auditEvents.push({
          user_id: unauthorizedUserId,
          action: 'ACTION_05_TREND_ANALYSIS',
          resource_type: 'TREND_ANALYSIS_SYSTEM',
          timestamp: new Date('2024-01-08T09:00:25Z'),
          denial_reason: denialReason,
        });
        const error = new Error('Unauthorized: Cannot access trend analysis system');
        (error as any).statusCode = 403;
        throw error;
      }),

      executeAction06: jest.fn(async () => {
        auditEvents.push({
          user_id: unauthorizedUserId,
          action: 'ACTION_06_GENERATE_REPORT',
          resource_type: 'REPORT_GENERATION_ENGINE',
          timestamp: new Date('2024-01-08T09:00:30Z'),
          denial_reason: denialReason,
        });
        const error = new Error('Unauthorized: Cannot access report generation engine');
        (error as any).statusCode = 403;
        throw error;
      }),

      executeAction07: jest.fn(async () => {
        auditEvents.push({
          user_id: unauthorizedUserId,
          action: 'ACTION_07_DISTRIBUTE_REPORT',
          resource_type: 'EMAIL_SYSTEM_CREDENTIALS',
          timestamp: new Date('2024-01-08T09:00:35Z'),
          denial_reason: denialReason,
        });
        const error = new Error('Unauthorized: Cannot access email system credentials');
        (error as any).statusCode = 403;
        throw error;
      }),
    };

    const input = {
      executionTimestamp,
      analysisStartDate,
      analysisEndDate,
      teamId,
    };

    const contextWithoutPermission = {
      userId: unauthorizedUserId,
      userRole: 'MEMBER',
      teamIds: ['team-002'],
      permissions: [] as string[],
    };

    let orchestrationError: Error | null = null;

    try {
      await runTx6Imp1Agent(input, { ...mockAiClient, ...contextWithoutPermission });
    } catch (error) {
      orchestrationError = error as Error;
    }

    expect(orchestrationError).toBeDefined();
    expect(orchestrationError?.message).toMatch(/Unauthorized|forbidden|permission/i);

    expect(mockAiClient.executeAction01).toHaveBeenCalled();
    expect(mockAiClient.executeAction02).toHaveBeenCalled();
    expect(mockAiClient.executeAction03).toHaveBeenCalled();
    expect(mockAiClient.executeAction04).toHaveBeenCalled();
    expect(mockAiClient.executeAction05).toHaveBeenCalled();
    expect(mockAiClient.executeAction06).toHaveBeenCalled();
    expect(mockAiClient.executeAction07).toHaveBeenCalled();

    expect(auditEvents.length).toBeGreaterThan(0);

    const personalDataEvent = auditEvents.find(
      (e) => e.action === 'ACTION_01_FETCH_REPORTS' && e.resource_type === 'PERSONAL_DATA_REPORTS'
    );
    expect(personalDataEvent).toBeDefined();
    expect(personalDataEvent?.user_id).toBe(unauthorizedUserId);
    expect(personalDataEvent?.denial_reason).toBe(denialReason);
    expect(personalDataEvent?.timestamp).toEqual(new Date('2024-01-08T09:00:05Z'));

    const crossDeptEvent = auditEvents.find(
      (e) => e.action === 'ACTION_02_IDENTIFY_MISSING' && e.resource_type === 'CROSS_DEPARTMENT_REPORTS'
    );
    expect(crossDeptEvent).toBeDefined();
    expect(crossDeptEvent?.denial_reason).toBe(denialReason);

    const analysisEvent = auditEvents.find(
      (e) => e.action === 'ACTION_03_EXTRACT_ISSUES' && e.resource_type === 'ANALYSIS_ENGINE'
    );
    expect(analysisEvent).toBeDefined();
    expect(analysisEvent?.denial_reason).toBe(denialReason);

    const reportToolEvent = auditEvents.find(
      (e) => e.action === 'ACTION_04_CLASSIFY_ISSUES' && e.resource_type === 'REPORT_GENERATION_TOOL'
    );
    expect(reportToolEvent).toBeDefined();
    expect(reportToolEvent?.denial_reason).toBe(denialReason);

    const trendEvent = auditEvents.find(
      (e) => e.action === 'ACTION_05_TREND_ANALYSIS' && e.resource_type === 'TREND_ANALYSIS_SYSTEM'
    );
    expect(trendEvent).toBeDefined();
    expect(trendEvent?.denial_reason).toBe(denialReason);

    const reportGenEvent = auditEvents.find(
      (e) => e.action === 'ACTION_06_GENERATE_REPORT' && e.resource_type === 'REPORT_GENERATION_ENGINE'
    );
    expect(reportGenEvent).toBeDefined();
    expect(reportGenEvent?.denial_reason).toBe(denialReason);

    const emailEvent = auditEvents.find(
      (e) => e.action === 'ACTION_07_DISTRIBUTE_REPORT' && e.resource_type === 'EMAIL_SYSTEM_CREDENTIALS'
    );
    expect(emailEvent).toBeDefined();
    expect(emailEvent?.denial_reason).toBe(denialReason);

    const allEventsDeny = auditEvents.every((e) => e.denial_reason === denialReason);
    expect(allEventsDeny).toBe(true);

    const hasPartialSideEffect = mockAiClient.executeAction07.mock.calls.length > 0 && orchestrationError !== null;
    if (hasPartialSideEffect) {
      expect(auditEvents.some((e) => e.action === 'ACTION_07_DISTRIBUTE_REPORT')).toBe(true);
    }
  });
});