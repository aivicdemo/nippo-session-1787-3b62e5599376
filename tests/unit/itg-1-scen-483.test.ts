import { searchAndRetrieveReports } from '../../src/logic/report-search-and-retrieval';
import { type TextAnalysisServiceAdapter } from '../../src/logic/report-search-and-retrieval';

describe('朝会報告管理システム - 報告検索・抽出機能', () => {
  // SCEN-483
  test('キーワード抽出モデルが利用不可のときにエラーをスロー', async () => {
    const mockTextAnalysisServiceAdapter: jest.Mocked<TextAnalysisServiceAdapter> = {
      extractKeywords: jest.fn().mockRejectedValue(
        new Error('指定されたキーワード抽出モデルが見つかりません')
      ),
    };

    const searchInput = {
      dateRange: {
        startDate: '2024-01-10',
        endDate: '2024-01-11',
      },
      keywords: ['データベース接続エラー'],
      teamIds: undefined,
      reporterIds: undefined,
    };

    const mockReports = [
      {
        reportId: 'report001',
        reportDate: '2024-01-10T08:00:00Z',
        reporterName: 'user001',
        teamName: 'team-a',
        content: 'データベース接続エラーが発生しました',
        extractedIssues: ['データベース接続エラー'],
      },
      {
        reportId: 'report002',
        reportDate: '2024-01-11T08:00:00Z',
        reporterName: 'user002',
        teamName: 'team-b',
        content: 'データベース接続エラーが再発しています',
        extractedIssues: ['データベース接続エラー'],
      },
    ];

    expect(async () => {
      await searchAndRetrieveReports(searchInput, mockTextAnalysisServiceAdapter, mockReports);
    }).rejects.toThrow(/指定されたキーワード抽出モデルが見つかりません/);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
  });
});