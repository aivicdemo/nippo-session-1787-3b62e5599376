import { getDashboardData } from '../../src/logic/dashboard-display';
import type { Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/types';

describe('Dashboard Display - Authorization Control', () => {
  // SCEN-155: [error] 課題検索から可視化レポート作成までの自動実行 AIエージェント - 権限外のデータ参照とツール操作を拒否する
  test('should deny dashboard data access and report generation for unauthorized user with intern role', async () => {
    // Setup: Create fake AI client that enforces authorization checks
    const fakeAiClient: Tx8Imp1AiClient = {
      checkIssueDataAccessPermission: jest.fn(async (userId: string, userRole: string) => {
        // Only manager and above roles have issue data access
        const authorizedRoles = ['manager', 'director', 'executive'];
        if (!authorizedRoles.includes(userRole)) {
          const error = new Error(
            `User role [${userRole}] is not authorized to access issue data and create reports. Required role: manager or above`
          );
          (error as any).code = 'AUTHORIZATION_DENIED';
          (error as any).type = 'AuthorizationError';
          throw error;
        }
        return { authorized: true, userId, userRole };
      }),
      checkReportCreationPermission: jest.fn(async (userId: string, userRole: string) => {
        // Only manager and above roles have report creation permission
        const authorizedRoles = ['manager', 'director', 'executive'];
        if (!authorizedRoles.includes(userRole)) {
          const error = new Error(
            `User role [${userRole}] is not authorized to access issue data and create reports. Required role: manager or above`
          );
          (error as any).code = 'AUTHORIZATION_DENIED';
          (error as any).type = 'AuthorizationError';
          throw error;
        }
        return { authorized: true, userId, userRole };
      }),
      extractIssueData: jest.fn(),
      analyzeIssuePatterns: jest.fn(),
      generateVisualizationReport: jest.fn(),
      recordAuditEvent: jest.fn(async (event_type: string, user_id: string, action_name: string, reason: string) => {
        return {
          event_id: `audit_${Date.now()}`,
          event_type,
          user_id,
          action_name,
          reason,
          timestamp: new Date('2024-01-15T11:00:00Z').toISOString(),
        };
      }),
    };

    // Setup: Unauthorized user context
    const unauthorized_user_id = 'unauthorized_user';
    const unauthorized_user_role = 'intern';

    // Action: Call getDashboardData with unauthorized user context
    let caught_error: any = null;
    try {
      await getDashboardData(
        {
          user_id: unauthorized_user_id,
          role: unauthorized_user_role,
        },
        fakeAiClient
      );
    } catch (error: any) {
      caught_error = error;
    }

    // Assert: Verify authorization error is thrown
    expect(caught_error).not.toBeNull();
    expect(caught_error.type).toBe('AuthorizationError');
    expect(caught_error.code).toBe('AUTHORIZATION_DENIED');
    expect(caught_error.message).toMatch(/User role \[intern\] is not authorized to access issue data and create reports/);
    expect(caught_error.message).toMatch(/Required role: manager or above/);

    // Assert: Verify that issue data access permission check was called
    expect(fakeAiClient.checkIssueDataAccessPermission).toHaveBeenCalledWith(
      unauthorized_user_id,
      unauthorized_user_role
    );

    // Assert: Verify that report creation permission check was called
    expect(fakeAiClient.checkReportCreationPermission).toHaveBeenCalledWith(
      unauthorized_user_id,
      unauthorized_user_role
    );

    // Assert: Verify that issue data extraction was NOT called (authorization failed before execution)
    expect(fakeAiClient.extractIssueData).not.toHaveBeenCalled();

    // Assert: Verify that issue pattern analysis was NOT called
    expect(fakeAiClient.analyzeIssuePatterns).not.toHaveBeenCalled();

    // Assert: Verify that report generation was NOT called
    expect(fakeAiClient.generateVisualizationReport).not.toHaveBeenCalled();

    // Assert: Verify that audit event was recorded with correct parameters
    expect(fakeAiClient.recordAuditEvent).toHaveBeenCalledWith(
      'AUTHORIZATION_DENIED',
      unauthorized_user_id,
      expect.stringMatching(/extract_issue_data|create_visualization_report/),
      expect.stringMatching(/not authorized/)
    );

    // Assert: Verify that no further API calls or side effects occurred
    const extractCalls = (fakeAiClient.extractIssueData as jest.Mock).mock.calls.length;
    const analyzeCalls = (fakeAiClient.analyzeIssuePatterns as jest.Mock).mock.calls.length;
    const generateCalls = (fakeAiClient.generateVisualizationReport as jest.Mock).mock.calls.length;

    expect(extractCalls).toBe(0);
    expect(analyzeCalls).toBe(0);
    expect(generateCalls).toBe(0);
  });
});