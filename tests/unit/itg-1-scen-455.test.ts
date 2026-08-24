import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { generateAndSendConfirmationEmail } from '../../src/logic/notification-delivery';
import type { ConfirmationEmailInput, ConfirmationEmailOutput } from '../../src/logic/notification-delivery';

describe('generateAndSendConfirmationEmail - null dashboard config error handling', () => {
  // SCEN-455: [error] 朝会報告集約・課題抽出・優先度判定・確認メール自動生成配信機能 - 部長向けダッシュボード表示設定がnullのとき処理を中止しエラーを返す
  test('should abort processing and return error when manager dashboard config is null', async () => {
    const reportDeadlineDateTime = new Date('2024-01-15T09:00:00Z');
    const analysisDate = new Date('2024-01-15T08:30:00Z');

    const aggregatedReportsInput: ConfirmationEmailInput['aggregatedReports'] = [
      {
        reportId: 'report-001',
        reporterUserId: 'user-eng-001',
        reporterName: 'Engineer A',
        yesterdayAccomplishment: 'Completed API endpoint implementation',
        todayPlan: 'Unit test implementation',
        challenges: 'Database connection timeout issues',
        submissionDateTime: new Date('2024-01-15T08:15:00Z'),
      },
      {
        reportId: 'report-002',
        reporterUserId: 'user-eng-002',
        reporterName: 'Engineer B',
        yesterdayAccomplishment: 'Fixed UI rendering bug',
        todayPlan: 'Integration testing',
        challenges: 'Database connection timeout issues, Memory leak in cache layer',
        submissionDateTime: new Date('2024-01-15T08:20:00Z'),
      },
    ];

    const inputData: ConfirmationEmailInput = {
      reportDeadlineDateTime,
      aggregatedReports: aggregatedReportsInput,
      managerUserId: 'user-manager-001',
      teamId: 'team-dev-001',
      analysisDate,
    };

    const mockDashboardConfigNull = null;

    const mockEmailServiceAdapter = {
      sendEmail: jest.fn().mockResolvedValue({
        emailId: 'email-001',
        sentDateTime: reportDeadlineDateTime,
      }),
      getDashboardConfig: jest.fn().mockResolvedValue(mockDashboardConfigNull),
    };

    expect(async () => {
      await generateAndSendConfirmationEmail(inputData, mockEmailServiceAdapter);
    }).rejects.toThrow(/ダッシュボード設定/);
  });
});