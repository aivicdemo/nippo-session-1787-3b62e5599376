import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Tracking - Real-time Display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-3042
  it('should throw error when businessDayFlag is null and scheduled time calculation fails', async () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'team-dev-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true,
    };

    const mockBusinessDayService = {
      getBusinessDayFlag: jest.fn().mockReturnValue(null),
    };

    const mockSystemTime = new Date('2024-01-15T08:30:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockSystemTime as any);

    expect(() => {
      aggregateReportSubmissionStatus(
        input,
        mockBusinessDayService,
      );
    }).toThrow(/営業日フラグ|businessDay|null.*定時/i);
  });
});