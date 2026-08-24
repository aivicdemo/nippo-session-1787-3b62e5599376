import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向レポート生成機能', () => {
  // SCEN-1553
  test('前週の日報から抽出された課題1件のとき、統一形式レポートが生成される', () => {
    // Arrange: TextAnalysisServiceAdapter のモック定義
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          {
            keyword: 'ログイン機能',
            frequency: 1,
            confidence: 0.95
          }
        ]
      }),
      assessImpactScore: jest.fn().mockReturnValue({
        impactScore: 45
      }),
      classifyIssueSeverity: jest.fn().mockReturnValue({
        severity: 'medium'
      })
    };

    // 前週の日報データ（2026年8月11日～8月15日の5営業日分）
    const extractedIssuesData = [
      {
        issueText: 'ログイン機能の不具合対応',
        reportDate: '2026-08-14', // 木曜日
        reporterId: 'engineer-001',
        confidence: 0.95
      }
    ];

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2026-08-11',
      aggregationEndDate: '2026-08-15',
      extractedIssues: extractedIssuesData,
      teamId: 'team-001'
    };

    // Act: 週次課題傾向レポート生成機能を実行
    const result: WeeklyAnalysisReport = generateWeeklyAnalysisReport(
      input,
      mockTextAnalysisAdapter
    );

    // Assert: レポート形式と内容の検証
    expect(result.reportId).toBeDefined();
    expect(result.reportId).toMatch(/^report-/);

    expect(result.aggregationPeriod).toEqual({
      startDate: '2026-08-11',
      endDate: '2026-08-15'
    });

    // 課題ランキング検証：1件の課題が検出されていること
    expect(result.issueRanking).toHaveLength(1);
    expect(result.issueRanking[0]).toEqual({
      issueKeyword: 'ログイン機能',
      occurrenceCount: 1,
      rank: 1
    });

    // 優先度スコア検証
    expect(result.priorityScores).toHaveLength(1);
    expect(result.priorityScores[0]).toEqual({
      issueId: expect.any(String),
      priorityScore: 45,
      priorityRank: 'medium'
    });

    // 推奨対策は初期段階では空配列であること（提案内容検証プロセス未実装）
    expect(result.recommendedCountermeasures).toEqual([]);

    // 生成日時が記録されていること（ISO 8601形式）
    expect(result.generatedAt).toBeDefined();
    expect(result.generatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/
    );

    // モック呼び出しの検証
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.stringContaining('ログイン機能')
    );
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).toHaveBeenCalled();
  });
});