import { searchAndRetrieveReports } from '../../src/logic/report-search-and-retrieval';

describe('朝会報告管理システム - 報告検索・抽出処理', () => {
  // SCEN-414
  test('searchAndRetrieveReports should throw error when similarityThreshold is outside 0-100 range', async () => {
    const testReports = [
      {
        reportId: 'report_001',
        reportDate: '2024-01-15',
        submitterName: 'Alice',
        teamName: 'Team A',
        issueContent: 'ビルド失敗',
        extractedKeywords: ['ビルド失敗']
      },
      {
        reportId: 'report_002',
        reportDate: '2024-01-15',
        submitterName: 'Bob',
        teamName: 'Team A',
        issueContent: 'ビルドエラー',
        extractedKeywords: ['ビルドエラー']
      },
      {
        reportId: 'report_003',
        reportDate: '2024-01-14',
        submitterName: 'Charlie',
        teamName: 'Team B',
        issueContent: 'テスト失敗',
        extractedKeywords: ['テスト失敗']
      },
      {
        reportId: 'report_004',
        reportDate: '2024-01-14',
        submitterName: 'David',
        teamName: 'Team B',
        issueContent: 'デプロイ遅延',
        extractedKeywords: ['デプロイ遅延']
      },
      {
        reportId: 'report_005',
        reportDate: '2024-01-13',
        submitterName: 'Eve',
        teamName: 'Team C',
        issueContent: 'ビルド失敗',
        extractedKeywords: ['ビルド失敗']
      }
    ];

    const searchInput = {
      dateRange: {
        startDate: '2024-01-13',
        endDate: '2024-01-15'
      },
      keywords: ['ビルド', 'テスト'],
      teamIds: undefined,
      reporterIds: undefined,
      rawSearchResults: testReports,
      dateRangeFilter: {
        startDate: '2024-01-13',
        endDate: '2024-01-15'
      },
      keywordFilter: ['ビルド', 'テスト'],
      userRole: 'manager'
    };

    // ケース1: similarityThreshold = -1
    expect(() => {
      searchAndRetrieveReports({
        ...searchInput,
        similarityThreshold: -1
      });
    }).toThrow(/類似度閾値は0～100の範囲で指定してください/);

    // ケース2: similarityThreshold = 101
    expect(() => {
      searchAndRetrieveReports({
        ...searchInput,
        similarityThreshold: 101
      });
    }).toThrow(/類似度閾値は0～100の範囲で指定してください/);

    // ケース3: similarityThreshold = -0.1
    expect(() => {
      searchAndRetrieveReports({
        ...searchInput,
        similarityThreshold: -0.1
      });
    }).toThrow(/類似度閾値は0～100の範囲で指定してください/);

    // ケース4: similarityThreshold = 100.1
    expect(() => {
      searchAndRetrieveReports({
        ...searchInput,
        similarityThreshold: 100.1
      });
    }).toThrow(/類似度閾値は0～100の範囲で指定してください/);
  });
});