import { describe, test, expect } from '@jest/globals';
import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';

describe('課題の時系列分析機能 - 分析対象期間の終了日が未指定のときエラー', () => {
  test('SCEN-1950: 分析対象期間の終了日を未指定のまま分析実行ボタンをクリックするとバリデーションエラーが発生する', () => {
    const analysisStartDate = new Date('2026-01-01T00:00:00Z');
    const analysisEndDate = undefined;
    const issueTimeSeriesData = [
      {
        issueId: 'ISSUE-001',
        recordDate: new Date('2026-01-05T00:00:00Z'),
        occurrenceCount: 2,
        impactScore: 45,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'open' as const,
      },
      {
        issueId: 'ISSUE-001',
        recordDate: new Date('2026-01-10T00:00:00Z'),
        occurrenceCount: 1,
        impactScore: 30,
        resolutionDaysElapsed: 5,
        resolutionStatus: 'in_progress' as const,
      },
    ];

    expect(() =>
      analyzeBottleneckTrendWithTimeSeries(
        analysisStartDate,
        analysisEndDate as any,
        issueTimeSeriesData
      )
    ).toThrow(/終了日/);
  });
});