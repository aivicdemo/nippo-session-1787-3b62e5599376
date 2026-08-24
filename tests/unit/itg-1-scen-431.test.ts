import { generateAndSendConfirmationEmail } from '../../src/logic/notification-delivery';
import type { ConfirmationEmailInput, ConfirmationEmailOutput, AggregatedDailyReport } from '../../src/logic/notification-delivery';

describe('generateAndSendConfirmationEmail', () => {
  // SCEN-431: [normal] 日報集約・課題抽出・優先度判定・確認メール生成配信機能 - 10名全員の日報から課題キーワードが0件抽出された場合、空の課題リストを確認メールに含める
  test('should generate confirmation email with empty issues list when no keywords extracted from all 10 members reports', async () => {
    const reportDeadlineDateTime = new Date('2024-01-15T09:00:00Z');
    const analysisDate = new Date('2024-01-15T00:00:00Z');
    const managerUserId = 'manager-001';
    const teamId = 'team-dev-001';

    const aggregatedReports: AggregatedDailyReport[] = [
      {
        reportId: 'report-001',
        reporterUserId: 'engineer-001',
        reporterName: 'Engineer One',
        yesterdayAccomplishment: 'Completed API endpoint implementation',
        todayPlan: 'Start unit testing for API',
        challenges: '',
        submissionDateTime: new Date('2024-01-15T08:30:00Z'),
      },
      {
        reportId: 'report-002',
        reporterUserId: 'engineer-002',
        reporterName: 'Engineer Two',
        yesterdayAccomplishment: 'Fixed database connection issue',
        todayPlan: 'Optimize query performance',
        challenges: '',
        submissionDateTime: new Date('2024-01-15T08:35:00Z'),
      },
      {
        reportId: 'report-003',
        reporterUserId: 'engineer-003',
        reporterName: 'Engineer Three',
        yesterdayAccomplishment: 'Reviewed code for feature branch',
        todayPlan: 'Merge feature branch to main',
        challenges: '',
        submissionDateTime: new Date('2024-01-15T08:40:00Z'),
      },
      {
        reportId: 'report-004',
        reporterUserId: 'engineer-004',
        reporterName: 'Engineer Four',
        yesterdayAccomplishment: 'Updated documentation for module',
        todayPlan: 'Create test cases for edge cases',
        challenges: '',
        submissionDateTime: new Date('2024-01-15T08:45:00Z'),
      },
      {
        reportId: 'report-005',
        reporterUserId: 'engineer-005',
        reporterName: 'Engineer Five',
        yesterdayAccomplishment: 'Deployed hotfix to production',
        todayPlan: 'Monitor system stability',
        challenges: '',
        submissionDateTime: new Date('2024-01-15T08:50:00Z'),
      },
      {
        reportId: 'report-006',
        reporterUserId: 'engineer-006',
        reporterName: 'Engineer Six',
        yesterdayAccomplishment: 'Analyzed user feedback from last sprint',
        todayPlan: 'Prepare presentation for stakeholders',
        challenges: '',
        submissionDateTime: new Date('2024-01-15T08:55:00Z'),
      },
      {
        reportId: 'report-007',
        reporterUserId: 'engineer-007',
        reporterName: 'Engineer Seven',
        yesterdayAccomplishment: 'Set up CI/CD pipeline',
        todayPlan: 'Configure monitoring and alerting',
        challenges: '',
        submissionDateTime: new Date('2024-01-15T09:00:00Z'),
      },
      {
        reportId: 'report-008',
        reporterUserId: 'engineer-008',
        reporterName: 'Engineer Eight',
        yesterdayAccomplishment: 'Investigated performance bottleneck',
        todayPlan: 'Implement caching layer',
        challenges: '',
        submissionDateTime: new Date('2024-01-15T08:32:00Z'),
      },
      {
        reportId: 'report-009',
        reporterUserId: 'engineer-009',
        reporterName: 'Engineer Nine',
        yesterdayAccomplishment: 'Wrote integration tests',
        todayPlan: 'Fix failing tests from build',
        challenges: '',
        submissionDateTime: new Date('2024-01-15T08:38:00Z'),
      },
      {
        reportId: 'report-010',
        reporterUserId: 'engineer-010',
        reporterName: 'Engineer Ten',
        yesterdayAccomplishment: 'Attended technical training session',
        todayPlan: 'Apply new techniques to current task',
        challenges: '',
        submissionDateTime: new Date('2024-01-15T08:43:00Z'),
      },
    ];

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([]),
      assessImpactScore: jest.fn().mockResolvedValue(0),
      classifyIssueSeverity: jest.fn().mockResolvedValue('low'),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        deliveryStatus: 'success',
        deliveredAt: new Date('2024-01-15T08:30:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'schedule-001',
        scheduledFor: new Date('2024-01-15T08:30:00Z'),
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
        deliveredAt: new Date('2024-01-15T08:30:00Z'),
      }),
    };

    const input: ConfirmationEmailInput = {
      reportDeadlineDateTime,
      aggregatedReports,
      managerUserId,
      teamId,
      analysisDate,
    };

    const output = await generateAndSendConfirmationEmail(input, {
      textAnalysisService: mockTextAnalysisAdapter,
      notificationService: mockNotificationAdapter,
    });

    expect(output).toBeDefined();
    expect(output.emailId).toBeTruthy();
    expect(typeof output.emailId).toBe('string');
    expect(output.sentDateTime).toEqual(expect.any(Date));
    expect(output.extractedIssuesCount).toBe(0);
    expect(Array.isArray(output.prioritizedIssuesList)).toBe(true);
    expect(output.prioritizedIssuesList.length).toBe(0);
    expect(output.submissionStatus).toBeDefined();
    expect(output.submissionStatus.submittedCount).toBe(10);
    expect(output.submissionStatus.unsubmittedMemberNames).toEqual([]);
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});