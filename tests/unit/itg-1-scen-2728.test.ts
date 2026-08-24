import { describe, test, expect } from '@jest/globals';
import { validateReportModificationWindow } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  test('SCEN-2728: [error] 報告修正期限管理機能 - 修正内容に必須項目である実績内容が欠落しているとき修正禁止エラーが発生する', () => {
    const existingReport = {
      reportId: 'report-001',
      userId: 'user-001',
      teamId: 'team-001',
      reportDate: new Date('2024-01-15'),
      yesterdayAccomplishment: 'A機能の実装完了',
      todayPlan: 'B機能の設計',
      challenges: 'リソース不足',
      createdAt: new Date('2024-01-14T08:00:00Z'),
      updatedAt: new Date('2024-01-14T08:00:00Z'),
    };

    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    const currentTimestamp = new Date('2024-01-15T08:45:00Z');

    const modifiedContent = {
      yesterdayAccomplishment: '',
      todayPlan: 'C機能のレビュー',
      challenges: '納期短縮',
    };

    const result = validateReportModificationWindow(
      {
        reportId: existingReport.reportId,
        userId: existingReport.userId,
        currentTimestamp: currentTimestamp,
        morningMeetingStartTime: morningMeetingStartTime,
      },
      {
        sendReminderNotification: jest.fn().mockResolvedValue({ success: true }),
        scheduleNotification: jest.fn().mockResolvedValue({ success: true }),
        getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'sent' }),
      },
      {
        extractKeywords: jest.fn().mockResolvedValue([]),
        assessImpactScore: jest.fn().mockResolvedValue(0),
        classifyIssueSeverity: jest.fn().mockResolvedValue('low'),
      }
    );

    expect(result).toEqual({
      isModificationAllowed: false,
      remainingMinutes: expect.any(Number),
      modificationDeadline: expect.any(Date),
      reason: expect.stringMatching(/実績内容|必須項目/),
    });

    expect(result.reason).toMatch(/実績内容/);
  });
});