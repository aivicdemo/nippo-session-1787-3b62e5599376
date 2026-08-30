import { retrieveReportsByDateRange } from '../../src/logic/report-persistence';
import type { RetrievedReportDataset, ReportRecord, ReportDateRangeQuery } from '../../src/logic/report-persistence';

describe('Report Persistence - retrieveReportsByDateRange', () => {
  test('SCEN-150: should retrieve and return reports within specified date range with decrypted content', async () => {
    // Arrange
    const startDate = '2025-01-01';
    const endDate = '2025-01-31';
    const teamId = undefined;
    const reporterId = undefined;
    const statusFilter = undefined;
    const sortBy = undefined;

    const mockReportRecord1: ReportRecord = {
      reportId: 'report-001',
      reportDate: '2025-01-15',
      reporterId: 'engineer-001',
      teamId: 'team-alpha',
      yesterdayAccomplishment: 'Completed API integration testing',
      todayPlan: 'Deploy to staging environment',
      issuesAndConcerns: 'Database connection timeout issues',
      submissionTimestamp: '2025-01-15T09:30:00Z',
      status: 'submitted',
    };

    const mockReportRecord2: ReportRecord = {
      reportId: 'report-002',
      reportDate: '2025-01-20',
      reporterId: 'engineer-002',
      teamId: 'team-beta',
      yesterdayAccomplishment: 'Reviewed pull requests',
      todayPlan: 'Implement new feature module',
      issuesAndConcerns: 'Waiting for product requirements clarification',
      submissionTimestamp: '2025-01-20T08:45:00Z',
      status: 'submitted',
    };

    const mockReportRecord3: ReportRecord = {
      reportId: 'report-003',
      reportDate: '2025-01-25',
      reporterId: 'engineer-003',
      teamId: 'team-gamma',
      yesterdayAccomplishment: 'Fixed critical production bug',
      todayPlan: 'Write unit tests for bug fix',
      issuesAndConcerns: 'Resource shortage in QA team',
      submissionTimestamp: '2025-01-25T10:15:00Z',
      status: 'submitted',
    };

    const mockReports = [mockReportRecord1, mockReportRecord2, mockReportRecord3];
    const retrievalTimestampISO = '2025-01-31T15:00:00Z';

    // Mock the dependencies
    jest.spyOn(require('../../src/logic/report-persistence'), 'queryReportsByCondition')
      .mockResolvedValue(mockReports);
    
    jest.spyOn(require('../../src/logic/report-persistence'), 'retrieveDecryptedReportData')
      .mockImplementation((report: ReportRecord) => Promise.resolve(report));
    
    jest.spyOn(require('../../src/logic/report-persistence'), 'validateReportSubmission')
      .mockReturnValue(true);

    jest.spyOn(global, 'Date').mockImplementation(() => ({
      toISOString: () => retrievalTimestampISO,
    } as any));

    // Act
    const result: RetrievedReportDataset = await retrieveReportsByDateRange(
      startDate,
      endDate,
      teamId,
      reporterId,
      statusFilter,
      sortBy
    );

    // Assert
    expect(result).toBeDefined();
    expect(result.reports).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.retrievalTimestamp).toBe(retrievalTimestampISO);
    
    expect(result.reports[0].reportId).toBe('report-001');
    expect(result.reports[0].reporterId).toBe('engineer-001');
    expect(result.reports[0].teamId).toBe('team-alpha');
    expect(result.reports[0].yesterdayAccomplishment).toBe('Completed API integration testing');
    expect(result.reports[0].todayPlan).toBe('Deploy to staging environment');
    expect(result.reports[0].issuesAndConcerns).toBe('Database connection timeout issues');
    expect(result.reports[0].submissionTimestamp).toBe('2025-01-15T09:30:00Z');
    expect(result.reports[0].status).toBe('submitted');

    expect(result.reports[1].reportId).toBe('report-002');
    expect(result.reports[1].reporterId).toBe('engineer-002');
    expect(result.reports[1].teamId).toBe('team-beta');

    expect(result.reports[2].reportId).toBe('report-003');
    expect(result.reports[2].reporterId).toBe('engineer-003');
    expect(result.reports[2].teamId).toBe('team-gamma');

    const expectedQueryConditions: ReportDateRangeQuery = {
      startDate,
      endDate,
      teamId,
      reporterId,
      statusFilter,
      sortBy,
    };
    expect(result.queryConditions).toEqual(expectedQueryConditions);
  });
});