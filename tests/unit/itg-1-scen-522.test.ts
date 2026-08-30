import { archiveAndManageIssueDataRetention } from '../../src/logic/issue-data-persistence';
import { type IssueRetentionPolicy, type IssueRetentionResult } from '../../src/logic/issue-data-persistence';

describe('Issue Data Persistence - Archive and Manage Retention', () => {
  test('SCEN-522: Archives old issue data based on retention policy and deletes expired archived data', async () => {
    const retentionPolicy: IssueRetentionPolicy = {
      archiveDaysThreshold: 30,
      deleteDaysThreshold: 365,
      protectedDataCategories: ['audit_required', 'executive_reference'],
      aggregationPeriodStart: '2026-01-01T00:00:00Z',
      aggregationPeriodEnd: '2026-02-01T00:00:00Z',
    };

    const mockIdentifyIssueDataForArchival = jest.fn().mockResolvedValue({
      archivedIssueDataItems: Array.from({ length: 30 }, (_, i) => ({
        issueExtractionResultId: `issue_${i + 1}`,
        reportId: `report_${i + 1}`,
        issueContent: `Issue content ${i + 1}`,
        createdAt: '2025-12-01T10:00:00Z',
        priorityScore: 50 + i,
        status: 'OPEN',
      })),
    });

    const mockIdentifyArchivedIssueDataForDeletion = jest.fn().mockResolvedValue({
      archivedIssueDataForDeletion: Array.from({ length: 5 }, (_, i) => ({
        issueDataId: `archived_${i + 1}`,
        archivedDate: '2024-12-01T10:00:00Z',
        deletionEligibilityDate: '2025-12-01T10:00:00Z',
        dataCategory: 'extracted_issue',
        integrityValidationStatus: 'valid',
      })),
    });

    const mockRecordIssueAuditLog = jest.fn().mockResolvedValue({
      auditLogId: 'audit_log_001',
      issueExtractionResultId: 'issue_extraction_001',
      executorUserId: 'user_001',
      operationType: 'DELETE' as const,
      changedFieldsEncrypted: 'encrypted_changes',
      logicVersionApplied: 'v1.0.0',
      recordedAt: new Date('2026-08-19T05:57:30.777Z'),
    });

    const result: IssueRetentionResult = await archiveAndManageIssueDataRetention(
      retentionPolicy,
      mockIdentifyIssueDataForArchival,
      mockIdentifyArchivedIssueDataForDeletion,
      mockRecordIssueAuditLog
    );

    expect(result.archivedCount).toBe(30);
    expect(result.deletedCount).toBe(5);
    expect(result.protectedCount).toBe(0);
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(mockIdentifyIssueDataForArchival).toHaveBeenCalledWith(retentionPolicy);
    expect(mockIdentifyArchivedIssueDataForDeletion).toHaveBeenCalled();
    expect(mockRecordIssueAuditLog).toHaveBeenCalled();
  });
});