import { describe, test, expect } from '@jest/globals';
import { validateReportModificationWindow } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-2730: [error] 報告修正期限管理機能 - 部長確認メール送信時点の報告内容が null のとき修正禁止エラーが発生する
  test('報告内容がnullの場合、修正禁止エラーを返す', () => {
    const reportInput: ReportModificationRequest = {
      reportId: 'report-001',
      userId: 'user-manager-001',
      currentTimestamp: new Date('2024-01-15T08:45:00Z'),
      morningMeetingStartTime: new Date('2024-01-15T09:00:00Z'),
    };

    const validationResult = validateReportModificationWindow(reportInput);

    expect(validationResult.isModificationAllowed).toBe(false);
    expect(validationResult.remainingMinutes).toBeLessThan(0);
    expect(validationResult.reason).toMatch(/報告内容/);
  });
});

interface ReportModificationRequest {
  reportId: string;
  userId: string;
  currentTimestamp: Date;
  morningMeetingStartTime: Date;
}

interface ModificationWindowValidationResult {
  isModificationAllowed: boolean;
  remainingMinutes: number;
  modificationDeadline: Date;
  reason?: string;
}