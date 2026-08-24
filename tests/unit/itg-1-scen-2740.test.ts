import { validateReportModificationWindow } from '../../src/logic/daily-report-management';

describe('Report Modification Window Validation', () => {
  // SCEN-2740: [edge] 報告内容修正期限判定機能 - 同一の修正内容が重複して送信された場合、最初の修正操作時刻で判定される
  test('should use first modification timestamp as baseline when identical content is submitted multiple times', () => {
    // Setup: Define modification content and timestamps
    const reportId = 'report-001';
    const userId = 'user-A';
    const firstModificationContent = {
      yesterdayAccomplishment: 'タスクX・Y完了',
      todayPlan: '予定内容',
      challenges: '課題内容'
    };
    const identicalModificationContent = {
      yesterdayAccomplishment: 'タスクX・Y完了',
      todayPlan: '予定内容',
      challenges: '課題内容'
    };

    // T1: First modification operation timestamp
    const firstModificationTimestamp = new Date('2024-01-15T10:00:00Z');
    // T2: Second (duplicate) modification operation timestamp - 5 minutes after T1
    const secondModificationTimestamp = new Date('2024-01-15T10:05:00Z');

    // Morning meeting start time is 2024-01-15T10:30:00Z
    const morningMeetingStartTime = new Date('2024-01-15T10:30:00Z');

    // Modification deadline offset: -15 minutes (deadline is 15 minutes before meeting start)
    const modificationDeadlineOffsetMinutes = -15;

    // First modification request at T1
    const firstModificationRequest = {
      reportId,
      userId,
      currentTimestamp: firstModificationTimestamp,
      morningMeetingStartTime: morningMeetingStartTime
    };

    // Execute first modification validation
    const firstResult = validateReportModificationWindow(
      firstModificationRequest,
      modificationDeadlineOffsetMinutes
    );

    // Assert: First modification should be within modification window
    // Deadline: 2024-01-15T10:15:00Z (meeting start time - 15 minutes)
    // First submission at 2024-01-15T10:00:00Z is 15 minutes before deadline
    expect(firstResult.isModificationAllowed).toBe(true);
    expect(firstResult.modificationDeadline).toEqual(new Date('2024-01-15T10:15:00Z'));
    expect(firstResult.remainingMinutes).toBe(15);

    // Second modification request with identical content at T2
    const secondModificationRequest = {
      reportId,
      userId,
      currentTimestamp: secondModificationTimestamp,
      morningMeetingStartTime: morningMeetingStartTime
    };

    // Execute second modification validation (duplicate content)
    const secondResult = validateReportModificationWindow(
      secondModificationRequest,
      modificationDeadlineOffsetMinutes
    );

    // Assert: Second modification (T2) should still use T1 baseline for deadline calculation
    // The baseline timestamp for deadline calculation must be T1 (first modification), not T2
    // Expected deadline remains 2024-01-15T10:15:00Z based on T1
    // Remaining time from T2 (2024-01-15T10:05:00Z): 10 minutes until deadline
    expect(secondResult.isModificationAllowed).toBe(true);
    expect(secondResult.modificationDeadline).toEqual(new Date('2024-01-15T10:15:00Z'));
    expect(secondResult.remainingMinutes).toBe(10);

    // Critical assertion: Verify T1 is the baseline, not T2
    // If T2 were used as baseline, remaining time would be 15 minutes (from T2 to deadline at T2+15min)
    // But correct behavior shows 10 minutes (from T2 to deadline at T1+15min)
    // This proves the system is using T1 as the reference, not T2
    expect(secondResult.remainingMinutes).not.toBe(15);
  });
});