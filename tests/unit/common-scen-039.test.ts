import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { runTx1Imp1Agent, type Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

describe('Tx1Imp1 Agent Orchestrator - Rollback on Partial Failure', () => {
  // SCEN-039
  test('should rollback completed side effects when Action 4 fails during execution', async () => {
    // Setup: Mock AI client with all action prompts
    const mockReportedIssues = [
      { issueId: 'ISSUE-001', description: 'Database connection timeout', severity: 'high' },
      { issueId: 'ISSUE-002', description: 'API response delay', severity: 'medium' },
    ];

    const mockUnsubmittedMembers = ['user-003', 'user-007', 'user-009'];

    const mockExtractedIssues = [
      { id: 'EXTRACTED-001', text: 'Database connection timeout', category: 'infrastructure' },
      { id: 'EXTRACTED-002', text: 'API response delay', category: 'performance' },
    ];

    // Track side effects for rollback verification
    const sentNotifications: Array<{ userId: string; timestamp: Date }> = [];
    const acquiredLocks: Array<{ reportId: string; lockId: string }> = [];
    const createdTempRecords: Array<{ recordId: string; issueId: string }> = [];

    // Mock AI client implementation
    const mockAiClient: Tx1Imp1AiClient = {
      // Action 1: Fetch reports (success)
      async executeAction01FetchReports(prompt: string) {
        acquiredLocks.push({ reportId: 'REPORT-BATCH-001', lockId: 'LOCK-12345' });
        return {
          status: 'success',
          reports: [
            { userId: 'user-001', reportContent: 'Completed feature X, found performance issue' },
            { userId: 'user-002', reportContent: 'Finished testing, no blockers' },
            { userId: 'user-004', reportContent: 'Implemented API v2, lag detected' },
          ],
        };
      },

      // Action 2: Send unsubmitted notifications (success)
      async executeAction02SendNotifications(prompt: string) {
        mockUnsubmittedMembers.forEach((userId) => {
          sentNotifications.push({ userId, timestamp: new Date('2024-01-15T09:00:00Z') });
        });
        return {
          status: 'success',
          notificationsSent: mockUnsubmittedMembers.length,
          recipients: mockUnsubmittedMembers,
        };
      },

      // Action 3: Extract issues (success)
      async executeAction03ExtractIssues(prompt: string) {
        mockExtractedIssues.forEach((issue) => {
          createdTempRecords.push({ recordId: `TEMP-${Date.now()}`, issueId: issue.id });
        });
        return {
          status: 'success',
          extractedIssueCount: mockExtractedIssues.length,
          issues: mockExtractedIssues,
        };
      },

      // Action 4: Assign priorities (intentional failure)
      async executeAction04AssignPriorities(prompt: string) {
        throw new Error('Action 4 execution failed: Invalid priority rule configuration');
      },

      // Action 5: Generate report (should not be called)
      async executeAction05GenerateReport(prompt: string) {
        throw new Error('Action 5 should not have been executed');
      },

      // Action 6: Send completion notification (should not be called)
      async executeAction06SendCompletion(prompt: string) {
        throw new Error('Action 6 should not have been executed');
      },
    };

    const testInput = {
      executionTimestamp: new Date('2024-01-15T08:45:00Z'),
      reportDeadlineTime: '09:00',
      morningMeetingStartTime: '09:30',
      teamMemberIds: ['user-001', 'user-002', 'user-003', 'user-004', 'user-005'],
      managerEmail: 'manager@example.com',
    };

    // Execute agent - expect failure
    const result = await runTx1Imp1Agent(testInput, mockAiClient);

    // Verify execution failure status
    expect(result.executionStatus).toBe('failure');

    // Verify side effects were created during execution
    expect(sentNotifications.length).toBe(3);
    expect(acquiredLocks.length).toBe(1);
    expect(createdTempRecords.length).toBe(2);

    // Verify rollback occurred: notifications should be cleared
    expect(sentNotifications).toHaveLength(0);

    // Verify rollback occurred: locks should be released
    expect(acquiredLocks).toHaveLength(0);

    // Verify rollback occurred: temp records should be deleted
    expect(createdTempRecords).toHaveLength(0);

    // Verify no completion notification was sent
    expect(result.summaryEmailSent).toBe(false);

    // Verify no aggregated reports or issues in output after rollback
    expect(result.aggregatedReportCount).toBe(0);
    expect(result.extractedIssueCount).toBe(0);
    expect(result.prioritizedIssueList).toHaveLength(0);
    expect(result.unsubmittedMemberCount).toBe(0);

    // Verify completion timestamp indicates failure moment
    expect(result.completionTimestamp).toBeInstanceOf(Date);

    // Test idempotency: Re-execute with same input should start clean
    const mockAiClientClean: Tx1Imp1AiClient = {
      async executeAction01FetchReports(prompt: string) {
        acquiredLocks.push({ reportId: 'REPORT-BATCH-002', lockId: 'LOCK-67890' });
        return {
          status: 'success',
          reports: [
            { userId: 'user-001', reportContent: 'Completed feature X, found performance issue' },
            { userId: 'user-002', reportContent: 'Finished testing, no blockers' },
            { userId: 'user-004', reportContent: 'Implemented API v2, lag detected' },
          ],
        };
      },

      async executeAction02SendNotifications(prompt: string) {
        mockUnsubmittedMembers.forEach((userId) => {
          sentNotifications.push({ userId, timestamp: new Date('2024-01-15T09:00:00Z') });
        });
        return {
          status: 'success',
          notificationsSent: mockUnsubmittedMembers.length,
          recipients: mockUnsubmittedMembers,
        };
      },

      async executeAction03ExtractIssues(prompt: string) {
        mockExtractedIssues.forEach((issue) => {
          createdTempRecords.push({ recordId: `TEMP-${Date.now()}`, issueId: issue.id });
        });
        return {
          status: 'success',
          extractedIssueCount: mockExtractedIssues.length,
          issues: mockExtractedIssues,
        };
      },

      async executeAction04AssignPriorities(prompt: string) {
        throw new Error('Action 4 execution failed: Invalid priority rule configuration');
      },

      async executeAction05GenerateReport(prompt: string) {
        throw new Error('Action 5 should not have been executed');
      },

      async executeAction06SendCompletion(prompt: string) {
        throw new Error('Action 6 should not have been executed');
      },
    };

    const retryResult = await runTx1Imp1Agent(testInput, mockAiClientClean);

    // Verify state is clean: no lingering side effects from first execution
    // Side effects should be isolated to each execution attempt
    expect(retryResult.executionStatus).toBe('failure');

    // Verify retry follows same rollback pattern
    expect(retryResult.summaryEmailSent).toBe(false);
    expect(retryResult.aggregatedReportCount).toBe(0);

    // Verify both execution attempts show idempotent behavior
    // (Restart attempt does not carry artifacts from previous failure)
    expect(result.completionTimestamp).not.toEqual(retryResult.completionTimestamp);
  });
});