import { initializeScheduler } from '../../src/logic/remind-notification-scheduler';
import type { SchedulerInitializationResult } from '../../src/logic/remind-notification-scheduler';

describe('remind-notification-scheduler', () => {
  // SCEN-049
  test('should initialize scheduler with valid reminder notification schedule and register daily 7am job', () => {
    const validScheduleConfig = {
      schedules: [
        {
          scheduleId: 'schedule-001',
          cronExpression: '0 7 * * *',
          targetUserCount: 10,
          targetUsers: [
            { userId: 'user-001', email: 'user001@example.com' },
            { userId: 'user-002', email: 'user002@example.com' },
            { userId: 'user-003', email: 'user003@example.com' },
            { userId: 'user-004', email: 'user004@example.com' },
            { userId: 'user-005', email: 'user005@example.com' },
            { userId: 'user-006', email: 'user006@example.com' },
            { userId: 'user-007', email: 'user007@example.com' },
            { userId: 'user-008', email: 'user008@example.com' },
            { userId: 'user-009', email: 'user009@example.com' },
            { userId: 'user-010', email: 'user010@example.com' },
          ],
          isActive: true,
        },
      ],
    };

    const result: SchedulerInitializationResult = initializeScheduler(validScheduleConfig);

    expect(result.success).toBe(true);
    expect(result.registeredScheduleCount).toBe(1);
    expect(result.failedScheduleIds).toEqual([]);
    expect(result.nextExecutionTime).toBeDefined();
    expect(typeof result.nextExecutionTime).toBe('string');
  });
});