import { describe, test, expect } from '@jest/globals';
import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';
import { type MonthlyReportApprovalInput } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - Report Approval Validation', () => {
  // SCEN-2453: [error] 分析結果監査ログ記録機能 - 優先度判定ロジックのバージョンが存在しないバージョン番号のとき、監査ログ記録が失敗する
  test('should reject approval validation when priority decision logic version does not exist in registry', () => {
    const invalidInput: MonthlyReportApprovalInput = {
      reportId: 'report-2024-01-001',
      approvalStatus: 'approved',
      approverUserId: 'user-director-001',
    };

    expect(() => {
      validateMonthlyReportApproval(invalidInput, {
        priorityLogicVersion: 'v999',
        auditLogTable: [],
        versionRegistry: [
          { version: 'v1', releaseDate: '2024-01-01T00:00:00Z', deprecated: false },
          { version: 'v2', releaseDate: '2024-06-01T00:00:00Z', deprecated: false },
        ],
      });
    }).toThrow(/Version.*not found|バージョン.*存在しません/);
  });
});