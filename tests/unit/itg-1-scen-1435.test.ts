import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('Tool Integration Data Archival - 30 Day Expiration Edge Case', () => {
  test('SCEN-1435: Should correctly determine archival eligibility when integration completion timestamp contains fractional seconds', () => {
    // Integration completion timestamp with fractional seconds: 2026-01-15T09:30:45.123Z
    const integrationCompletionTimestamp = new Date('2026-01-15T09:30:45.123Z');

    // Test input: Course data with completion timestamp
    const integrationData = {
      integrationId: 'int-001',
      sourceIssueCount: 5,
      targetToolType: 'jira' as const,
      registeredIssueIds: ['issue-1', 'issue-2', 'issue-3', 'issue-4', 'issue-5'],
      sourceIssueData: [
        { issueId: 'issue-1', keyword: 'bug', priorityScore: 75 },
        { issueId: 'issue-2', keyword: 'feature', priorityScore: 60 },
        { issueId: 'issue-3', keyword: 'bug', priorityScore: 80 },
        { issueId: 'issue-4', keyword: 'performance', priorityScore: 50 },
        { issueId: 'issue-5', keyword: 'bug', priorityScore: 85 },
      ],
      integrationTimestamp: integrationCompletionTimestamp,
    };

    // Scenario 1: Current time exactly 30 days and fractional milliseconds after completion
    // Expected: archival should be triggered (isValid = true, archiveEligible = true)
    const currentTimeAfter30Days = new Date('2026-02-14T09:30:45.999Z');
    const resultAfter30Days = validateToolIntegrationSuccess(
      integrationData,
      currentTimeAfter30Days
    );

    // Verify that archival is eligible after 30 days have passed
    expect(resultAfter30Days.isValid).toBe(true);
    expect(resultAfter30Days.validationStatus).toBe('success');
    expect(resultAfter30Days.archiveEligible).toBe(true);
    expect(resultAfter30Days.archiveExecutionTime).toEqual(currentTimeAfter30Days);

    // Scenario 2: Current time just before 30 days have elapsed
    // Expected: archival should NOT be triggered (isValid = true, archiveEligible = false)
    const currentTimeJustBefore30Days = new Date('2026-02-14T09:30:44.999Z');
    const resultBefore30Days = validateToolIntegrationSuccess(
      integrationData,
      currentTimeJustBefore30Days
    );

    // Verify that archival is NOT eligible before 30 days have passed
    expect(resultBefore30Days.isValid).toBe(true);
    expect(resultBefore30Days.validationStatus).toBe('success');
    expect(resultBefore30Days.archiveEligible).toBe(false);
    expect(resultBefore30Days.archiveExecutionTime).toBeNull();
  });
});