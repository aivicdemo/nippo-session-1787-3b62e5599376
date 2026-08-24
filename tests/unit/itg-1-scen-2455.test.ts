import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  let fixedNow: Date;

  beforeEach(() => {
    fixedNow = new Date('2026-08-19T10:00:00Z');
    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // SCEN-2455
  test('分析結果確定日時が未来日時のとき監査ログ記録が失敗する', () => {
    const reportId = 'report-2026-08-001';
    const approvalStatus = 'approved' as const;
    const approverUserId = 'user-department-head-001';
    const futureConfirmationDateTime = new Date('2026-08-20T10:00:00Z');

    const input = {
      reportId,
      approvalStatus,
      approverUserId,
      confirmationDateTime: futureConfirmationDateTime,
    };

    expect(() => validateMonthlyReportApproval(input)).toThrow(/確定日時/);
  });
});