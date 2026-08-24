import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type {
  GenerateAndSendSummaryEmailInput,
  GenerateAndSendSummaryEmailOutput,
  SubmittedReportSummary,
} from '../../src/logic/notification-delivery';

describe('generateAndSendSummaryEmail with invalid email address', () => {
  // SCEN-214
  test('should stop processing and throw error when a team member has empty email address', async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockRejectedValue(
        new Error('Invalid email address: empty string')
      ),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const submittedReports: SubmittedReportSummary[] = [
      {
        reporterId: 'user-001',
        reporterName: 'Engineer A',
        submittedAt: '2024-01-15T09:05:00Z',
        challenges: ['Technical debt in authentication module'],
      },
      {
        reporterId: 'user-002',
        reporterName: 'Engineer B',
        submittedAt: '2024-01-15T09:08:00Z',
        challenges: ['Database connection timeout'],
      },
      {
        reporterId: 'user-003',
        reporterName: 'Engineer C',
        submittedAt: '2024-01-15T09:10:00Z',
        challenges: ['API response delay'],
      },
      {
        reporterId: 'user-004',
        reporterName: 'Engineer D',
        submittedAt: '2024-01-15T09:12:00Z',
        challenges: ['Deployment failure'],
      },
      {
        reporterId: 'user-005',
        reporterName: 'Engineer E',
        submittedAt: '2024-01-15T09:15:00Z',
        challenges: ['Unit test failure'],
      },
      {
        reporterId: 'user-006',
        reporterName: 'Engineer F',
        submittedAt: '2024-01-15T09:18:00Z',
        challenges: ['Code review comments'],
      },
      {
        reporterId: 'user-007',
        reporterName: 'Engineer G',
        submittedAt: '2024-01-15T09:20:00Z',
        challenges: ['Memory leak detected'],
      },
      {
        reporterId: 'user-008',
        reporterName: 'Engineer H',
        submittedAt: '2024-01-15T09:22:00Z',
        challenges: ['Security vulnerability'],
      },
      {
        reporterId: 'user-009',
        reporterName: 'Engineer I',
        submittedAt: '2024-01-15T09:25:00Z',
        challenges: ['Performance regression'],
      },
      {
        reporterId: 'user-010',
        reporterName: 'Engineer J',
        submittedAt: '2024-01-15T09:28:00Z',
        challenges: ['Documentation incomplete'],
      },
    ];

    const input: GenerateAndSendSummaryEmailInput = {
      teamId: 'team-dev-001',
      reportDate: '2024-01-15',
      managerUserId: 'manager-001',
      submittedReports: submittedReports,
      unsubmittedMemberIds: [],
      reportDeadlineTime: '09:00',
    };

    await expect(
      generateAndSendSummaryEmail(input, mockNotificationServiceAdapter)
    ).rejects.toThrow(/Invalid email address/);

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();
  });
});