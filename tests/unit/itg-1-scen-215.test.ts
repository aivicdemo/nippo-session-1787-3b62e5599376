import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type { GenerateAndSendSummaryEmailInput, GenerateAndSendSummaryEmailOutput } from '../../src/logic/notification-delivery';

describe('generateAndSendSummaryEmail - Manager email null error handling', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let alertNotificationSpy: jest.SpyInstance;
  let internalQueueSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    alertNotificationSpy = jest.fn();
    internalQueueSpy = jest.fn();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // SCEN-215
  test('should fail gracefully when manager email address is null and persist data to internal queue', async () => {
    const input: GenerateAndSendSummaryEmailInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      managerUserId: 'manager-user-001',
      submittedReports: [
        {
          reporterId: 'user-001',
          reporterName: 'Engineer A',
          submittedAt: '2024-01-15T08:30:00Z',
          challenges: ['Database query performance issue', 'API integration delay'],
        },
        {
          reporterId: 'user-002',
          reporterName: 'Engineer B',
          submittedAt: '2024-01-15T08:35:00Z',
          challenges: ['Test coverage gaps'],
        },
        {
          reporterId: 'user-003',
          reporterName: 'Engineer C',
          submittedAt: '2024-01-15T08:40:00Z',
          challenges: ['Deployment pipeline timeout'],
        },
        {
          reporterId: 'user-004',
          reporterName: 'Engineer D',
          submittedAt: '2024-01-15T08:45:00Z',
          challenges: ['Memory leak in worker process'],
        },
        {
          reporterId: 'user-005',
          reporterName: 'Engineer E',
          submittedAt: '2024-01-15T08:50:00Z',
          challenges: ['Concurrent request handling'],
        },
        {
          reporterId: 'user-006',
          reporterName: 'Engineer F',
          submittedAt: '2024-01-15T08:55:00Z',
          challenges: ['SSL certificate renewal'],
        },
        {
          reporterId: 'user-007',
          reporterName: 'Engineer G',
          submittedAt: '2024-01-15T09:00:00Z',
          challenges: ['Network latency issue'],
        },
        {
          reporterId: 'user-008',
          reporterName: 'Engineer H',
          submittedAt: '2024-01-15T09:05:00Z',
          challenges: ['Docker image build failure'],
        },
        {
          reporterId: 'user-009',
          reporterName: 'Engineer I',
          submittedAt: '2024-01-15T09:10:00Z',
          challenges: ['Kubernetes pod restart loop'],
        },
        {
          reporterId: 'user-010',
          reporterName: 'Engineer J',
          submittedAt: '2024-01-15T09:15:00Z',
          challenges: ['Monitoring alert configuration'],
        },
      ],
      unsubmittedMemberIds: [],
      reportDeadlineTime: '09:00',
    };

    const mockEmailService = {
      send: jest.fn().mockRejectedValue(new Error('Manager email is null')),
      getManagerEmail: jest.fn().mockResolvedValue(null),
      logError: jest.fn(),
      sendAdminAlert: jest.fn(),
      persistToQueue: jest.fn(),
    };

    const mockNotificationService = {
      notifyAdministrator: jest.fn(),
    };

    try {
      await generateAndSendSummaryEmail(input, {
        emailService: mockEmailService,
        notificationService: mockNotificationService,
      });
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.message).toMatch(/メールアドレス/);
      expect(error.message).toMatch(/null/);
      expect(mockEmailService.send).not.toHaveBeenCalled();
      expect(mockEmailService.logError).toHaveBeenCalledWith(
        expect.stringContaining('部長のメールアドレスが null のため日報集約メール送信に失敗しました')
      );
      expect(mockNotificationService.notifyAdministrator).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'high',
          message: expect.stringContaining('日報集約メール送信'),
          teamId: 'team-001',
          reportDate: '2024-01-15',
        })
      );
      expect(mockEmailService.persistToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          teamId: 'team-001',
          reportDate: '2024-01-15',
          submittedReportsCount: 10,
          unsubmittedMembersCount: 0,
          status: 'pending_retry',
        })
      );
    }
  });
});