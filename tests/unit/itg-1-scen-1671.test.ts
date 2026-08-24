import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation', () => {
  // SCEN-1671: [normal] 週次課題傾向分析レポート生成 - 日報件数が最小閾値以上かつデータ品質が不足しているとき分析スキップが返される
  test('should skip analysis when report count meets minimum threshold but data quality is insufficient', () => {
    const aggregationStartDate = '2024-01-01';
    const aggregationEndDate = '2024-01-05';
    const teamId = 'team-001';

    // 有効なキーワード抽出可能な日報3件のデータ
    const validExtractedIssues = [
      {
        issueId: 'issue-001',
        keyword: 'デプロイ遅延',
        occurrenceCount: 2,
        impactScore: 75,
        sourceReportDate: '2024-01-01',
      },
      {
        issueId: 'issue-002',
        keyword: 'テスト失敗',
        occurrenceCount: 1,
        impactScore: 60,
        sourceReportDate: '2024-01-02',
      },
      {
        issueId: 'issue-003',
        keyword: 'レビュー遅延',
        occurrenceCount: 1,
        impactScore: 55,
        sourceReportDate: '2024-01-03',
      },
    ];

    // 課題テキスト欠落・空白・定型文のみの日報7件のデータ
    // これらは抽出に失敗して空配列が返される想定
    const insufficientExtractedIssues = Array.from({ length: 7 }, (_, idx) => ({
      issueId: `issue-insufficient-${idx + 1}`,
      keyword: '',
      occurrenceCount: 0,
      impactScore: 0,
      sourceReportDate: '2024-01-04',
    }));

    const allExtractedIssues = [...validExtractedIssues, ...insufficientExtractedIssues];

    // TextAnalysisServiceAdapterのスタブ: 有効なキーワードは3件のみ
    // 実装内部でデータ品質スコアを計算し、3件以下と判定する
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        // 有効な3件は非空の結果を返す、残る7件は空配列を返す
        if (
          text.includes('デプロイ') ||
          text.includes('テスト') ||
          text.includes('レビュー')
        ) {
          return { keywords: [text], frequency: 1 };
        }
        return { keywords: [], frequency: 0 };
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        // 抽出されたキーワード件数が3件以下の場合はデータ品質不足を判定
        if (validExtractedIssues.length <= 3) {
          return {
            score: 0,
            qualityAssessment: 'INSUFFICIENT_DATA_QUALITY',
          };
        }
        return {
          score: 70,
          qualityAssessment: 'SUFFICIENT',
        };
      }),
      classifyIssueSeverity: jest.fn((text: string) => 'medium'),
    };

    const result = generateWeeklyAnalysisReport(
      {
        aggregationStartDate,
        aggregationEndDate,
        extractedIssues: allExtractedIssues,
        teamId,
      },
      mockTextAnalysisAdapter
    );

    // 検証: 分析スキップステータスが返される
    expect(result.status).toBe('SKIP');
    expect(result.reason).toBe('INSUFFICIENT_DATA_QUALITY');
    expect(result.message).toMatch(/有効な課題キーワード数が基準値以下/);

    // 検証: レポートIDが生成されない（スキップ時はnull or undefined）
    expect(result.reportId).toBeUndefined();

    // 検証: issueRankingが空配列
    expect(result.issueRanking).toEqual([]);

    // 検証: priorityScoresが空配列
    expect(result.priorityScores).toEqual([]);

    // 検証: recommendedCountermeasuresが空配列
    expect(result.recommendedCountermeasures).toEqual([]);
  });
});