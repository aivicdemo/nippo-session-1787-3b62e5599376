import { updateDashboardOnReportSubmission } from '../../src/logic/real-time-dashboard-update';
import { type UpdateDashboardInput, type DashboardUpdateResult } from '../../src/logic/real-time-dashboard-update';

describe('Real-time Dashboard Update', () => {
  // SCEN-176
  test('should throw AccessDeniedError when viewer lacks dashboard access permission', () => {
    const updateDashboardInput: UpdateDashboardInput = {
      reportId: 'report-001',
      reportData: {
        yesterday: 'Completed API integration',
        today: 'Review pull requests',
        issues: 'Database connection timeout'
      },
      submittedByUserId: 'user-002',
      submissionTimestamp: new Date('2024-01-15T09:00:00Z'),
      viewerUserId: 'user-999'
    };

    expect(() => {
      updateDashboardOnReportSubmission(updateDashboardInput);
    }).toThrow(/権限/);
  });
});