import { initializeScheduler } from '../../src/logic/remind-notification-scheduler';
import { type SchedulerInitializationResult } from '../../src/logic/remind-notification-scheduler';

jest.mock('node-schedule');
jest.mock('bull');

describe('remind-notification-scheduler', () => {
  // SCEN-049
  test('should initialize scheduler with valid reminder notification schedule and register daily 7am job for 10 team members', () => {
    const scheduleConfig = [
      {
        scheduleId: 'SCHED-001',
        executionTime: '07:00',
        teamId: 'TEAM-001',
        targetUserCount: 10,
        isActive: true,
      },
    ];

    const result: SchedulerInitializationResult = initializeScheduler(scheduleConfig);

    expect(result.success).toBe(true);
    expect(result.registeredScheduleCount).toBe(1);
    expect(result.failedScheduleIds).toEqual([]);
    expect(result.nextExecutionTime).toBeDefined();
    expect(typeof result.nextExecutionTime).toBe('string');
    expect(result.nextExecutionTime).toMatch(/^\d{4}-\d{2}-\d{2}T07:00:00/);
  });
});