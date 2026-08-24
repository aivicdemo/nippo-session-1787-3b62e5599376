import { describe, test, expect } from '@jest/globals';
import { validateReportModificationWindow } from '../../src/logic/daily-report-management';
import type { ReportModificationRequest, ModificationWindowValidationResult } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 報告修正期限管理', () => {
  // SCEN-2725
  test('ユーザーIDが空文字のとき修正禁止エラーが発生する', () => {
    const reportId = 'report-001';
    const userId = '';
    const currentTimestamp = new Date('2024-01-15T09:45:00Z');
    const morningMeetingStartTime = new Date('2024-01-15T10:00:00Z');

    const request: ReportModificationRequest = {
      reportId,
      userId,
      currentTimestamp,
      morningMeetingStartTime,
    };

    expect(() => validateReportModificationWindow(request)).toThrow(/ユーザーID/);
  });
});