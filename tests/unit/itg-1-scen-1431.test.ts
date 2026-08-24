import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('Tool Integration Archive Functionality - Year Boundary Edge Case', () => {
  // SCEN-1431: [edge] 課題データアーカイブ機能 - 連携完了日と30日経過時点が年をまたぐ場合に正確に経過判定が実行される
  test('should correctly determine 30-day archive threshold when crossing year boundary', () => {
    const integrationCompletionDate = new Date('2024-12-02T00:00:00Z');
    const archiveCheckDateAt30Days = new Date('2025-01-01T00:00:00Z');
    const archiveCheckDateAfter30Days = new Date('2025-01-01T00:00:01Z');

    const sourceIssueData = [
      {
        issueId: 'ISSUE-001',
        keyword: 'database connection timeout',
        priorityScore: 75,
      },
      {
        issueId: 'ISSUE-002',
        keyword: 'memory leak detection',
        priorityScore: 82,
      },
    ];

    const registeredIssueIds = ['ISSUE-001', 'ISSUE-002'];

    const inputAt30Days = {
      integrationId: 'integration-year-boundary-test',
      sourceIssueCount: 2,
      targetToolType: 'jira' as const,
      registeredIssueIds: registeredIssueIds,
      sourceIssueData: sourceIssueData,
      integrationCompletionDate: integrationCompletionDate,
      archiveCheckTimestamp: archiveCheckDateAt30Days,
    };

    const resultAt30Days = validateToolIntegrationSuccess(inputAt30Days);

    expect(resultAt30Days).toEqual({
      isValid: true,
      validationStatus: 'success',
      archiveEligible: true,
      daysSinceCompletion: 30,
      archivedIssueIds: ['ISSUE-001', 'ISSUE-002'],
      archiveStatus: 'eligible_for_archive',
      recommendedAction: 'proceed',
    });

    const inputAfter30Days = {
      integrationId: 'integration-year-boundary-test',
      sourceIssueCount: 2,
      targetToolType: 'jira' as const,
      registeredIssueIds: registeredIssueIds,
      sourceIssueData: sourceIssueData,
      integrationCompletionDate: integrationCompletionDate,
      archiveCheckTimestamp: archiveCheckDateAfter30Days,
    };

    const resultAfter30Days = validateToolIntegrationSuccess(inputAfter30Days);

    expect(resultAfter30Days).toEqual({
      isValid: true,
      validationStatus: 'success',
      archiveEligible: true,
      daysSinceCompletion: 30,
      archivedIssueIds: ['ISSUE-001', 'ISSUE-002'],
      archiveStatus: 'archived',
      recommendedAction: 'proceed',
    });

    expect(resultAt30Days.daysSinceCompletion).toBe(30);
    expect(resultAfter30Days.daysSinceCompletion).toBe(30);
    expect(resultAt30Days.archiveEligible).toBe(true);
    expect(resultAfter30Days.archiveEligible).toBe(true);
  });
});