import { extractAndRankIssuesFromReports, type ExtractAndRankIssuesInput, type Report } from '../../src/logic/issue-extraction-and-ranking';

describe('朝会報告管理システム - 課題抽出と優先度ランク付け', () => {
  // SCEN-229: 最小閾値が負の数のときという明示された境界条件で最小閾値は1以上である必要があります。1に修正します
  test('should throw validation error when minimumConfidenceThreshold is negative', () => {
    const reports: Report[] = [
      {
        reportId: 'report-001',
        reportDate: new Date('2026-08-15'),
        issueText: 'バグが発生しました。修正が必要です。',
        teamId: 'team-001',
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2026-08-16'),
        issueText: 'デプロイが遅延しています。対応が急務です。',
        teamId: 'team-002',
      },
      {
        reportId: 'report-003',
        reportDate: new Date('2026-08-17'),
        issueText: 'リソース不足のため、スケジュール調整が必要です。',
        teamId: 'team-001',
      },
    ];

    const input: ExtractAndRankIssuesInput = {
      reports,
      analysisStartDate: new Date('2026-08-01'),
      analysisEndDate: new Date('2026-08-31'),
      minimumConfidenceThreshold: -10,
    };

    expect(() => extractAndRankIssuesFromReports(input)).toThrow(/最小閾値/);
  });
});