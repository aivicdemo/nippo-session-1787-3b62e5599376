import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateReportModificationWindow } from '../../src/logic/daily-report-management';

describe('Report Modification Window Validation - Year Boundary', () => {
  let originalDateNow: () => number;

  beforeEach(() => {
    originalDateNow = Date.now;
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  // SCEN-2738
  test('should correctly judge modification window at year boundary (12/31 23:59:59 to 1/1 00:00:00)', () => {
    const submittedAt = '2024-12-31T23:58:00Z';
    const morningMeetingStartTime = '2024-12-31T23:59:00Z';

    const modificationWindowConfigInMinutes = 1;

    Date.now = jest.fn(() =>
      new Date('2024-12-31T23:59:59Z').getTime()
    );

    const resultBeforeYearBoundary = validateReportModificationWindow({
      submittedAt,
      morningMeetingStartTime: morningMeetingStartTime.substring(11, 16),
    });

    expect(resultBeforeYearBoundary.isWithinModificationWindow).toBe(true);
    expect(resultBeforeYearBoundary.remainingMinutes).toBe(1);

    Date.now = jest.fn(() =>
      new Date('2025-01-01T00:00:00Z').getTime()
    );

    const resultAfterYearBoundary = validateReportModificationWindow({
      submittedAt,
      morningMeetingStartTime: morningMeetingStartTime.substring(11, 16),
    });

    expect(resultAfterYearBoundary.isWithinModificationWindow).toBe(false);
    expect(resultAfterYearBoundary.remainingMinutes).toBeLessThan(0);
  });
});