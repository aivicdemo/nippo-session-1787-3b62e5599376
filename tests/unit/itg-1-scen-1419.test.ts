import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('Tool Integration Validation', () => {
  // SCEN-1419: [error] 課題データアーカイブ機能 - アーカイブ移行先テーブルの識別子が null のときエラーが返される
  test('should reject archive operation when archiveDestinationId is null', () => {
    const input = {
      integrationId: 'integration-001',
      sourceIssueCount: 3,
      targetToolType: 'jira' as const,
      registeredIssueIds: ['issue-001', 'issue-002', 'issue-003'],
      sourceIssueData: [
        {
          issueId: 'issue-001',
          keyword: 'performance',
          priorityScore: 75,
        },
        {
          issueId: 'issue-002',
          keyword: 'database',
          priorityScore: 85,
        },
        {
          issueId: 'issue-003',
          keyword: 'api',
          priorityScore: 65,
        },
      ],
      archiveDestinationId: null,
    };

    const result = validateToolIntegrationSuccess(input);

    expect(result.isValid).toBe(false);
    expect(result.validationStatus).toBe('mismatch');
    expect(result.mismatchDetails).toBeDefined();
    expect(result.mismatchDetails?.length).toBeGreaterThan(0);
    expect(
      result.mismatchDetails?.some(
        (detail) => detail.issueId === 'archive-destination'
      )
    ).toBe(true);
    expect(result.recommendedAction).toBe('manual_review');
  });
});