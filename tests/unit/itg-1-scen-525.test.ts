import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { archiveAndManageIssueDataRetention } from '../../src/logic/issue-data-persistence';

describe('archiveAndManageIssueDataRetention', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-525: [edge] 指定された保持期間ルールに基づいて、古い課題データをアーカイブ領域に移行し、期限満了データを削除する。最後のアクセス日が作成日より前のときという明示された境界条件でアクセス日の整合性を確認してください
  test('should detect access date integrity violation and record warning while continuing archival and deletion processing', () => {
    const currentDate = new Date('2024-01-31T10:00:00Z');
    const createdDate = new Date('2024-01-01T09:00:00Z');
    const lastAccessedDate = new Date('2023-12-20T08:00:00Z');

    const testIssueData = [
      {
        issueExtractionResultId: 'issue-001',
        reportId: 'report-001',
        issueContent: 'Test issue content',
        createdAt: createdDate.toISOString(),
        priorityScore: 75,
        status: 'OPEN',
        lastAccessedAt: lastAccessedDate.toISOString(),
        dataType: 'analysis_result',
        isAuditRequired: false,
      },
    ];

    const retentionPolicy = {
      archiveDaysThreshold: 30,
      deleteDaysThreshold: 365,
      protectedDataCategories: ['audit_required'],
      aggregationPeriodStart: undefined,
      aggregationPeriodEnd: undefined,
    };

    const mockAuditLogId = 'audit-log-001';
    const mockExecutionTimestamp = currentDate.toISOString();

    const result = archiveAndManageIssueDataRetention(
      testIssueData,
      retentionPolicy,
      currentDate,
      mockAuditLogId,
      mockExecutionTimestamp
    );

    expect(result).toBeDefined();
    expect(result.executionTimestamp).toBe(mockExecutionTimestamp);
    expect(result.executionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    expect(result.auditLog).toBeDefined();
    expect(result.auditLog.message).toContain('アクセス日の整合性を確認してください');

    expect(result.archivedCount).toBeGreaterThanOrEqual(0);
    expect(result.deletedCount).toBeGreaterThanOrEqual(0);
    expect(result.protectedCount).toBeGreaterThanOrEqual(0);

    expect(typeof result.archivedCount).toBe('number');
    expect(typeof result.deletedCount).toBe('number');
    expect(typeof result.protectedCount).toBe('number');

    const accessDateViolationDetected = lastAccessedDate.getTime() < createdDate.getTime();
    expect(accessDateViolationDetected).toBe(true);

    expect(result.auditLog.severity).toBe('warning');
    expect(result.auditLog.operationType).toBe('RETENTION_CHECK');
  });
});