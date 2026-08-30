import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';
import { type Report } from '../../src/logic/issue-extraction-and-ranking';

describe('朝会報告管理システム - 課題抽出と優先度ランク付け', () => {
  test('SCEN-410: チーム総人数が0以下のときに不正な設定エラーをスロー', () => {
    const reports: Report[] = [
      {
        reportId: 'report-001',
        reportDate: new Date('2024-01-15'),
        issueText: 'バグが発生しました',
        teamId: 'team-001'
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2024-01-14'),
        issueText: 'リソース不足が課題です',
        teamId: 'team-001'
      }
    ];

    const analysisStartDate = new Date('2023-12-16');
    const analysisEndDate = new Date('2024-01-15');
    const minimumConfidenceThreshold = 50;
    const invalidTeamSize = 0;

    expect(() => {
      extractAndRankIssuesFromReports({
        reports,
        analysisStartDate,
        analysisEndDate,
        minimumConfidenceThreshold,
        teamSize: invalidTeamSize
      });
    }).toThrow(/チーム人数/);
  });
});