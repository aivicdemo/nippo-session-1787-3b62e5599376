import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';

describe('Tool Integration Archive Eligibility - Exactly 30 Days Elapsed', () => {
  test('SCEN-1425: archiveEligibility correctly identifies 30-day threshold for integration completion', () => {
    // Setup: Define a fixed reference timestamp for deterministic testing
    const referenceTime = new Date('2026-02-19T10:00:00Z');
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

    // Test data A: Exactly 30 days before reference time (archive eligible)
    const integrationCompleteTimeA = new Date(
      referenceTime.getTime() - thirtyDaysInMs
    );
    const sourceIssueDataA: SourceIssueData[] = [
      {
        issueId: 'ISSUE-001',
        keyword: 'database_performance',
        priorityScore: 75,
      },
    ];
    const registeredIssueIdsA = ['ISSUE-001'];

    const inputA: ToolIntegrationValidationInput = {
      integrationId: 'integration-A',
      sourceIssueCount: 1,
      targetToolType: 'jira',
      registeredIssueIds: registeredIssueIdsA,
      sourceIssueData: sourceIssueDataA,
    };

    // Test data B: 29 days before reference time (not archive eligible)
    const integrationCompleteTimeB = new Date(
      referenceTime.getTime() - (29 * 24 * 60 * 60 * 1000)
    );
    const sourceIssueDataB: SourceIssueData[] = [
      {
        issueId: 'ISSUE-002',
        keyword: 'network_latency',
        priorityScore: 65,
      },
    ];
    const registeredIssueIdsB = ['ISSUE-002'];

    const inputB: ToolIntegrationValidationInput = {
      integrationId: 'integration-B',
      sourceIssueCount: 1,
      targetToolType: 'asana',
      registeredIssueIds: registeredIssueIdsB,
      sourceIssueData: sourceIssueDataB,
    };

    // Test data C: 31 days before reference time (archive eligible)
    const integrationCompleteTimeC = new Date(
      referenceTime.getTime() - (31 * 24 * 60 * 60 * 1000)
    );
    const sourceIssueDataC: SourceIssueData[] = [
      {
        issueId: 'ISSUE-003',
        keyword: 'memory_leak',
        priorityScore: 85,
      },
    ];
    const registeredIssueIdsC = ['ISSUE-003'];

    const inputC: ToolIntegrationValidationInput = {
      integrationId: 'integration-C',
      sourceIssueCount: 1,
      targetToolType: 'jira',
      registeredIssueIds: registeredIssueIdsC,
      sourceIssueData: sourceIssueDataC,
    };

    // Execute: Call validateToolIntegrationSuccess with test data
    // Passing integrationCompleteTime as context to determine archive eligibility
    const resultA = validateToolIntegrationSuccess(
      inputA,
      integrationCompleteTimeA,
      referenceTime
    );
    const resultB = validateToolIntegrationSuccess(
      inputB,
      integrationCompleteTimeB,
      referenceTime
    );
    const resultC = validateToolIntegrationSuccess(
      inputC,
      integrationCompleteTimeC,
      referenceTime
    );

    // Verify: Check archive eligibility flags
    // Data A: exactly 30 days elapsed → should be archive eligible (true)
    expect(resultA.isArchiveEligible).toBe(true);

    // Data B: 29 days elapsed → should NOT be archive eligible (false)
    expect(resultB.isArchiveEligible).toBe(false);

    // Data C: 31 days elapsed → should be archive eligible (true)
    expect(resultC.isArchiveEligible).toBe(true);

    // Additional verification: Ensure validation status is success
    expect(resultA.validationStatus).toBe('success');
    expect(resultB.validationStatus).toBe('success');
    expect(resultC.validationStatus).toBe('success');

    // Verify: Confirm boundary condition at exactly 30 days
    // The 30-day threshold should be inclusive (>= 30 days triggers archive)
    const elapsedDaysA =
      (referenceTime.getTime() - integrationCompleteTimeA.getTime()) /
      (24 * 60 * 60 * 1000);
    expect(elapsedDaysA).toBe(30);
    expect(resultA.isArchiveEligible).toBe(true);
  });
});