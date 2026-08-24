import { validateToolIntegrationSuccess } from '../../src/logic/tool-integration';
import { type ToolIntegrationValidationResult } from '../../src/logic/tool-integration';

describe('Tool Integration Validation - Archive Old Issues', () => {
  // SCEN-1405: [normal] 課題データアーカイブ機能 - 30日以上前の課題と30日未満の課題が混在するとき、30日以上前の課題のみアーカイブされアクティブテーブルには30日未満の課題だけが残る
  test('should archive issues older than 30 days and keep active issues younger than 30 days', () => {
    // Setup: Create test data with mixed issue creation dates
    const today = new Date('2024-01-15T09:00:00Z');
    
    const issueA = {
      issueId: 'ISSUE-A',
      createdAt: new Date('2023-12-01T09:00:00Z'), // 45 days ago
      status: 'active' as const,
    };
    
    const issueB = {
      issueId: 'ISSUE-B',
      createdAt: new Date('2023-11-16T09:00:00Z'), // 60 days ago
      status: 'active' as const,
    };
    
    const issueC = {
      issueId: 'ISSUE-C',
      createdAt: new Date('2024-01-01T09:00:00Z'), // 15 days ago
      status: 'active' as const,
    };
    
    const issueD = {
      issueId: 'ISSUE-D',
      createdAt: new Date('2024-01-05T09:00:00Z'), // 10 days ago
      status: 'active' as const,
    };

    const activeIssues = [issueA, issueB, issueC, issueD];
    const archiveThresholdDays = 30;

    // Execute: Call the archive validation function with test data
    const result: ToolIntegrationValidationResult = validateToolIntegrationSuccess(
      activeIssues,
      today,
      archiveThresholdDays
    );

    // Verify: Check that only issues older than 30 days are marked for archival
    expect(result.isValid).toBe(true);
    expect(result.validationStatus).toBe('success');
    
    // Verify active table should contain only issues C and D (15 and 10 days old)
    expect(result.remainingActiveIssueIds).toEqual(['ISSUE-C', 'ISSUE-D']);
    expect(result.remainingActiveIssueIds.length).toBe(2);
    
    // Verify archive table should contain issues A and B (45 and 60 days old)
    expect(result.archivedIssueIds).toEqual(['ISSUE-A', 'ISSUE-B']);
    expect(result.archivedIssueIds.length).toBe(2);
    
    // Verify that archived issues are correctly identified
    expect(result.archivedIssueIds).toContain('ISSUE-A');
    expect(result.archivedIssueIds).toContain('ISSUE-B');
    
    // Verify that active issues are preserved
    expect(result.remainingActiveIssueIds).toContain('ISSUE-C');
    expect(result.remainingActiveIssueIds).toContain('ISSUE-D');
    
    // Verify no mismatch details should exist for successful archival
    expect(result.mismatchDetails).toBeUndefined();
    
    // Verify recommended action
    expect(result.recommendedAction).toBe('proceed');
  });
});