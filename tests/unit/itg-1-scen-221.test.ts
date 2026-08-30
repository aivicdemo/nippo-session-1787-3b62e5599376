import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';

describe('朝会報告管理システム - 課題抽出と優先度ランク付け', () => {
  // SCEN-221
  test('課題キーワード辞書が空のとき、DataNormalizationFailureErrorをスロー', () => {
    const emptyKeywordDictionary: string[] = [];

    const reports = [
      {
        reportId: 'report-001',
        reportDate: new Date('2024-01-10T09:00:00Z'),
        issueText: 'バグが発生しました。テスト環境が不安定です。',
        teamId: 'team-001'
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2024-01-10T09:15:00Z'),
        issueText: 'ビルド失敗が続いています。リソース不足が課題です。',
        teamId: 'team-002'
      }
    ];

    const analysisStartDate = new Date('2023-12-11T00:00:00Z');
    const analysisEndDate = new Date('2024-01-10T23:59:59Z');
    const minimumConfidenceThreshold = 50;

    expect(() => {
      extractAndRankIssuesFromReports(
        reports,
        analysisStartDate,
        analysisEndDate,
        emptyKeywordDictionary,
        minimumConfidenceThreshold
      );
    }).toThrow(/課題データの正規化に失敗しました/);
  });
});