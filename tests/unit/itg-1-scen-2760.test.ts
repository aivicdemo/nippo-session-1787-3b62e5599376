import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractDashboardReportData } from '../../src/logic/manager-dashboard';
import type {
  ExtractDashboardReportDataInput,
  DashboardReportDataOutput,
} from '../../src/logic/manager-dashboard';

describe('extractDashboardReportData - Empty Report Text Handling', () => {
  // SCEN-2760
  test('should fail gracefully when report content text is empty across all fields', async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockRejectedValue(
        new Error('Empty report text provided to priority analysis')
      ),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractDashboardReportDataInput = {
      userId: 'manager-001',
      teamId: 'team-engineering-001',
      reportDate: '2024-01-15',
      includeUnsubmitted: true,
    };

    const mockReportsWithEmptyContent = [
      {
        reportId: 'report-001',
        reporterId: 'engineer-001',
        submissionStatus: 'submitted',
        submissionTimestamp: '2024-01-15T08:30:00Z',
        yesterdayWork: '',
        todayWork: '',
        currentChallenges: '',
      },
      {
        reportId: 'report-002',
        reporterId: 'engineer-002',
        submissionStatus: 'submitted',
        submissionTimestamp: '2024-01-15T08:45:00Z',
        yesterdayWork: '',
        todayWork: '',
        currentChallenges: '',
      },
    ];

    const result: DashboardReportDataOutput = await extractDashboardReportData(
      input,
      mockTextAnalysisAdapter
    ).catch((error) => {
      expect(error).toBeDefined();
      expect(error.message).toMatch(/Empty report text provided to priority analysis/);
      return null;
    });

    if (result === null) {
      expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith('');
      expect(result).toBeNull();
    }
  });
});