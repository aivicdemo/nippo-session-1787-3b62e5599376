import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { generateAndSendConfirmationEmail } from '../../src/logic/notification-delivery';
import type { ConfirmationEmailInput } from '../../src/logic/notification-delivery';

describe('generateAndSendConfirmationEmail', () => {
  let mockSendEmail: jest.Mock;
  let mockLogAdminEvent: jest.Mock;

  beforeEach(() => {
    mockSendEmail = jest.fn().mockResolvedValue({ success: true });
    mockLogAdminEvent = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-443
  test('should return email format error and reject confirmation when manager email address is invalid format', async () => {
    const invalidManagerEmail = 'tanaka@example';
    const analysisDate = new Date('2024-01-15T09:00:00Z');
    const reportDeadlineDateTime = new Date('2024-01-15T09:30:00Z');

    const aggregatedReports = [
      {
        reportId: 'report-001',
        reporterUserId: 'eng-001',
        reporterName: 'Engineer A',
        yesterdayAccomplishment: 'Completed feature X development',
        todayPlan: 'Review and merge pull request',
        challenges: 'Database performance issue on production server',
        submissionDateTime: new Date('2024-01-15T08:45:00Z'),
      },
      {
        reportId: 'report-002',
        reporterUserId: 'eng-002',
        reporterName: 'Engineer B',
        yesterdayAccomplishment: 'Fixed bug in login module',
        todayPlan: 'Write unit tests for authentication',
        challenges: 'Intermittent connection failures in staging',
        submissionDateTime: new Date('2024-01-15T08:50:00Z'),
      },
      {
        reportId: 'report-003',
        reporterUserId: 'eng-003',
        reporterName: 'Engineer C',
        yesterdayAccomplishment: 'Refactored API endpoint',
        todayPlan: 'Deploy to production',
        challenges: 'Database performance issue on production server',
        submissionDateTime: new Date('2024-01-15T08:48:00Z'),
      },
      {
        reportId: 'report-004',
        reporterUserId: 'eng-004',
        reporterName: 'Engineer D',
        yesterdayAccomplishment: 'Documented API specification',
        todayPlan: 'Setup CI/CD pipeline',
        challenges: 'Missing deployment credentials',
        submissionDateTime: new Date('2024-01-15T08:52:00Z'),
      },
      {
        reportId: 'report-005',
        reporterUserId: 'eng-005',
        reporterName: 'Engineer E',
        yesterdayAccomplishment: 'Code review for team members',
        todayPlan: 'Prepare architecture design document',
        challenges: 'Database performance issue on production server',
        submissionDateTime: new Date('2024-01-15T08:47:00Z'),
      },
      {
        reportId: 'report-006',
        reporterUserId: 'eng-006',
        reporterName: 'Engineer F',
        yesterdayAccomplishment: 'Investigated performance regression',
        todayPlan: 'Implement caching strategy',
        challenges: 'Unclear requirements from product owner',
        submissionDateTime: new Date('2024-01-15T08:49:00Z'),
      },
      {
        reportId: 'report-007',
        reporterUserId: 'eng-007',
        reporterName: 'Engineer G',
        yesterdayAccomplishment: 'Created database migration script',
        todayPlan: 'Test rollback procedure',
        challenges: 'Database performance issue on production server',
        submissionDateTime: new Date('2024-01-15T08:51:00Z'),
      },
      {
        reportId: 'report-008',
        reporterUserId: 'eng-008',
        reporterName: 'Engineer H',
        yesterdayAccomplishment: 'Updated dependencies in package.json',
        todayPlan: 'Run regression tests',
        challenges: 'Version conflicts in npm packages',
        submissionDateTime: new Date('2024-01-15T08:46:00Z'),
      },
      {
        reportId: 'report-009',
        reporterUserId: 'eng-009',
        reporterName: 'Engineer I',
        yesterdayAccomplishment: 'Fixed security vulnerability',
        todayPlan: 'Deploy security patch',
        challenges: 'Coordinate with security team on timeline',
        submissionDateTime: new Date('2024-01-15T08:53:00Z'),
      },
      {
        reportId: 'report-010',
        reporterUserId: 'eng-010',
        reporterName: 'Engineer J',
        yesterdayAccomplishment: 'Participated in technical discussion',
        todayPlan: 'Implement agreed-upon solution',
        challenges: 'Database performance issue on production server',
        submissionDateTime: new Date('2024-01-15T08:44:00Z'),
      },
    ];

    const input: ConfirmationEmailInput = {
      reportDeadlineDateTime,
      aggregatedReports,
      managerUserId: 'mgr-001',
      teamId: 'team-dev',
      analysisDate,
    };

    const result = await generateAndSendConfirmationEmail(input, {
      sendEmail: mockSendEmail,
      logAdminEvent: mockLogAdminEvent,
      getManagerEmailAddress: jest
        .fn()
        .mockResolvedValue(invalidManagerEmail),
    });

    expect(result).toEqual({
      code: 'INVALID_EMAIL_FORMAT',
      message:
        '部長向け送信先メールアドレスが不正な形式です',
      invalidAddress: 'tanaka@example',
    });

    expect(mockSendEmail).not.toHaveBeenCalled();

    expect(mockLogAdminEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: '部長メールアドレスバリデーション失敗',
        managerUserId: 'mgr-001',
        invalidEmail: 'tanaka@example',
      })
    );
  });
});