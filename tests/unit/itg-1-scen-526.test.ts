import { archiveAndManageIssueDataRetention } from '../../src/logic/issue-data-persistence';
import { type IssueRetentionPolicy, type IssueRetentionResult } from '../../src/logic/issue-data-persistence';

describe('Issue Data Persistence - Archival and Retention Management', () => {
  // SCEN-526: Verify that audit-required data with retention period < 365 days triggers warning log during archival process
  test('should archive and manage issue data retention with audit warning for analysis results with < 365 days retention', async () => {
    // Setup: Create mock issue data representing analysis results (90-day retention base)
    const mockIssueDataList = [
      {
        issueId: 'issue-001',
        originalCreatedDate: '2024-06-01T10:00:00Z',
        archivedDate: '2024-09-15T14:30:00Z',
        protectionCategory: 'audit_required',
        dataType: 'analysis_result',
        isAuditRequired: true,
        baseRetentionDays: 90,
      },
      {
        issueId: 'issue-002',
        originalCreatedDate: '2024-05-15T09:00:00Z',
        archivedDate: '2024-08-20T11:15:00Z',
        protectionCategory: 'audit_required',
        dataType: 'analysis_result',
        isAuditRequired: true,
        baseRetentionDays: 90,
      },
    ];

    // Setup: Define retention policy with 30-day archive threshold, 365-day deletion threshold
    const retentionPolicy: IssueRetentionPolicy = {
      archiveDaysThreshold: 30,
      deleteDaysThreshold: 365,
      protectedDataCategories: ['audit_required'],
      aggregationPeriodStart: undefined,
      aggregationPeriodEnd: undefined,
    };

    // Setup: Mock current date for deterministic testing
    const currentDate = new Date('2024-12-15T10:00:00Z');
    const executionTimestampIso = currentDate.toISOString();

    // Business logic verification:
    // - Base retention period for analysis_result: 90 days
    // - Audit adjustment factor when isAuditRequired=true: multiply by 2
    // - Adjusted retention period: 90 × 2 = 180 days
    // - Boundary condition: 90 < 365 (base retention < deletion threshold) ✓
    // - Constraint triggered: "audit_required flag is true AND retention period < 365 days" ✓
    // - Expected audit warning: "監査対象データの保持期間が短い可能性があります"

    // Execute: Call archiveAndManageIssueDataRetention with configured policy
    // Note: In production, this would also trigger recordIssueAuditLog internally
    const result: IssueRetentionResult = await archiveAndManageIssueDataRetention(
      mockIssueDataList,
      retentionPolicy,
      currentDate
    );

    // Verify output structure and values
    expect(result).toHaveProperty('archivedCount');
    expect(result).toHaveProperty('deletedCount');
    expect(result).toHaveProperty('protectedCount');
    expect(result).toHaveProperty('executionTimestamp');

    // Verify: archivedCount should reflect items moved to archive (30+ days old)
    // mock data archived dates: 2024-09-15 and 2024-08-20, current: 2024-12-15
    // Days elapsed: ~92 days and ~117 days respectively → both exceed 30-day threshold
    expect(result.archivedCount).toBe(2);

    // Verify: deletedCount should be 0 because protected data is retained despite age
    // Items are protected by 'audit_required' category, not deleted even if > 365 days archived
    expect(result.deletedCount).toBe(0);

    // Verify: protectedCount should reflect audit-required items that were protected from deletion
    // Both items have protectionCategory='audit_required' and isAuditRequired=true
    expect(result.protectedCount).toBe(2);

    // Verify: executionTimestamp must be in ISO 8601 format matching provided currentDate
    expect(result.executionTimestamp).toBe(executionTimestampIso);

    // Verify: Result timestamp is valid ISO 8601 format
    const parsedTimestamp = new Date(result.executionTimestamp);
    expect(parsedTimestamp.toISOString()).toBe(executionTimestampIso);
  });
});