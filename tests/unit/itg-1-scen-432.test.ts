import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { generateAndSendConfirmationEmail } from '../../src/logic/notification-delivery';
import type { ConfirmationEmailInput, ConfirmationEmailOutput, AggregatedDailyReport } from '../../src/logic/notification-delivery';

const fetchMock = require('jest-fetch-mock');

describe('generateAndSendConfirmationEmail - 課題キーワード自動抽出・確認メール生成配信', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-432
  test('10名全員の日報から課題キーワードが1件抽出された場合、その課題を確認メールに含める', async () => {
    // Arrange: 10名のメンバーから提出された集約済み日報データを構築
    const aggregatedReports: AggregatedDailyReport[] = [
      {
        reportId: 'report-001',
        reporterUserId: 'user-001',
        reporterName: 'Engineer A',
        yesterdayAccomplishment: 'Feature X implementation completed',
        todayPlan: 'Unit testing for Feature X',
        challenges: 'Database connection timeout issue when handling large datasets',
        submissionDateTime: new Date('2024-01-15T08:30:00Z'),
      },
      {
        reportId: 'report-002',
        reporterUserId: 'user-002',
        reporterName: 'Engineer B',
        yesterdayAccomplishment: 'Code review for PRs',
        todayPlan: 'Integration testing setup',
        challenges: 'Database connection timeout issue when handling large datasets',
        submissionDateTime: new Date('2024-01-15T08:32:00Z'),
      },
      {
        reportId: 'report-003',
        reporterUserId: 'user-003',
        reporterName: 'Engineer C',
        yesterdayAccomplishment: 'Documentation update',
        todayPlan: 'API endpoint verification',
        challenges: 'Database connection timeout issue when handling large datasets',
        submissionDateTime: new Date('2024-01-15T08:31:00Z'),
      },
      {
        reportId: 'report-004',
        reporterUserId: 'user-004',
        reporterName: 'Engineer D',
        yesterdayAccomplishment: 'Bug fix in payment module',
        todayPlan: 'Payment gateway testing',
        challenges: 'Database connection timeout issue when handling large datasets',
        submissionDateTime: new Date('2024-01-15T08:33:00Z'),
      },
      {
        reportId: 'report-005',
        reporterUserId: 'user-005',
        reporterName: 'Engineer E',
        yesterdayAccomplishment: 'Performance optimization',
        todayPlan: 'Cache layer implementation',
        challenges: 'Database connection timeout issue when handling large datasets',
        submissionDateTime: new Date('2024-01-15T08:34:00Z'),
      },
      {
        reportId: 'report-006',
        reporterUserId: 'user-006',
        reporterName: 'Engineer F',
        yesterdayAccomplishment: 'Deployment to staging',
        todayPlan: 'Production readiness check',
        challenges: 'Database connection timeout issue when handling large datasets',
        submissionDateTime: new Date('2024-01-15T08:29:00Z'),
      },
      {
        reportId: 'report-007',
        reporterUserId: 'user-007',
        reporterName: 'Engineer G',
        yesterdayAccomplishment: 'Monitoring setup',
        todayPlan: 'Alert configuration',
        challenges: 'Database connection timeout issue when handling large datasets',
        submissionDateTime: new Date('2024-01-15T08:35:00Z'),
      },
      {
        reportId: 'report-008',
        reporterUserId: 'user-008',
        reporterName: 'Engineer H',
        yesterdayAccomplishment: 'Security audit',
        todayPlan: 'Vulnerability remediation',
        challenges: 'Database connection timeout issue when handling large datasets',
        submissionDateTime: new Date('2024-01-15T08:30:45Z'),
      },
      {
        reportId: 'report-009',
        reporterUserId: 'user-009',
        reporterName: 'Engineer I',
        yesterdayAccomplishment: 'Database schema migration',
        todayPlan: 'Data validation scripts',
        challenges: 'Database connection timeout issue when handling large datasets',
        submissionDateTime: new Date('2024-01-15T08:31:30Z'),
      },
      {
        reportId: 'report-010',
        reporterUserId: 'user-010',
        reporterName: 'Engineer J',
        yesterdayAccomplishment: 'Infrastructure provisioning',
        todayPlan: 'Network configuration',
        challenges: 'Database connection timeout issue when handling large datasets',
        submissionDateTime: new Date('2024-01-15T08:32:15Z'),
      },
    ];

    const reportDeadlineDateTime = new Date('2024-01-15T09:00:00Z');
    const managerUserId = 'manager-001';
    const teamId = 'team-001';
    const analysisDate = new Date('2024-01-15');

    const input: ConfirmationEmailInput = {
      reportDeadlineDateTime,
      aggregatedReports,
      managerUserId,
      teamId,
      analysisDate,
    };

    // Mock TextAnalysisServiceAdapter.extractKeywords to return 1 keyword
    const mockExtractKeywordsResponse = {
      keywords: [
        {
          keyword: 'Database connection timeout issue',
          frequency: 10,
          confidence: 0.95,
        },
      ],
    };

    // Mock TextAnalysisServiceAdapter.assessImpactScore to return impact score
    const mockAssessImpactScoreResponse = {
      impactScore: 78,
      severity: 'HIGH',
    };

    // Mock email sending endpoint
    fetchMock.mockResponseOnce(
      JSON.stringify({
        emailId: 'email-001',
        sentDateTime: '2024-01-15T09:05:00Z',
        recipientEmail: 'manager@example.com',
      }),
      { status: 200 }
    );

    // Act: generateAndSendConfirmationEmail を呼び出す
    const result: ConfirmationEmailOutput = await generateAndSendConfirmationEmail(input);

    // Assert: 期待値の検証
    // (1) 確認メールが正常に生成・送信されたこと
    expect(result.emailId).toBe('email-001');
    expect(result.sentDateTime).toEqual(new Date('2024-01-15T09:05:00Z'));

    // (2) 抽出された課題の件数が1件であること
    expect(result.extractedIssuesCount).toBe(1);

    // (3) 優先度付き課題リストが1件含まれること
    expect(result.prioritizedIssuesList).toHaveLength(1);
    expect(result.prioritizedIssuesList[0].issueName).toBe(
      'Database connection timeout issue'
    );
    expect(result.prioritizedIssuesList[0].impactScore).toBe(78);

    // (4) 提出状況サマリーが正確であること
    expect(result.submissionStatus.submittedCount).toBe(10);
    expect(result.submissionStatus.unsubmittedMemberNames).toHaveLength(0);
  });
});