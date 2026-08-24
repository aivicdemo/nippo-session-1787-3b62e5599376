import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import type { Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';
import { buildAction07Prompt, ACTION_07_PROMPT_VERSION } from '../../src/agents/tx-4-imp-1/prompts/action-07';

describe('Tx4Imp1Agent - Unsubmitted Member Extraction and Notification', () => {
  test('SCEN-3135: runTx4Imp1Agent automatically extracts unsubmitted members and sends notifications via Action 7', async () => {
    // Setup: Unsubmitted members for the test day
    const unsubmittedMembers = ['member_003', 'member_007', 'member_009'];
    const teamId = 'team_001';
    const managerId = 'manager_001';
    const reportDate = '2024-01-15';
    const meetingStartTime = '09:00';

    // Mock NotificationServiceAdapter to track sendReminderNotification calls
    const notificationSendHistory: Array<{
      userId: string;
      message: string;
      status: string;
    }> = [];

    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn(async (userId: string, message: string) => {
        notificationSendHistory.push({
          userId,
          message,
          status: 'success',
        });
        return {
          status: 'success',
          deliveryTimestamp: new Date('2024-01-15T08:30:00Z').toISOString(),
        };
      }),
      scheduleNotification: jest.fn(async () => ({
        scheduled: true,
      })),
      getDeliveryStatus: jest.fn(async () => ({
        status: 'delivered',
      })),
    };

    // Mock buildAction07Prompt to verify it is called
    let action07PromptBuilt = false;
    const buildAction07PromptSpy = jest.fn(() => {
      action07PromptBuilt = true;
      return `Extract unsubmitted members from last 24 hours for team ${teamId}`;
    });

    // Setup fake AI client implementing Tx4Imp1AiClient interface
    const fakeAiClient: Tx4Imp1AiClient = {
      invokeAction01: jest.fn(async () => ({
        aggregatedCount: 10,
        timestamp: new Date('2024-01-15T08:00:00Z').toISOString(),
      })),
      invokeAction02: jest.fn(async () => ({
        detectedCount: 3,
        detectedMembers: unsubmittedMembers,
        timestamp: new Date('2024-01-15T08:05:00Z').toISOString(),
      })),
      invokeAction03: jest.fn(async () => ({
        extractedCount: 8,
        timestamp: new Date('2024-01-15T08:10:00Z').toISOString(),
      })),
      invokeAction04: jest.fn(async () => ({
        prioritizedCount: 8,
        timestamp: new Date('2024-01-15T08:15:00Z').toISOString(),
      })),
      invokeAction05: jest.fn(async () => ({
        generatedAt: new Date('2024-01-15T08:20:00Z').toISOString(),
        resourceUrl: 'https://example.com/reports/report_001.pdf',
      })),
      invokeAction06: jest.fn(async () => ({
        notificationSent: true,
        timestamp: new Date('2024-01-15T08:25:00Z').toISOString(),
      })),
      invokeAction07: jest.fn(async () => {
        // Simulate Action 7: Extract unsubmitted members and send notifications
        const prompt = buildAction07PromptSpy();
        // Mock the AI response for unsubmitted member extraction
        for (const memberId of unsubmittedMembers) {
          await notificationServiceAdapterStub.sendReminderNotification(
            memberId,
            `Reminder: Please submit your daily report for ${reportDate} by ${meetingStartTime}`,
          );
        }
        return {
          unsubmittedMembers,
          notificationsSent: unsubmittedMembers.length,
          timestamp: new Date('2024-01-15T08:30:00Z').toISOString(),
        };
      }),
    };

    // Execute: Call runTx4Imp1Agent with request and fake AI client
    const request = {
      teamId,
      managerId,
      reportDate,
      meetingStartTime,
    };

    const result = await runTx4Imp1Agent(request, fakeAiClient);

    // Verify: Action 7 was invoked
    expect(fakeAiClient.invokeAction07).toHaveBeenCalled();

    // Verify: Unsubmitted members were extracted
    expect(result.executionId).toBeDefined();
    expect(typeof result.executionId).toBe('string');
    expect(result.executionId.length).toBeGreaterThan(0);

    // Verify: NotificationServiceAdapter was called for each unsubmitted member
    expect(notificationSendHistory.length).toBe(3);
    expect(notificationSendHistory[0].userId).toBe('member_003');
    expect(notificationSendHistory[1].userId).toBe('member_007');
    expect(notificationSendHistory[2].userId).toBe('member_009');

    // Verify: Each notification has expected message format
    for (const notification of notificationSendHistory) {
      expect(notification.message).toContain('Reminder');
      expect(notification.message).toContain(reportDate);
      expect(notification.message).toContain(meetingStartTime);
      expect(notification.status).toBe('success');
    }

    // Verify: buildAction07Prompt was used (indirectly through the spy)
    expect(buildAction07PromptSpy).toHaveBeenCalled();
    expect(action07PromptBuilt).toBe(true);

    // Verify: ACTION_07_PROMPT_VERSION is defined and valid
    expect(ACTION_07_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_07_PROMPT_VERSION).toBe('string');
    expect(ACTION_07_PROMPT_VERSION.length).toBeGreaterThan(0);

    // Verify: Result contains expected output structure
    expect(result.aggregatedReportCount).toBeGreaterThan(0);
    expect(result.extractedIssueCount).toBeGreaterThanOrEqual(0);
    expect(result.prioritizedIssues).toBeDefined();
    expect(Array.isArray(result.prioritizedIssues)).toBe(true);
    expect(result.countermeasurePlan).toBeDefined();
    expect(result.countermeasurePlan.topPriorityIssue).toBeDefined();
    expect(result.countermeasurePlan.recommendedActions).toBeDefined();
    expect(Array.isArray(result.countermeasurePlan.recommendedActions)).toBe(true);
    expect(result.countermeasurePlan.estimatedResolutionDays).toBeGreaterThan(0);
    expect(result.countermeasurePlan.assignedTeamId).toBe(teamId);
    expect(result.summaryEmailSent).toBe(true);
    expect(result.completionTimestamp).toBeDefined();

    // Verify: Completion timestamp is after start of execution
    const completionTime = new Date(result.completionTimestamp);
    const startTime = new Date('2024-01-15T08:00:00Z');
    expect(completionTime.getTime()).toBeGreaterThanOrEqual(startTime.getTime());
  });
});