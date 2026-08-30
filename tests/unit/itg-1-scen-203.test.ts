import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { getSubmissionStatus } from '../../src/logic/report-submission-management';

describe('Report Submission Management - getSubmissionStatus', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  // SCEN-203: [edge] Deadline in past should warn and continue processing
  test('should warn when report deadline is in the past and return valid submission status', () => {
    const currentTime = new Date('2026-08-19T10:00:00Z');
    const deadlineTime = new Date('2026-08-19T09:00:00Z');
    
    const input = {
      teamId: 'team-001',
      reportDate: '2026-08-19',
      requesterId: 'user-manager-001',
      currentDateTime: currentTime,
      deadlineDateTime: deadlineTime,
    };

    const result = getSubmissionStatus(input);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('報告期限が既に過ぎています')
    );

    expect(result).toEqual({
      teamId: 'team-001',
      reportDate: '2026-08-19',
      submittedCount: 0,
      unsubmittedCount: 0,
      submittedMembers: [],
      unsubmittedMembers: [],
      aggregatedAt: expect.any(String),
    });

    expect(result.aggregatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});