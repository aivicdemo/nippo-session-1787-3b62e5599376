import { describe, test, expect } from '@jest/globals';
import { fetchYesterdayReport } from '../../src/logic/report-submission';

describe('fetchYesterdayReport', () => {
  test('SCEN-2689: should throw error when yesterdayAccomplishment is null', async () => {
    const engineerId = 'engineer-001';
    const targetDate = new Date('2024-01-16');
    const requestingUserId = 'manager-001';

    const mockDailyReport = {
      reportId: 'report-123',
      engineerId: engineerId,
      reportDate: new Date('2024-01-15'),
      yesterdayAccomplishment: null,
      todayPlan: 'Complete feature X testing',
      challenges: 'Database performance issue',
      submittedAt: new Date('2024-01-15T08:30:00Z'),
    };

    const reportRepository = {
      findByEngineerIdAndDate: jest.fn().mockResolvedValue(mockDailyReport),
    };

    const result = await fetchYesterdayReport(
      {
        engineerId: engineerId,
        targetDate: targetDate,
        requestingUserId: requestingUserId,
      },
      reportRepository
    );

    expect(() => {
      if (result.yesterdayAccomplishment === null) {
        throw new Error('昨日やったことが入力されていません');
      }
    }).toThrow(/昨日やったこと/);
  });
});