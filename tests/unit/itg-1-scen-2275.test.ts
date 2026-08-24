import { describe, test, expect } from '@jest/globals';
import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';

describe('メンバー別生産性スコア計算機能', () => {
  // SCEN-2275
  test('対象期間に報告したメンバーが0名の場合、生産性スコアリストは空配列で返される', () => {
    const aggregationStartDate = new Date('2026-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2026-01-31T23:59:59Z');
    const teamIds = ['team-001', 'team-002'];
    const reportDataset = [];

    const result = calculateTeamPerformanceMetrics({
      aggregationStartDate,
      aggregationEndDate,
      teamIds,
      reportDataset,
    });

    expect(result.teamMetrics).toEqual([]);
    expect(Array.isArray(result.teamMetrics)).toBe(true);
    expect(result.teamMetrics.length).toBe(0);
  });
});