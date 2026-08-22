import { extractAndRankIssues } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization', () => {
  // SCEN-076
  test('extractAndRankIssues should rank issues by importance and urgency matrix with correct priority order', () => {
    const issueA = {
      id: 'issue_001',
      title: 'Critical Production Bug',
      importance: 'high' as const,
      urgency: 'high' as const,
      impactRange: 'all_teams',
      recurrenceRisk: 'low',
      description: 'Database connection timeout in production',
    };

    const issueB = {
      id: 'issue_002',
      title: 'Documentation Outdated',
      importance: 'low' as const,
      urgency: 'high' as const,
      impactRange: 'single_team',
      recurrenceRisk: 'medium',
      description: 'API documentation needs update by end of day',
    };

    const issueC = {
      id: 'issue_003',
      title: 'Long-term Architecture Refactor',
      importance: 'high' as const,
      urgency: 'low' as const,
      impactRange: 'multiple_teams',
      recurrenceRisk: 'medium',
      description: 'System scalability improvement planned for Q2',
    };

    const issueD = {
      id: 'issue_004',
      title: 'Minor UI Polish',
      importance: 'low' as const,
      urgency: 'low' as const,
      impactRange: 'single_team',
      recurrenceRisk: 'low',
      description: 'Button color inconsistency on dashboard',
    };

    const inputIssues = [issueA, issueB, issueC, issueD];

    const result = extractAndRankIssues(inputIssues);

    // Verify ranked order: A (high/high) -> B (low/high) -> C (high/low) -> D (low/low)
    expect(result.rankedIssues.length).toBe(4);
    expect(result.rankedIssues[0].id).toBe('issue_001');
    expect(result.rankedIssues[1].id).toBe('issue_002');
    expect(result.rankedIssues[2].id).toBe('issue_003');
    expect(result.rankedIssues[3].id).toBe('issue_004');

    // Verify priority levels assigned
    expect(result.rankedIssues[0].priorityLevel).toBe('P0');
    expect(result.rankedIssues[1].priorityLevel).toBe('P1');
    expect(result.rankedIssues[2].priorityLevel).toBe('P1');
    expect(result.rankedIssues[3].priorityLevel).toBe('P3');

    // Verify importance scores are present
    expect(result.rankedIssues[0].importanceScore).toBeDefined();
    expect(typeof result.rankedIssues[0].importanceScore).toBe('number');
    expect(result.rankedIssues[0].importanceScore).toBeGreaterThan(0);

    // Verify urgency scores are present
    expect(result.rankedIssues[0].urgencyScore).toBeDefined();
    expect(typeof result.rankedIssues[0].urgencyScore).toBe('number');
    expect(result.rankedIssues[0].urgencyScore).toBeGreaterThan(0);

    // Verify composite priority score
    expect(result.rankedIssues[0].compositePriorityScore).toBeDefined();
    expect(typeof result.rankedIssues[0].compositePriorityScore).toBe('number');

    // Verify reasoning is present for all ranked issues
    expect(result.rankedIssues[0].rankingRationale).toBeDefined();
    expect(typeof result.rankedIssues[0].rankingRationale).toBe('string');
    expect(result.rankedIssues[0].rankingRationale.length).toBeGreaterThan(0);

    // Verify audit metadata
    expect(result.executionMetadata).toBeDefined();
    expect(result.executionMetadata.actionType).toBe('tx4_imp1_action_04');
    expect(result.executionMetadata.status).toBe('success');
    expect(result.executionMetadata.inputCount).toBe(4);
    expect(result.executionMetadata.outputCount).toBe(4);
    expect(result.executionMetadata.timestamp).toBeDefined();
    expect(new Date(result.executionMetadata.timestamp).getTime()).toBeLessThanOrEqual(Date.now());

    // Verify composite score ordering matches rank order
    expect(result.rankedIssues[0].compositePriorityScore).toBeGreaterThan(
      result.rankedIssues[1].compositePriorityScore
    );
    expect(result.rankedIssues[1].compositePriorityScore).toBeGreaterThanOrEqual(
      result.rankedIssues[2].compositePriorityScore
    );
    expect(result.rankedIssues[2].compositePriorityScore).toBeGreaterThan(
      result.rankedIssues[3].compositePriorityScore
    );

    // Verify all issues have matrix position metadata
    expect(result.rankedIssues[0].matrixPosition).toEqual({ importance: 'high', urgency: 'high' });
    expect(result.rankedIssues[1].matrixPosition).toEqual({ importance: 'low', urgency: 'high' });
    expect(result.rankedIssues[2].matrixPosition).toEqual({ importance: 'high', urgency: 'low' });
    expect(result.rankedIssues[3].matrixPosition).toEqual({ importance: 'low', urgency: 'low' });
  });
});