import { generateAndSendConfirmationEmail } from '../../src/logic/notification-delivery';
import { type ConfirmationEmailInput, type ConfirmationEmailOutput } from '../../src/logic/notification-delivery';

describe('generateAndSendConfirmationEmail', () => {
  // SCEN-442: [error] 朝会報告集約・課題抽出・優先度判定・確認メール自動生成配信機能 - 部長向け確認メール送信先アドレスが空のとき処理を中止しエラーを返す
  test('should throw ValidationError with RECIPIENT_EMAIL_EMPTY when manager email is empty', async () => {
    const input: ConfirmationEmailInput = {
      reportDeadlineDateTime: new Date('2024-01-15T09:00:00Z'),
      aggregatedReports: [
        {
          reportId: 'report_001',
          reporterUserId: 'user_001',
          reporterName: 'Engineer A',
          yesterdayAccomplishment: 'Completed API integration testing',
          todayPlan: 'Start database optimization',
          challenges: 'Database query performance needs improvement',
          submissionDateTime: new Date('2024-01-15T08:30:00Z'),
        },
        {
          reportId: 'report_002',
          reporterUserId: 'user_002',
          reporterName: 'Engineer B',
          yesterdayAccomplishment: 'Fixed UI bugs in dashboard',
          todayPlan: 'Implement new features for user profile',
          challenges: 'UI responsiveness issues on mobile devices',
          submissionDateTime: new Date('2024-01-15T08:45:00Z'),
        },
        {
          reportId: 'report_003',
          reporterUserId: 'user_003',
          reporterName: 'Engineer C',
          yesterdayAccomplishment: 'Reviewed pull requests from team',
          todayPlan: 'Conduct code review session',
          challenges: 'Need better documentation for new modules',
          submissionDateTime: new Date('2024-01-15T08:50:00Z'),
        },
        {
          reportId: 'report_004',
          reporterUserId: 'user_004',
          reporterName: 'Engineer D',
          yesterdayAccomplishment: 'Updated dependencies in main branch',
          todayPlan: 'Run regression tests',
          challenges: 'Some tests failing due to environment mismatch',
          submissionDateTime: new Date('2024-01-15T08:55:00Z'),
        },
        {
          reportId: 'report_005',
          reporterUserId: 'user_005',
          reporterName: 'Engineer E',
          yesterdayAccomplishment: 'Deployed hotfix to production',
          todayPlan: 'Monitor application metrics',
          challenges: 'Memory leak detected in background process',
          submissionDateTime: new Date('2024-01-15T09:00:00Z'),
        },
        {
          reportId: 'report_006',
          reporterUserId: 'user_006',
          reporterName: 'Engineer F',
          yesterdayAccomplishment: 'Created backup strategy document',
          todayPlan: 'Implement automated backup system',
          challenges: 'Need to coordinate with infrastructure team',
          submissionDateTime: new Date('2024-01-15T08:35:00Z'),
        },
        {
          reportId: 'report_007',
          reporterUserId: 'user_007',
          reporterName: 'Engineer G',
          yesterdayAccomplishment: 'Completed security audit for API endpoints',
          todayPlan: 'Fix identified security vulnerabilities',
          challenges: 'SQL injection vulnerability in search feature',
          submissionDateTime: new Date('2024-01-15T08:40:00Z'),
        },
        {
          reportId: 'report_008',
          reporterUserId: 'user_008',
          reporterName: 'Engineer H',
          yesterdayAccomplishment: 'Optimized database indexes',
          todayPlan: 'Test performance improvements',
          challenges: 'Query response time still above threshold',
          submissionDateTime: new Date('2024-01-15T08:55:00Z'),
        },
        {
          reportId: 'report_009',
          reporterUserId: 'user_009',
          reporterName: 'Engineer I',
          yesterdayAccomplishment: 'Wrote unit tests for core modules',
          todayPlan: 'Improve test coverage to 85 percent',
          challenges: 'Legacy code lacks proper test coverage',
          submissionDateTime: new Date('2024-01-15T08:50:00Z'),
        },
        {
          reportId: 'report_010',
          reporterUserId: 'user_010',
          reporterName: 'Engineer J',
          yesterdayAccomplishment: 'Set up CI CD pipeline',
          todayPlan: 'Configure automated deployment triggers',
          challenges: 'Pipeline occasionally fails on network timeout',
          submissionDateTime: new Date('2024-01-15T09:00:00Z'),
        },
      ],
      managerUserId: 'manager_001',
      teamId: 'team_001',
      analysisDate: new Date('2024-01-15T09:00:00Z'),
    };

    expect(() => generateAndSendConfirmationEmail(input, '')).toThrow(/RECIPIENT_EMAIL_EMPTY/);
  });
});