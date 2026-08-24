import { describe, test, expect } from '@jest/globals';
import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1953
  test('[error] 課題の時系列分析機能 - 分析対象課題データセットが空のときエラーになる', () => {
    const analysisStartDate = new Date('2024-01-01T00:00:00Z');
    const analysisEndDate = new Date('2024-01-31T23:59:59Z');
    const emptyIssueTimeSeriesData: never[] = [];

    expect(() => {
      analyzeBottleneckTrendWithTimeSeries({
        analysisStartDate,
        analysisEndDate,
        issueTimeSeriesData: emptyIssueTimeSeriesData,
      });
    }).toThrow(/分析対象課題データセットが空/);
  });
});