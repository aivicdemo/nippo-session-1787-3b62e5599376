import { describe, test, expect, beforeEach } from '@jest/globals';
import { fetchYesterdayReport } from '../../src/logic/report-submission';

describe('fetchYesterdayReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-2673
  test('should retrieve yesterday report content for logged-in engineer when report exists', async () => {
    const engineerId = 'engineer-a-123';
    const requestingUserId = 'engineer-a-123';
    const targetDate = new Date('2024-01-15');
    const yesterdayDate = new Date('2024-01-14');

    const mockReport = {
      reportId: 'report-001',
      engineerId: engineerId,
      reportDate: yesterdayDate,
      yesterdayAccomplishment: '機能X実装',
      todayPlan: 'テスト実施',
      challenges: 'パフォーマンス改善',
      submittedAt: new Date('2024-01-14T09:30:00Z'),
    };

    // Mock the database/repository layer
    jest.spyOn(global, 'fetch' as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockReport }),
    } as any);

    const result = await fetchYesterdayReport({
      engineerId: engineerId,
      targetDate: targetDate,
      requestingUserId: requestingUserId,
    });

    expect(result).toBeDefined();
    expect(result.reportId).toBe('report-001');
    expect(result.engineerId).toBe('engineer-a-123');
    expect(result.reportDate).toEqual(yesterdayDate);
    expect(result.yesterdayAccomplishment).toBe('機能X実装');
    expect(result.todayPlan).toBe('テスト実施');
    expect(result.challenges).toBe('パフォーマンス改善');
    expect(result.submittedAt).toEqual(new Date('2024-01-14T09:30:00Z'));
  });
});