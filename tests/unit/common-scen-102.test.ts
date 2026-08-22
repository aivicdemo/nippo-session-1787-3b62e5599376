import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { getDashboardData } from '../../src/logic/dashboard-display';
import type { DashboardDataRequest, DashboardData, AuthorizationError as DashboardAuthorizationError } from '../../src/logic/dashboard-display';

describe('getDashboardData', () => {
  // SCEN-102: [error] 課題抽出から既存ツール連携・確認までの自律実行 AIエージェント - 権限外のデータ参照とツール操作を拒否する
  test('should throw AuthorizationError and record audit log when non-admin user attempts to access restricted data and perform unauthorized tool operations', () => {
    const restrictedUserId = 'user_general_001';
    const sessionToken = 'session_token_restricted_user_xyz';
    const restrictedDataAccessScope = 'restricted_readonly';
    const unauthorizedDepartmentId = 'dept_admin_only_789';
    const forbiddenToolOperation = 'jira_organization_setting_modify';
    const forbiddenAsanaOperation = 'asana_project_delete';
    const currentTimestamp = new Date('2024-01-15T11:00:00Z');

    const requestPayload: DashboardDataRequest = {
      userId: restrictedUserId,
      sessionToken: sessionToken,
      dataAccessScope: restrictedDataAccessScope,
      requestedDatasets: [
        {
          datasetType: 'issue_extraction_results',
          departmentId: unauthorizedDepartmentId,
          filterCriteria: {
            priorityRange: { min: 1, max: 5 },
            statusFilter: 'all',
          },
        },
        {
          datasetType: 'administrative_statistics',
          departmentId: unauthorizedDepartmentId,
          filterCriteria: {
            timeRange: { start: '2024-01-01', end: '2024-01-15' },
          },
        },
      ],
      toolOperations: [
        {
          operationType: forbiddenToolOperation,
          tool: 'jira',
          targetResourceId: 'org_jira_prod_config_001',
          actionType: 'modify',
        },
        {
          operationType: forbiddenAsanaOperation,
          tool: 'asana',
          targetResourceId: 'project_asana_strategic_999',
          actionType: 'delete',
        },
      ],
      requestTimestamp: currentTimestamp.toISOString(),
      auditLoggingEnabled: true,
    };

    let thrownError: DashboardAuthorizationError | null = null;
    let auditLogRecorded: boolean = false;
    let toolOperationsExecuted: number = 0;
    let notificationMessage: string = '';

    try {
      const result = getDashboardData(requestPayload);
      toolOperationsExecuted = result.toolOperationsExecuted ?? 0;
      notificationMessage = result.notificationMessage ?? '';
      auditLogRecorded = result.auditLogsRecorded ?? false;
    } catch (error) {
      if (error instanceof Error && 'errorCode' in error) {
        thrownError = error as DashboardAuthorizationError;
      } else {
        throw error;
      }
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError?.errorCode).toBe('AUTHORIZATION_ERROR');
    expect(thrownError?.message).toMatch(/Access denied: insufficient permission scope for/);
    expect(thrownError?.message).toMatch(/(?:issue_extraction_results|administrative_statistics|jira_organization_setting_modify|asana_project_delete)/);

    expect(toolOperationsExecuted).toBe(0);

    expect(notificationMessage).toMatch(/権限不足のため処理を中断しました/);

    expect(thrownError?.auditLogEntry).toBeDefined();
    expect(thrownError?.auditLogEntry?.eventType).toBe('AUTHORIZATION_DENIED');
    expect(thrownError?.auditLogEntry?.userId).toBe(restrictedUserId);
    expect(thrownError?.auditLogEntry?.attemptedOperation).toMatch(
      /(?:issue_extraction_results|administrative_statistics|jira_organization_setting_modify|asana_project_delete)/
    );
    expect(thrownError?.auditLogEntry?.denialReason).toBeDefined();
    expect(thrownError?.auditLogEntry?.denialReason).toBeTruthy();
    expect(thrownError?.auditLogEntry?.timestamp).toBeDefined();
    expect(new Date(thrownError?.auditLogEntry?.timestamp ?? '').getTime()).toBeGreaterThan(0);

    expect(thrownError?.requestMetadata).toBeDefined();
    expect(thrownError?.requestMetadata?.dataAccessScope).toBe(restrictedDataAccessScope);
    expect(thrownError?.requestMetadata?.departmentId).toBe(unauthorizedDepartmentId);
  });
});