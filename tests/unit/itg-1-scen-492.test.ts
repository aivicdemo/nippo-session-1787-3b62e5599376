import { analyzeIssuePatternsByTimeRange } from '../../src/logic/issue-pattern-analysis';

describe('朝会報告管理システム - 課題パターン分析', () => {
  // SCEN-492: [error] 指定された日付範囲内の過去課題データから再発パターンを時系列で分析し、ボトルネック変化を可視化レポートとして出力する。 - レポート対象期間が指定されていないときという明示された境界条件でレポート対象期間を指定してください
  test('should throw error when reportPeriod is not specified', () => {
    const request = {
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-31T23:59:59Z'),
      periodGranularity: 'daily' as const,
      teamId: null,
    };

    expect(() => analyzeIssuePatternsByTimeRange(request, null)).toThrow(/レポート対象期間/);
  });
});