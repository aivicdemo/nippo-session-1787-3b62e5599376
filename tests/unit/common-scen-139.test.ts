import { runTx7Imp1Agent, type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('MonthlyReportGeneration - Authorization Control', () => {
  test('SCEN-139: runTx7Imp1Agent rejects unauthorized data access and logs denial', async () => {
    const unauthorizedUserId = 'user_unauthorized';
    const mockTimestamp = '2024-01-15T09:00:00Z';
    const auditLogs: Array<{
      user_id: string;
      action: string;
      timestamp: string;
      resource: string;
      reason?: string;
    }> = [];

    const mockAuthorizationCheck = (
      userId: string,
      action: string,
      resource: string
    ): boolean => {
      if (userId === unauthorizedUserId) {
        auditLogs.push({
          user_id: userId,
          action: 'unauthorized_data_access_attempt',
          timestamp: mockTimestamp,
          resource: resource,
          reason: `User lacks permission for ${action} on ${resource}`,
        });
        return false;
      }
      return true;
    };

    const mockAiClient: Tx7Imp1AiClient = {
      async generateAction01Response() {
        const isAuthorized = mockAuthorizationCheck(
          unauthorizedUserId,
          'trigger_confirmation',
          'monthly_report_data'
        );
        if (!isAuthorized) {
          const error = new Error('AUTHORIZATION_DENIED');
          (error as any).code = 'AUTHORIZATION_DENIED';
          (error as any).userId = unauthorizedUserId;
          (error as any).resource = 'monthly_report_data';
          throw error;
        }
        return { confirmed: true };
      },
      async generateAction02Response() {
        const isAuthorized = mockAuthorizationCheck(
          unauthorizedUserId,
          'data_extraction',
          'accumulated_report_data'
        );
        if (!isAuthorized) {
          const error = new Error('AUTHORIZATION_DENIED');
          (error as any).code = 'AUTHORIZATION_DENIED';
          (error as any).userId = unauthorizedUserId;
          (error as any).resource = 'accumulated_report_data';
          throw error;
        }
        return { data: [] };
      },
      async generateAction03Response() {
        const isAuthorized = mockAuthorizationCheck(
          unauthorizedUserId,
          'report_generation',
          'monthly_report_data'
        );
        if (!isAuthorized) {
          const error = new Error('AUTHORIZATION_DENIED');
          (error as any).code = 'AUTHORIZATION_DENIED';
          (error as any).userId = unauthorizedUserId;
          (error as any).resource = 'monthly_report_data';
          throw error;
        }
        return { reportId: 'rpt_001' };
      },
      async generateAction04Response() {
        const isAuthorized = mockAuthorizationCheck(
          unauthorizedUserId,
          'analysis_timeseries',
          'monthly_report_data'
        );
        if (!isAuthorized) {
          const error = new Error('AUTHORIZATION_DENIED');
          (error as any).code = 'AUTHORIZATION_DENIED';
          (error as any).userId = unauthorizedUserId;
          (error as any).resource = 'monthly_report_data';
          throw error;
        }
        return { timeSeriesData: [] };
      },
      async generateAction05Response() {
        const isAuthorized = mockAuthorizationCheck(
          unauthorizedUserId,
          'analysis_bottleneck',
          'monthly_report_data'
        );
        if (!isAuthorized) {
          const error = new Error('AUTHORIZATION_DENIED');
          (error as any).code = 'AUTHORIZATION_DENIED';
          (error as any).userId = unauthorizedUserId;
          (error as any).resource = 'monthly_report_data';
          throw error;
        }
        return { improvementTrend: 'stable' as const, recurringIssuePattern: [] };
      },
      async generateAction06Response() {
        const isAuthorized = mockAuthorizationCheck(
          unauthorizedUserId,
          'performance_metrics',
          'monthly_report_data'
        );
        if (!isAuthorized) {
          const error = new Error('AUTHORIZATION_DENIED');
          (error as any).code = 'AUTHORIZATION_DENIED';
          (error as any).userId = unauthorizedUserId;
          (error as any).resource = 'monthly_report_data';
          throw error;
        }
        return {
          avgResolutionDays: 0,
          reportSubmissionRate: 0,
          issueRecurrenceRate: 0,
        };
      },
      async generateAction07Response() {
        const isAuthorized = mockAuthorizationCheck(
          unauthorizedUserId,
          'result_presentation',
          'monthly_report_data'
        );
        if (!isAuthorized) {
          const error = new Error('AUTHORIZATION_DENIED');
          (error as any).code = 'AUTHORIZATION_DENIED';
          (error as any).userId = unauthorizedUserId;
          (error as any).resource = 'monthly_report_data';
          throw error;
        }
        return { presented: true };
      },
      async generateAction08Response() {
        return { archived: true };
      },
    };

    const request = {
      targetMonth: '2024-01',
      teamId: 'team_001',
      triggeredBy: 'manual' as const,
      includeDetailedAnalysis: true,
    };

    const contextUserId = unauthorizedUserId;

    let thrownError: any = null;

    try {
      await runTx7Imp1Agent(request, mockAiClient, { userId: contextUserId });
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError?.code || thrownError?.message).toMatch(/AUTHORIZATION_DENIED/);

    const authorizationDenialLog = auditLogs.find(
      (log) =>
        log.user_id === unauthorizedUserId &&
        log.action === 'unauthorized_data_access_attempt'
    );

    expect(authorizationDenialLog).toBeDefined();
    expect(authorizationDenialLog?.resource).toBe('monthly_report_data');
    expect(authorizationDenialLog?.timestamp).toBe(mockTimestamp);

    const allDenialLogs = auditLogs.filter(
      (log) => log.action === 'unauthorized_data_access_attempt'
    );
    expect(allDenialLogs.length).toBeGreaterThan(0);

    allDenialLogs.forEach((log) => {
      expect(log.user_id).toBe(unauthorizedUserId);
      expect(log.timestamp).toBe(mockTimestamp);
      expect(log.reason).toMatch(/permission/);
    });
  });
});