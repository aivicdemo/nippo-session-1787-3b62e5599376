import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('朝会報告管理システム - 課題データアーカイブ機能', () => {
  // SCEN-1402: [normal] 課題データアーカイブ機能 - 連携完了から30日経過した課題1件のとき、その課題がアーカイブ領域に移行される
  test('should archive issue data when 30 days have passed since integration completion', () => {
    const now = new Date('2024-03-15T10:00:00Z');
    const integrationCompletedAt = new Date('2024-02-14T10:00:00Z'); // 30 days ago
    const expectedArchivedAt = now;

    const input = {
      integrationSessionId: 'sess-001',
      toolType: 'jira' as const,
      extractedIssueCount: 1,
      integrationTimestamp: integrationCompletedAt,
    };

    const issueDataForValidation = {
      issueId: 'issue-001',
      keyword: 'database connection timeout',
      priorityScore: 75,
    };

    const result = validateToolIntegrationSuccess(
      {
        ...input,
        sourceIssueData: [issueDataForValidation],
        registeredIssueIds: ['issue-001'],
        sourceIssueCount: 1,
        integrationId: 'int-001',
        targetToolType: 'jira' as const,
      },
      {
        currentTimestamp: now,
        archiveThresholdDays: 30,
      }
    );

    expect(result.isValid).toBe(true);
    expect(result.validationStatus).toBe('success');
    expect(result.archivedIssueIds).toContain('issue-001');
    expect(result.archivedAt).toEqual(expectedArchivedAt);
    expect(result.archiveStatus).toBe('archived');
  });
});