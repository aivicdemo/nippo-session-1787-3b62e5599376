import { describe, test, expect } from '@jest/globals';
import { validateReportModificationWindow } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-2731: [error] 報告修正期限管理機能 - 部長メールアドレスが null のとき修正禁止エラーが発生する
  test('should throw error when manager email is null during report modification window validation', () => {
    const reportModificationRequest = {
      reportId: 'report-001',
      userId: 'user-employee-001',
      currentTimestamp: new Date('2024-01-15T08:45:00Z'),
      morningMeetingStartTime: new Date('2024-01-15T09:00:00Z'),
    };

    const morningMeetingStartTime = '09:00';
    const managerEmail = null;

    expect(() => {
      validateReportModificationWindow(
        reportModificationRequest,
        morningMeetingStartTime,
        managerEmail
      );
    }).toThrow(/部長メールアドレス/);
  });
});