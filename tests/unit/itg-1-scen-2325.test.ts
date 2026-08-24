import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';
import type { MonthlyReportDataset, ExtractionValidationResult } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - extractMonthlyReportData', () => {
  // SCEN-2325: [error] 課題解決速度分析機能 - 課題解決にかかった日数が計算できない日報が含まれるとき処理を中止しエラーを返す
  test('should return error when report contains uncomputable resolution days', async () => {
    const invalidReportWithMissingStartDate = {
      reportId: 'report-001-invalid',
      teamId: 'team-dev-001',
      reportDate: new Date('2024-01-15T09:00:00Z'),
      submittedAt: new Date('2024-01-15T08:30:00Z'),
      yesterdayAccomplishments: 'Completed API implementation',
      todayPlans: 'Start integration testing',
      challenges: 'Database query performance issue',
      issueStartDate: null,
      issueResolvedDate: new Date('2024-01-15T17:00:00Z'),
    };

    const invalidReportWithMissingEndDate = {
      reportId: 'report-002-invalid',
      teamId: 'team-dev-001',
      reportDate: new Date('2024-01-15T09:00:00Z'),
      submittedAt: new Date('2024-01-15T08:30:00Z'),
      yesterdayAccomplishments: 'Code review completed',
      todayPlans: 'Deploy to staging',
      challenges: 'Deployment pipeline issue',
      issueStartDate: new Date('2024-01-10T10:00:00Z'),
      issueResolvedDate: null,
    };

    const validReportForComparison = {
      reportId: 'report-003-valid',
      teamId: 'team-dev-001',
      reportDate: new Date('2024-01-15T09:00:00Z'),
      submittedAt: new Date('2024-01-15T08:30:00Z'),
      yesterdayAccomplishments: 'Unit tests passed',
      todayPlans: 'Merge to main branch',
      challenges: 'Merge conflict resolved',
      issueStartDate: new Date('2024-01-12T10:00:00Z'),
      issueResolvedDate: new Date('2024-01-15T14:00:00Z'),
    };

    const mockReportDataset = [
      invalidReportWithMissingStartDate,
      invalidReportWithMissingEndDate,
      validReportForComparison,
    ];

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['database', 'performance', 'deployment'],
        frequencies: [3, 2, 1],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const requestInput = {
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: 'user-pm-001',
      teamIdFilter: ['team-dev-001'],
    };

    let errorThrown: Error | null = null;

    try {
      await extractMonthlyReportData(
        requestInput,
        mockReportDataset,
        mockTextAnalysisAdapter
      );
    } catch (error) {
      errorThrown = error as Error;
    }

    expect(errorThrown).not.toBeNull();
    expect(errorThrown?.message).toMatch(/RESOLUTION_DAYS_CALCULATION_ERROR/);
    expect(errorThrown?.message).toMatch(/課題解決日数が計算できない日報が含まれています/);
    expect(errorThrown?.message).toMatch(/report-001-invalid|report-002-invalid/);
  });
});