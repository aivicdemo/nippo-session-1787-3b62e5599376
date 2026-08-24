import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('extractAndRankIssueKeywords', () => {
  test('SCEN-1741: キーワード出現頻度が閾値未満の場合、下位ランクに分類される', async () => {
    // Arrange: モック化されたTextAnalysisServiceAdapterを準備
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        'サーバー障害': 3,
        'ネットワーク遅延': 5,
        'メモリリーク': 2,
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        const impactScores: Record<string, number> = {
          'サーバー障害': 45,
          'ネットワーク遅延': 72,
          'メモリリーク': 35,
        };
        return Promise.resolve(impactScores[keyword] || 0);
      }),
      classifyIssueSeverity: jest.fn(),
    };

    // 10名の部員から合計14日分の日報を投入
    // うち3日分に『サーバー障害』というキーワードを含める
    const reportingPeriod = {
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
    };

    const mockReports = [
      {
        reportId: 'report_001',
        teamId: 'team_001',
        memberId: 'member_001',
        challengeText: 'サーバー障害が発生して、一時的にサービスが停止した。',
        reportDate: '2024-01-02',
      },
      {
        reportId: 'report_002',
        teamId: 'team_001',
        memberId: 'member_002',
        challengeText: 'データベース接続エラーが頻発している。',
        reportDate: '2024-01-03',
      },
      {
        reportId: 'report_003',
        teamId: 'team_001',
        memberId: 'member_003',
        challengeText: 'サーバー障害の影響でデプロイが遅延した。',
        reportDate: '2024-01-05',
      },
      {
        reportId: 'report_004',
        teamId: 'team_001',
        memberId: 'member_001',
        challengeText: 'ネットワーク遅延により通信が不安定。',
        reportDate: '2024-01-06',
      },
      {
        reportId: 'report_005',
        teamId: 'team_001',
        memberId: 'member_004',
        challengeText: 'ネットワーク遅延の再発が報告された。',
        reportDate: '2024-01-07',
      },
      {
        reportId: 'report_006',
        teamId: 'team_001',
        memberId: 'member_005',
        challengeText: 'メモリリークがテストで検出された。',
        reportDate: '2024-01-08',
      },
      {
        reportId: 'report_007',
        teamId: 'team_001',
        memberId: 'member_006',
        challengeText: 'サーバー障害対応のため追加作業が発生。',
        reportDate: '2024-01-09',
      },
      {
        reportId: 'report_008',
        teamId: 'team_001',
        memberId: 'member_007',
        challengeText: '本日は特に課題なし。',
        reportDate: '2024-01-10',
      },
      {
        reportId: 'report_009',
        teamId: 'team_001',
        memberId: 'member_008',
        challengeText: 'ネットワーク遅延による影響を検証中。',
        reportDate: '2024-01-11',
      },
      {
        reportId: 'report_010',
        teamId: 'team_001',
        memberId: 'member_009',
        challengeText: 'メモリ使用率が高くなっている傾向を確認。',
        reportDate: '2024-01-12',
      },
      {
        reportId: 'report_011',
        teamId: 'team_001',
        memberId: 'member_010',
        challengeText: 'ネットワーク遅延の原因調査が進行中。',
        reportDate: '2024-01-13',
      },
      {
        reportId: 'report_012',
        teamId: 'team_001',
        memberId: 'member_001',
        challengeText: 'データ処理のパフォーマンス低下を検討。',
        reportDate: '2024-01-01',
      },
      {
        reportId: 'report_013',
        teamId: 'team_001',
        memberId: 'member_002',
        challengeText: 'ネットワーク遅延により複数チームに波及。',
        reportDate: '2024-01-04',
      },
      {
        reportId: 'report_014',
        teamId: 'team_001',
        memberId: 'member_003',
        challengeText: '調査中の課題に進捗なし。',
        reportDate: '2024-01-14',
      },
    ];

    // Act: 課題キーワード自動抽出・優先度スコア算出機能を実行
    const result = await extractAndRankIssueKeywords(
      {
        teamId: 'team_001',
        startDate: reportingPeriod.startDate,
        endDate: reportingPeriod.endDate,
        minFrequencyThreshold: 1,
        requestUserId: 'user_001',
      },
      mockTextAnalysisService,
      mockReports
    );

    // Assert: 検証
    // 『サーバー障害』（出現頻度3件/週、チーム波及度スコア45点）が下位ランク（ランクC以下、または優先度スコア50点未満）に分類されることを確認
    const serverFailureKeyword = result.keywords.find(
      (kw) => kw.keyword === 'サーバー障害'
    );

    expect(serverFailureKeyword).toBeDefined();
    expect(serverFailureKeyword?.frequency).toBe(3);
    expect(serverFailureKeyword?.rank).toBeGreaterThan(1);

    // ネットワーク遅延（出現頻度5件/週、チーム波及度スコア72点）が上位ランクに分類されることを確認
    const networkDelayKeyword = result.keywords.find(
      (kw) => kw.keyword === 'ネットワーク遅延'
    );

    expect(networkDelayKeyword).toBeDefined();
    expect(networkDelayKeyword?.frequency).toBe(5);
    expect(networkDelayKeyword?.rank).toBe(1);

    // 抽出された全キーワード数を検証
    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(3);

    // 抽出処理の実行日時が記録されていることを確認
    expect(result.extractedAt).toBeInstanceOf(Date);

    // 分析対象期間の日数が正しく計算されていることを確認（2024-01-01から2024-01-14まで = 14日）
    expect(result.analysisperiodDays).toBe(14);

    // キーワードが発生頻度で降順にランク付けされていることを確認
    for (let i = 0; i < result.keywords.length - 1; i++) {
      expect(result.keywords[i].frequency).toBeGreaterThanOrEqual(
        result.keywords[i + 1].frequency
      );
    }
  });
});