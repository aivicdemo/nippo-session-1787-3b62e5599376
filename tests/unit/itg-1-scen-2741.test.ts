import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { generateAndSendConfirmationEmail } from '../../src/logic/notification-delivery';
import type { ConfirmationEmailInput, ConfirmationEmailOutput, AggregatedDailyReport } from '../../src/logic/notification-delivery';

describe('notification-delivery: generateAndSendConfirmationEmail', () => {
  // SCEN-2741: [edge] 部長確認メール確定処理 - 期限超過時に部長へのメール送信時点の内容が確定データとして記録される

  let mockNotificationServiceAdapter: any;
  let capturedSendCall: any;

  beforeEach(() => {
    capturedSendCall = null;
    mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (payload: any) => {
        capturedSendCall = payload;
        return {
          status: 'sent',
          deliveredAt: new Date('2024-01-15T09:31:00Z').toISOString(),
        };
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should record confirmation data at deadline exceeded time with all member reports', async () => {
    // Arrange: 部長メール送信時点（期限超過時刻 09:31 AM）での10名全員の報告内容を構成
    const reportDeadlineDateTime = new Date('2024-01-15T09:00:00Z');
    const emailSendDateTime = new Date('2024-01-15T09:31:00Z');
    const analysisDate = new Date('2024-01-15T00:00:00Z');
    const teamId = 'team-001';
    const managerUserId = 'manager-001';

    const aggregatedReports: AggregatedDailyReport[] = [
      {
        reportId: 'report-001',
        reporterUserId: 'engineer-001',
        reporterName: 'Engineer A',
        yesterdayAccomplishment: 'Completed feature X implementation',
        todayPlan: 'Testing feature X',
        challenges: 'Database optimization needed',
        submissionDateTime: new Date('2024-01-15T08:15:00Z'),
      },
      {
        reportId: 'report-002',
        reporterUserId: 'engineer-002',
        reporterName: 'Engineer B',
        yesterdayAccomplishment: 'Fixed bugs in module Y',
        todayPlan: 'Code review for pull requests',
        challenges: 'Team communication delays',
        submissionDateTime: new Date('2024-01-15T08:20:00Z'),
      },
      {
        reportId: 'report-003',
        reporterUserId: 'engineer-003',
        reporterName: 'Engineer C',
        yesterdayAccomplishment: 'Wrote unit tests for API',
        todayPlan: 'Integration testing',
        challenges: 'CI pipeline failures',
        submissionDateTime: new Date('2024-01-15T08:25:00Z'),
      },
      {
        reportId: 'report-004',
        reporterUserId: 'engineer-004',
        reporterName: 'Engineer D',
        yesterdayAccomplishment: 'Documented API endpoints',
        todayPlan: 'Performance monitoring setup',
        challenges: 'Memory leak in production',
        submissionDateTime: new Date('2024-01-15T08:30:00Z'),
      },
      {
        reportId: 'report-005',
        reporterUserId: 'engineer-005',
        reporterName: 'Engineer E',
        yesterdayAccomplishment: 'Reviewed architecture proposal',
        todayPlan: 'Stakeholder presentation',
        challenges: 'Vendor API changes',
        submissionDateTime: new Date('2024-01-15T08:35:00Z'),
      },
      {
        reportId: 'report-006',
        reporterUserId: 'engineer-006',
        reporterName: 'Engineer F',
        yesterdayAccomplishment: 'Deployed hotfix to production',
        todayPlan: 'Monitor deployment metrics',
        challenges: 'Database migration timing',
        submissionDateTime: new Date('2024-01-15T08:40:00Z'),
      },
      {
        reportId: 'report-007',
        reporterUserId: 'engineer-007',
        reporterName: 'Engineer G',
        yesterdayAccomplishment: 'Training for new team members',
        todayPlan: 'Onboarding completion',
        challenges: 'Knowledge transfer gaps',
        submissionDateTime: new Date('2024-01-15T08:45:00Z'),
      },
      {
        reportId: 'report-008',
        reporterUserId: 'engineer-008',
        reporterName: 'Engineer H',
        yesterdayAccomplishment: 'Client requirement gathering',
        todayPlan: 'Specification document finalization',
        challenges: 'Scope creep concerns',
        submissionDateTime: new Date('2024-01-15T08:50:00Z'),
      },
      {
        reportId: 'report-009',
        reporterUserId: 'engineer-009',
        reporterName: 'Engineer I',
        yesterdayAccomplishment: 'Security audit completed',
        todayPlan: 'Remediation plan execution',
        challenges: 'Compliance deadline pressure',
        submissionDateTime: new Date('2024-01-15T08:55:00Z'),
      },
      {
        reportId: 'report-010',
        reporterUserId: 'engineer-010',
        reporterName: 'Engineer J',
        yesterdayAccomplishment: 'Infrastructure scaling planned',
        todayPlan: 'Implementation execution',
        challenges: 'Cost optimization constraints',
        submissionDateTime: new Date('2024-01-15T09:00:00Z'),
      },
    ];

    const confirmationEmailInput: ConfirmationEmailInput = {
      reportDeadlineDateTime,
      aggregatedReports,
      managerUserId,
      teamId,
      analysisDate,
    };

    // Act: generateAndSendConfirmationEmail を呼び出し
    const result: ConfirmationEmailOutput = await generateAndSendConfirmationEmail(
      confirmationEmailInput,
      mockNotificationServiceAdapter
    );

    // Assert: 送信メールのペイロードが期限超過時点での10名全員の報告内容を含むことを確認
    expect(result).toBeDefined();
    expect(result.emailId).toBeDefined();
    expect(result.emailId).toMatch(/^email-/);

    // 送信完了日時が期限超過時以降であることを確認
    const sentTime = new Date(result.sentDateTime);
    expect(sentTime.getTime()).toBeGreaterThanOrEqual(reportDeadlineDateTime.getTime());

    // 全10名の報告データが送信ペイロードに含まれていることを確認
    expect(capturedSendCall).toBeDefined();
    expect(capturedSendCall.aggregatedReports).toBeDefined();
    expect(capturedSendCall.aggregatedReports).toHaveLength(10);

    // Engineer A の報告内容の確認
    const engineerAReport = capturedSendCall.aggregatedReports.find(
      (r: AggregatedDailyReport) => r.reporterUserId === 'engineer-001'
    );
    expect(engineerAReport).toBeDefined();
    expect(engineerAReport.yesterdayAccomplishment).toBe('Completed feature X implementation');
    expect(engineerAReport.todayPlan).toBe('Testing feature X');
    expect(engineerAReport.challenges).toBe('Database optimization needed');

    // Engineer J の報告内容の確認（最後の提出者）
    const engineerJReport = capturedSendCall.aggregatedReports.find(
      (r: AggregatedDailyReport) => r.reporterUserId === 'engineer-010'
    );
    expect(engineerJReport).toBeDefined();
    expect(engineerJReport.yesterdayAccomplishment).toBe('Infrastructure scaling planned');
    expect(engineerJReport.todayPlan).toBe('Implementation execution');
    expect(engineerJReport.challenges).toBe('Cost optimization constraints');

    // 確定データレコードのメタデータ確認
    expect(result.submissionStatus).toBeDefined();
    expect(result.submissionStatus.submittedCount).toBe(10);
    expect(result.submissionStatus.unsubmittedMembers).toHaveLength(0);

    // 抽出された課題の件数を確認（各報告の challenges から自動抽出される）
    expect(result.extractedIssuesCount).toBeGreaterThanOrEqual(10);

    // 優先度付き課題リストが生成されていることを確認
    expect(result.prioritizedIssuesList).toBeDefined();
    expect(result.prioritizedIssuesList.length).toBeGreaterThan(0);

    // 優先度付き課題リストが優先度スコア順に並んでいることを確認
    for (let i = 0; i < result.prioritizedIssuesList.length - 1; i++) {
      const currentScore = result.prioritizedIssuesList[i].priorityScore;
      const nextScore = result.prioritizedIssuesList[i + 1].priorityScore;
      expect(currentScore).toBeGreaterThanOrEqual(nextScore);
    }

    // NotificationServiceAdapter の sendReminderNotification が呼び出されたことを確認
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(1);

    // 送信先メールアドレスが manager ユーザー向けであることを確認
    expect(result.recipientEmail).toBeDefined();
    expect(result.recipientEmail).toContain('@');
  });
});