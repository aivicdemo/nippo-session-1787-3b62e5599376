import { getDeadlineInfo, type DeadlineInfoRequest, type DeadlineInfoResponse } from '../../src/logic/report-deadline-management';

describe('report-deadline-management', () => {
  // SCEN-031
  test('should return exceeded status when current time is after deadline', () => {
    const deadlineTime = new Date('2024-01-15T09:00:00Z');
    const currentTime = new Date('2024-01-15T09:30:00Z');

    const request: DeadlineInfoRequest = {
      teamId: 'team-001',
      reportType: 'morning-report',
      requestedAt: currentTime,
    };

    const response = getDeadlineInfo(request, deadlineTime);

    expect(response.status).toBe('exceeded');
    expect(response.message).toBe('報告期限を超過しています');
    expect(response.remainingMinutes).toBe(-30);
  });
});