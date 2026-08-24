import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import { type PrioritizeAndColorizeIssuesInput, type ColorizedIssueList, type IssueSummary, type ColorThresholdConfig } from '../../src/logic/issue-extraction-prioritization';

describe('Dashboard issue colorization - high priority issues highlighted in red', () => {
  // SCEN-1309
  test('should highlight issues with priority score 75 or above in red color on dashboard', () => {
    // Setup: Create test data with issues at different priority levels
    const testIssue_HighPriority: IssueSummary = {
      issueId: 'issue-001',
      priorityScore: 75,
      keyword: 'critical-bug',
      impactLevel: 'high'
    };

    const testIssue_MediumPriority: IssueSummary = {
      issueId: 'issue-002',
      priorityScore: 50,
      keyword: 'minor-issue',
      impactLevel: 'medium'
    };

    const issues: IssueSummary[] = [testIssue_HighPriority, testIssue_MediumPriority];

    // Define color threshold configuration
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues,
      colorThresholds,
      requestedBy: 'manager-001'
    };

    // Execute: Call prioritizeAndColorizeIssues function
    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    // Verify: Check that high priority issue (score 75) is colored red
    const colorizedHighPriorityIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-001'
    );
    expect(colorizedHighPriorityIssue).toBeDefined();
    expect(colorizedHighPriorityIssue?.highlightColor).toBe('red');

    // Verify: Check that medium priority issue (score 50) is NOT colored red
    const colorizedMediumPriorityIssue = result.colorizedIssues.find(
      (issue) => issue.issueId === 'issue-002'
    );
    expect(colorizedMediumPriorityIssue).toBeDefined();
    expect(colorizedMediumPriorityIssue?.highlightColor).not.toBe('red');

    // Verify: Color distribution shows 1 red issue
    expect(result.colorDistribution.red).toBe(1);

    // Verify: Confirm processedAt timestamp is set
    expect(result.processedAt).toBeDefined();
    const processedDate = new Date(result.processedAt);
    expect(processedDate.getTime()).toBeGreaterThan(0);
  });
});