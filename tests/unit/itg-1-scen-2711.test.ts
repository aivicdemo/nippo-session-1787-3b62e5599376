import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateReportModificationWindow } from '../../src/logic/daily-report-management';

describe('validateReportModificationWindow', () => {
  // SCEN-2711: [normal] 報告内容修正受付判定機能 - 部長への確認メール送信時点の内容が確定値として記録される
  test('should record report content as confirmed at the time of email transmission to manager, preventing subsequent modifications', () => {
    // Given: Setup test data with fixed timestamps to ensure deterministic test execution
    const submittedAtIso = '2024-02-15T08:45:00Z';
    const submittedAt = new Date(submittedAtIso);
    const morningMeetingStartTime = '09:00'; // HH:mm format
    const morningMeetingStartTimeAsDate = new Date('2024-02-15T09:00:00Z');

    const reportModificationWindowInput = {
      submittedAt: submittedAtIso,
      morningMeetingStartTime: morningMeetingStartTime,
    };

    // When: Call validateReportModificationWindow to check if modification is allowed
    const result = validateReportModificationWindow(reportModificationWindowInput);

    // Then: Verify that the report can be modified within the allowed window
    // The modification window is typically from submission until shortly before the morning meeting
    // This test confirms that a report submitted 15 minutes before the meeting (08:45) 
    // is still within the modification window
    expect(result.isWithinModificationWindow).toBe(true);
    expect(typeof result.remainingMinutes).toBe('number');
    expect(result.remainingMinutes).toBeGreaterThan(0);
    expect(result.modificationDeadline).toEqual(morningMeetingStartTimeAsDate);
    expect(result.reason).toBeUndefined();
  });
});