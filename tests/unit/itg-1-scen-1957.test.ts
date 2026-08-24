import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';
import { type BottleneckAnalysisInput, type IssueTimeSeriesRecord } from '../../src/logic/monthly-performance-analysis';

describe('課題の時系列分析機能', () => {
  // SCEN-1957
  test('指定期間が現在日時より未来の日付のときエラーになる', () => {
    const now = new Date('2024-01-15T10:00:00Z');
    const futureStart = new Date('2024-02-14T00:00:00Z'); // 30日後
    const futureEnd = new Date('2024-03-15T23:59:59Z'); // 60日後

    const timeSeriesData: IssueTimeSeriesRecord[] = [
      {
        issueId: 'issue-001',
        recordDate: new Date('2024-01-10T00:00:00Z'),
        occurrenceCount: 2,
        impactScore: 75,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'resolved',
      },
    ];

    const input: BottleneckAnalysisInput = {
      analysisStartDate: futureStart,
      analysisEndDate: futureEnd,
      issueTimeSeriesData: timeSeriesData,
      minimumDataPointsThreshold: 7,
      outlierDetectionEnabled: true,
    };

    expect(() => analyzeBottleneckTrendWithTimeSeries(input, now)).toThrow(/未来/);
  });
});