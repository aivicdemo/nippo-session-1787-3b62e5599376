import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・頻度ランク付け', () => {
  // SCEN-2924
  test('同じ蓄積データで2回実行しても同じランク付け結果が得られる', () => {
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const requestUserId = 'user-manager-001';
    const minFrequencyThreshold = 1;

    const mockAccumulatedReports = [
      {
        reportId: 'report-001',
        teamId,
        reportText: 'サーバーダウンが発生しました。デプロイエラーが原因と思われます。',
        submittedAt: new Date('2024-01-08T09:30:00Z'),
      },
      {
        reportId: 'report-002',
        teamId,
        reportText: 'サーバーダウンの復旧が完了しました。ネットワーク遅延も確認されました。',
        submittedAt: new Date('2024-01-08T10:15:00Z'),
      },
      {
        reportId: 'report-003',
        teamId,
        reportText: 'デプロイエラーが再発しました。サーバーダウンの影響が続いています。',
        submittedAt: new Date('2024-01-09T09:00:00Z'),
      },
      {
        reportId: 'report-004',
        teamId,
        reportText: 'ネットワーク遅延が改善されました。',
        submittedAt: new Date('2024-01-09T14:30:00Z'),
      },
      {
        reportId: 'report-005',
        teamId,
        reportText: 'サーバーダウンが発生。デプロイエラーと同時に発生。',
        submittedAt: new Date('2024-01-10T08:45:00Z'),
      },
      {
        reportId: 'report-006',
        teamId,
        reportText: 'サーバーダウンの原因調査中。ネットワーク遅延が続いています。',
        submittedAt: new Date('2024-01-10T11:20:00Z'),
      },
      {
        reportId: 'report-007',
        teamId,
        reportText: 'デプロイエラーの修正完了。サーバーダウンの再発防止を実施。',
        submittedAt: new Date('2024-01-11T10:00:00Z'),
      },
      {
        reportId: 'report-008',
        teamId,
        reportText: 'ネットワーク遅延が再発しました。サーバーダウンとの関連を調査中。',
        submittedAt: new Date('2024-01-12T09:30:00Z'),
      },
      {
        reportId: 'report-009',
        teamId,
        reportText: 'サーバーダウンの予防保全を実施。デプロイエラーのテスト拡充。',
        submittedAt: new Date('2024-01-13T08:00:00Z'),
      },
      {
        reportId: 'report-010',
        teamId,
        reportText: 'サーバーダウン警告ログが増加しています。ネットワーク遅延の影響と考えられます。',
        submittedAt: new Date('2024-01-14T09:15:00Z'),
      },
    ];

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((reportText: string) => {
        const keywordMap: { [key: string]: number } = {};
        if (reportText.includes('サーバーダウン')) keywordMap['サーバーダウン'] = 1;
        if (reportText.includes('デプロイエラー')) keywordMap['デプロイエラー'] = 1;
        if (reportText.includes('ネットワーク遅延')) keywordMap['ネットワーク遅延'] = 1;
        return keywordMap;
      }),
      assessImpactScore: jest.fn(() => 75),
      classifyIssueSeverity: jest.fn(() => 'high'),
    };

    const mockDatabaseRepository = {
      findReportsByTeamAndDateRange: jest.fn(() => mockAccumulatedReports),
      findKeywordById: jest.fn((keywordId: string) => ({
        keywordId,
        keyword: keywordId === 'kw-001' ? 'サーバーダウン' : keywordId === 'kw-002' ? 'デプロイエラー' : 'ネットワーク遅延',
      })),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    const result1: RankedIssueKeywordList = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
      mockDatabaseRepository,
    );

    const result2: RankedIssueKeywordList = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
      mockDatabaseRepository,
    );

    expect(result1.keywords).toHaveLength(result2.keywords.length);
    expect(result1.keywords.length).toBe(3);

    expect(result1.keywords[0].keyword).toBe(result2.keywords[0].keyword);
    expect(result1.keywords[0].frequency).toBe(result2.keywords[0].frequency);
    expect(result1.keywords[0].rank).toBe(result2.keywords[0].rank);

    expect(result1.keywords[1].keyword).toBe(result2.keywords[1].keyword);
    expect(result1.keywords[1].frequency).toBe(result2.keywords[1].frequency);
    expect(result1.keywords[1].rank).toBe(result2.keywords[1].rank);

    expect(result1.keywords[2].keyword).toBe(result2.keywords[2].keyword);
    expect(result1.keywords[2].frequency).toBe(result2.keywords[2].frequency);
    expect(result1.keywords[2].rank).toBe(result2.keywords[2].rank);

    expect(result1.totalKeywordCount).toBe(result2.totalKeywordCount);
    expect(result1.totalKeywordCount).toBe(3);

    expect(result1.analysisperiodDays).toBe(result2.analysisperiodDays);
    expect(result1.analysisperiodDays).toBe(7);

    expect(result1.keywords[0].keyword).toBe('サーバーダウン');
    expect(result1.keywords[0].frequency).toBe(6);
    expect(result1.keywords[0].rank).toBe(1);

    expect(result1.keywords[1].keyword).toBe('デプロイエラー');
    expect(result1.keywords[1].frequency).toBe(3);
    expect(result1.keywords[1].rank).toBe(2);

    expect(result1.keywords[2].keyword).toBe('ネットワーク遅延');
    expect(result1.keywords[2].frequency).toBe(4);
    expect(result1.keywords[2].rank).toBe(3);
  });
});