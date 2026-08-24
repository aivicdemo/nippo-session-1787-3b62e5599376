import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1497: [error] 課題キーワード自動抽出・頻度ランク付け機能 - 日報データのタイムスタンプが無効な日付形式のとき、エラーを返す
  test('無効な日付形式のタイムスタンプを含む日報データを送信時に、タイムスタンプ形式エラーを検出して処理を中断する', () => {
    const invalidReports = [
      {
        reportId: 'report-001',
        teamId: 'team-123',
        reportingDate: '2024-13-45',
        issueContent: 'データベース接続エラー'
      },
      {
        reportId: 'report-002',
        teamId: 'team-123',
        reportingDate: '2024/02/30',
        issueContent: 'API レスポンス遅延'
      },
      {
        reportId: 'report-003',
        teamId: 'team-123',
        reportingDate: 'invalid-date',
        issueContent: 'ネットワーク障害'
      }
    ];

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [],
        frequency: 0
      })
    };

    const input = {
      teamId: 'team-123',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-456',
      reports: invalidReports
    };

    expect(() =>
      extractAndRankIssueKeywords(input, mockTextAnalysisAdapter)
    ).toThrow(/タイムスタンプ/);

    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});