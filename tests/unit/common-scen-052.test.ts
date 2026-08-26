import { initializeScheduler, type SchedulerInitializationResult } from '../../src/logic/remind-notification-scheduler';

describe('共通', () => {
  // SCEN-052
  test('スケジューラー初期化時にシステムエラーが発生した場合、エラーメッセージを返す', async () => {
    const mockSchedules = [
      {
        scheduleId: 'schedule-001',
        teamId: 'team-001',
        scheduledTime: '09:00',
        isActive: true,
      },
      {
        scheduleId: 'schedule-002',
        teamId: 'team-002',
        scheduledTime: '09:30',
        isActive: true,
      },
    ];

    const fetchMock = require('jest-fetch-mock');
    fetchMock.enableMocks();
    fetchMock.resetMocks();

    fetchMock.mockResponseOnce(JSON.stringify(mockSchedules), { status: 200 });

    fetchMock.mockResponseOnce(
      JSON.stringify({
        error: 'スケジューラーへのスケジュール登録に失敗しました。',
      }),
      { status: 500 }
    );

    const result: SchedulerInitializationResult = await initializeScheduler();

    expect(result.success).toBe(false);
    expect(result.registeredScheduleCount).toBe(0);
    expect(result.failedScheduleIds).toContain('schedule-001');
    expect(result.failedScheduleIds).toContain('schedule-002');
    expect(result.failedScheduleIds.length).toBe(2);
  });
});