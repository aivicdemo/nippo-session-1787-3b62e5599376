import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { generateAndSendConfirmationEmail } from '../../src/logic/notification-delivery';
import type { ConfirmationEmailInput, ConfirmationEmailOutput } from '../../src/logic/notification-delivery';

describe('generateAndSendConfirmationEmail - Invalid User ID Rejection', () => {
  // SCEN-451
  it('should reject with INVALID_USER_ID error when aggregatedReports contain invalid user ID and prevent all external API calls', async () => {
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const reportDeadlineDateTime = new Date('2024-01-15T09:00:00Z');
    const analysisDate = new Date('2024-01-15T08:00:00Z');
    const managerUserId = 'MANAGER_001';
    const teamId = 'TEAM_A';

    const aggregatedReports: ConfirmationEmailInput['aggregatedReports'] = [
      {
        reportId: 'RPT_001',
        reporterUserId: 'USER_001',
        reporterName: 'Alice',
        yesterdayAccomplishment: 'Completed API design',
        todayPlan: 'Implement API endpoints',
        challenges: 'Database performance issue',
        submissionDateTime: new Date('2024-01-15T08:15:00Z'),
      },
      {
        reportId: 'RPT_002',
        reporterUserId: 'USER_002',
        reporterName: 'Bob',
        yesterdayAccomplishment: 'Fixed login bug',
        todayPlan: 'Deploy hotfix',
        challenges: 'Server connection timeout',
        submissionDateTime: new Date('2024-01-15T08:20:00Z'),
      },
      {
        reportId: 'RPT_003',
        reporterUserId: 'USER_011',
        reporterName: 'InvalidUser',
        yesterdayAccomplishment: 'Test work',
        todayPlan: 'Test plan',
        challenges: 'Test issue',
        submissionDateTime: new Date('2024-01-15T08:25:00Z'),
      },
    ];

    const input: ConfirmationEmailInput = {
      reportDeadlineDateTime,
      aggregatedReports,
      managerUserId,
      teamId,
      analysisDate,
    };

    let thrownError: unknown;
    try {
      await generateAndSendConfirmationEmail(input, mockNotificationAdapter, mockTextAnalysisAdapter);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError).toMatchObject({
      code: 'INVALID_USER_ID',
      failedUserId: 'USER_011',
    });

    if (typeof thrownError === 'object' && thrownError !== null) {
      const errorMsg = (thrownError as Record<string, unknown>).message as string;
      expect(errorMsg).toMatch(/USER_011/);
    }

    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(mockNotificationAdapter.scheduleNotification).not.toHaveBeenCalled();
    expect(mockNotificationAdapter.getDeliveryStatus).not.toHaveBeenCalled();

    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});