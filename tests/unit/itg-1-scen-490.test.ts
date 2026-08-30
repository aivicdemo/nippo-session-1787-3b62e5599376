import { analyzeIssuePatternsByTimeRange } from '../../src/logic/issue-pattern-analysis';

describe('Issue Pattern Analysis - Bottleneck Visualization', () => {
  // SCEN-490: [edge] 指定された日付範囲内の過去課題データから再発パターンを時系列で分析し、ボトルネック変化を可視化レポートとして出力する。 - 課題データが空のとき、または30日間のデータが10件未満のときという明示された境界条件で分析対象データが不足しています。期間を延長してください
  test('should throw InsufficientDataError when issue data is empty within the specified date range', async () => {
    const startDate = new Date('2025-01-01T00:00:00Z');
    const endDate = new Date('2025-01-30T23:59:59Z');
    const periodGranularity = 'daily' as const;
    const teamId = null;

    await expect(
      analyzeIssuePatternsByTimeRange(startDate, endDate, periodGranularity, teamId)
    ).rejects.toThrow(/分析対象の課題データが見つかりません/);
  });
});