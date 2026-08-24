import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('Tool Integration - validateToolIntegrationSuccess', () => {
  // SCEN-1434
  test('should correctly separate archivable and non-archivable issues when mixed datasets are validated', () => {
    const archiveThresholdDays = 90;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const issueDataToArchive = [
      {
        issueId: 'ISSUE-001',
        keyword: 'database_performance',
        priorityScore: 85,
        createdAt: ninetyDaysAgo,
        isArchiveTarget: true,
      },
      {
        issueId: 'ISSUE-002',
        keyword: 'memory_leak',
        priorityScore: 78,
        createdAt: ninetyDaysAgo,
        isArchiveTarget: true,
      },
      {
        issueId: 'ISSUE-003',
        keyword: 'api_timeout',
        priorityScore: 72,
        createdAt: ninetyDaysAgo,
        isArchiveTarget: true,
      },
      {
        issueId: 'ISSUE-004',
        keyword: 'cache_invalidation',
        priorityScore: 65,
        createdAt: ninetyDaysAgo,
        isArchiveTarget: true,
      },
      {
        issueId: 'ISSUE-005',
        keyword: 'network_latency',
        priorityScore: 58,
        createdAt: ninetyDaysAgo,
        isArchiveTarget: true,
      },
    ];

    const issueDataNotToArchive = [
      {
        issueId: 'ISSUE-006',
        keyword: 'ui_rendering',
        priorityScore: 45,
        createdAt: thirtyDaysAgo,
        isArchiveTarget: false,
      },
      {
        issueId: 'ISSUE-007',
        keyword: 'accessibility',
        priorityScore: 52,
        createdAt: thirtyDaysAgo,
        isArchiveTarget: false,
      },
      {
        issueId: 'ISSUE-008',
        keyword: 'documentation',
        priorityScore: 38,
        createdAt: thirtyDaysAgo,
        isArchiveTarget: false,
      },
      {
        issueId: 'ISSUE-009',
        keyword: 'session_management',
        priorityScore: 68,
        createdAt: thirtyDaysAgo,
        isArchiveTarget: true,
      },
      {
        issueId: 'ISSUE-010',
        keyword: 'logging_improvement',
        priorityScore: 41,
        createdAt: thirtyDaysAgo,
        isArchiveTarget: true,
      },
    ];

    const mixedIssueData = [...issueDataToArchive, ...issueDataNotToArchive];

    const validationInput = {
      integrationId: 'INTEG-2024-001',
      sourceIssueCount: 10,
      targetToolType: 'jira' as const,
      registeredIssueIds: [
        'ISSUE-001',
        'ISSUE-002',
        'ISSUE-003',
        'ISSUE-004',
        'ISSUE-005',
        'ISSUE-006',
        'ISSUE-007',
        'ISSUE-008',
        'ISSUE-009',
        'ISSUE-010',
      ],
      sourceIssueData: mixedIssueData.map((issue) => ({
        issueId: issue.issueId,
        keyword: issue.keyword,
        priorityScore: issue.priorityScore,
      })),
    };

    const result = validateToolIntegrationSuccess(validationInput);

    expect(result).toBeDefined();
    expect(result.isValid).toBe(true);
    expect(result.validationStatus).toBe('success');

    const archivedIssueIds = issueDataToArchive
      .filter(
        (issue) =>
          issue.isArchiveTarget &&
          new Date().getTime() - issue.createdAt.getTime() >=
            archiveThresholdDays * 24 * 60 * 60 * 1000
      )
      .map((issue) => issue.issueId);

    const nonArchivedIssueIds = [
      ...issueDataNotToArchive
        .filter((issue) => !issue.isArchiveTarget)
        .map((issue) => issue.issueId),
      ...issueDataNotToArchive
        .filter(
          (issue) =>
            issue.isArchiveTarget &&
            new Date().getTime() - issue.createdAt.getTime() <
              archiveThresholdDays * 24 * 60 * 60 * 1000
        )
        .map((issue) => issue.issueId),
    ];

    expect(archivedIssueIds).toHaveLength(5);
    expect(nonArchivedIssueIds).toHaveLength(5);
    expect(archivedIssueIds.sort()).toEqual(
      ['ISSUE-001', 'ISSUE-002', 'ISSUE-003', 'ISSUE-004', 'ISSUE-005'].sort()
    );
    expect(nonArchivedIssueIds.sort()).toEqual(
      ['ISSUE-006', 'ISSUE-007', 'ISSUE-008', 'ISSUE-009', 'ISSUE-010'].sort()
    );
  });
});