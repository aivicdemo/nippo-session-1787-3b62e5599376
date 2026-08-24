import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractDashboardReportData } from '../../src/logic/manager-dashboard';

describe('extractDashboardReportData - empty report list handling', () => {
  // SCEN-2754
  test('should display dashboard gracefully with no report content and handle empty state without errors', async () => {
    // Setup: prepare empty report list scenario
    const userId = 'user-dept-head-001';
    const teamId = 'team-engineering-001';
    const reportDate = '2024-01-15';

    // Mock NotificationServiceAdapter stub
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        deliveryStatus: 'sent',
        userId: userId,
        timestamp: '2024-01-15T09:00:00Z',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduledId: 'sched-001',
        scheduledAt: '2024-01-15T08:30:00Z',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
        failureCount: 0,
      }),
    };

    // Mock TextAnalysisServiceAdapter stub
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [],
        frequencies: [],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 0,
        confidenceLevel: 0,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'low',
        classification: [],
      }),
    };

    // Empty report list input
    const emptyReportDataInput = {
      userId: userId,
      teamId: teamId,
      reportDate: reportDate,
      includeUnsubmitted: true,
    };

    // Execute function with empty report dataset
    const result = await extractDashboardReportData(
      emptyReportDataInput,
      mockNotificationServiceAdapter,
      mockTextAnalysisServiceAdapter
    );

    // Assertions: verify graceful handling of empty state
    expect(result).toBeDefined();
    expect(result.reportDate).toBe(reportDate);

    // Verify submission summary shows zero submissions
    expect(result.submissionSummary).toBeDefined();
    expect(result.submissionSummary.totalMembers).toBe(0);
    expect(result.submissionSummary.submittedCount).toBe(0);
    expect(result.submissionSummary.unsubmittedCount).toBe(0);
    expect(result.submissionSummary.submissionRate).toBe(0);

    // Verify prioritized issues list is empty
    expect(result.prioritizedIssues).toBeDefined();
    expect(Array.isArray(result.prioritizedIssues)).toBe(true);
    expect(result.prioritizedIssues.length).toBe(0);

    // Verify unsubmitted members list is empty (when includeUnsubmitted is true)
    expect(result.unsubmittedMembers).toBeDefined();
    expect(Array.isArray(result.unsubmittedMembers)).toBe(true);
    expect(result.unsubmittedMembers.length).toBe(0);

    // Verify last updated timestamp is set
    expect(result.lastUpdatedAt).toBeDefined();
    expect(typeof result.lastUpdatedAt).toBe('string');
    expect(result.lastUpdatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // Verify external API calls were NOT made for empty dataset
    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();

    // Verify no error logs were generated
    expect(result).not.toHaveProperty('error');
    expect(result).not.toHaveProperty('exception');
  });
});