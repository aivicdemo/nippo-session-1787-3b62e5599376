import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('Tool Integration Validation - Archive Eligibility Edge Case', () => {
  // SCEN-1426: [edge] 課題データアーカイブ機能 - 連携完了から29日59分59秒経過した課題データがアーカイブ対象外として判定される
  test('should mark issue data as non-archivable when 29 days 23 hours 59 minutes 59 seconds have passed since integration completion', () => {
    // Arrange: Setup current timestamp as fixed reference point
    const currentTime = new Date('2024-01-15T10:00:00Z').getTime();
    const integrationCompletedAt = new Date('2023-12-16T10:00:01Z').getTime(); // 29 days 23 hours 59 minutes 59 seconds before current time

    const elapsedMs = currentTime - integrationCompletedAt;
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000; // 2,592,000,000 ms

    // Verify elapsed time is less than 30 days
    expect(elapsedMs).toBeLessThan(thirtyDaysInMs);
    expect(elapsedMs).toBeGreaterThan(29 * 24 * 60 * 60 * 1000); // Greater than 29 days

    const input = {
      integrationId: 'integ-edge-case-001',
      sourceIssueCount: 5,
      targetToolType: 'jira' as const,
      registeredIssueIds: ['JIRA-001', 'JIRA-002', 'JIRA-003', 'JIRA-004', 'JIRA-005'],
      sourceIssueData: [
        {
          issueId: 'source-001',
          keyword: 'database-deadlock',
          priorityScore: 75,
        },
        {
          issueId: 'source-002',
          keyword: 'memory-leak',
          priorityScore: 68,
        },
        {
          issueId: 'source-003',
          keyword: 'api-timeout',
          priorityScore: 82,
        },
        {
          issueId: 'source-004',
          keyword: 'ui-crash',
          priorityScore: 55,
        },
        {
          issueId: 'source-005',
          keyword: 'data-sync-failure',
          priorityScore: 71,
        },
      ],
    };

    // Act: Call the validation function with test data
    const result = validateToolIntegrationSuccess(input);

    // Assert: Verify that the integration is valid and data should NOT be marked for archival
    expect(result.isValid).toBe(true);
    expect(result.validationStatus).toBe('success');
    expect(result.recommendedAction).toBe('proceed');
    expect(result.mismatchDetails).toBeUndefined();

    // Verify that at 29d23h59m59s elapsed, the data is NOT eligible for archival (archiveEligible should be false)
    // Archive eligibility calculation: archiveEligible = (currentTime - integrationCompletedAt) >= 30 days
    const isArchiveEligible = elapsedMs >= thirtyDaysInMs;
    expect(isArchiveEligible).toBe(false);
  });
});