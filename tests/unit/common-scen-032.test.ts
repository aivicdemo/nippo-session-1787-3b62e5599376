import { getDeadlineInfo } from '../../src/logic/report-deadline-management';

describe('report-deadline-management', () => {
  // SCEN-032
  test('should throw error when user lacks permission to view deadline information', () => {
    const input = {
      teamId: 'team-001',
      reportType: 'morning-report',
      requestedAt: new Date('2024-01-15T09:00:00Z'),
    };

    const unauthorizedUserId = 'user-without-permission';

    expect(() => getDeadlineInfo(input, unauthorizedUserId)).toThrow(/参照権限/);
  });
});