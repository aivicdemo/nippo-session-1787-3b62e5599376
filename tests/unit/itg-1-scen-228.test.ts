import { extractAndRankIssuesFromReports } from '../../src/logic/issue-extraction-and-ranking';
import { type Report, type RankedIssueList } from '../../src/logic/issue-extraction-and-ranking';

describe('朝会報告管理システム - 課題抽出・優先度付け', () => {
  // SCEN-228
  test('キーワード辞書が空のときはデフォルト辞書を使用して処理を続行し、マッチングなしで空の課題リストを返す', () => {
    // Arrange
    const analysisStartDate = new Date('2024-12-16T00:00:00Z');
    const analysisEndDate = new Date('2025-01-15T00:00:00Z');
    
    const reports: Report[] = [
      {
        reportId: 'report-001',
        reportDate: new Date('2025-01-15T08:00:00Z'),
        issueText: 'バグが多い',
        teamId: 'team-a'
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2025-01-14T08:00:00Z'),
        issueText: 'リソース不足で遅延',
        teamId: 'team-b'
      },
      {
        reportId: 'report-003',
        reportDate: new Date('2025-01-13T08:00:00Z'),
        issueText: 'ビルド失敗',
        teamId: 'team-a'
      },
      {
        reportId: 'report-004',
        reportDate: new Date('2025-01-12T08:00:00Z'),
        issueText: 'テスト環境不安定',
        teamId: 'team-c'
      },
      {
        reportId: 'report-005',
        reportDate: new Date('2025-01-11T08:00:00Z'),
        issueText: 'API接続エラー',
        teamId: 'team-b'
      },
      {
        reportId: 'report-006',
        reportDate: new Date('2025-01-10T08:00:00Z'),
        issueText: 'バグが多い',
        teamId: 'team-c'
      },
      {
        reportId: 'report-007',
        reportDate: new Date('2025-01-09T08:00:00Z'),
        issueText: 'リソース不足で遅延',
        teamId: 'team-a'
      },
      {
        reportId: 'report-008',
        reportDate: new Date('2025-01-08T08:00:00Z'),
        issueText: 'デプロイ失敗',
        teamId: 'team-b'
      },
      {
        reportId: 'report-009',
        reportDate: new Date('2025-01-07T08:00:00Z'),
        issueText: 'ネットワーク遅延',
        teamId: 'team-a'
      },
      {
        reportId: 'report-010',
        reportDate: new Date('2025-01-06T08:00:00Z'),
        issueText: 'ドキュメント不備',
        teamId: 'team-c'
      }
    ];

    const emptyKeywordDictionary: string[] = [];

    // Act
    const result: RankedIssueList = extractAndRankIssuesFromReports(
      reports,
      analysisStartDate,
      analysisEndDate,
      emptyKeywordDictionary
    );

    // Assert
    expect(result.issues).toEqual([]);
    expect(result.totalIssueCount).toBe(0);
    expect(result.analysisTimestamp).toBeDefined();
    expect(result.lowConfidenceIssueCount).toBe(0);
  });
});