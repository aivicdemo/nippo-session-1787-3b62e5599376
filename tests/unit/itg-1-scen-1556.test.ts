import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport, type RankedIssue } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation', () => {
  // SCEN-1556: [normal] 週次課題傾向レポート生成機能 - レポートに課題ランキングが必須項目として含まれて生成される
  test('should generate weekly analysis report with ranked issue list as mandatory field', async () => {
    // Arrange: テストデータ準備
    const analysisStartDate = new Date('2024-01-08T00:00:00Z');
    const analysisEndDate = new Date('2024-01-14T23:59:59Z');
    const reportGeneratedAt = new Date('2024-01-15T10:30:00Z');

    const extractedIssuesInput = [
      {
        keyword: 'database_connection_timeout',
        frequency: 8,
        impactScore: 95,
      },
      {
        keyword: 'api_response_delay',
        frequency: 12,
        impactScore: 87,
      },
      {
        keyword: 'memory_leak_in_worker',
        frequency: 5,
        impactScore: 92,
      },
      {
        keyword: 'missing_error_handling',
        frequency: 7,
        impactScore: 78,
      },
      {
        keyword: 'test_flakiness',
        frequency: 9,
        impactScore: 65,
      },
      {
        keyword: 'deployment_script_issue',
        frequency: 3,
        impactScore: 55,
      },
      {
        keyword: 'documentation_outdated',
        frequency: 6,
        impactScore: 45,
      },
      {
        keyword: 'code_review_bottleneck',
        frequency: 4,
        impactScore: 38,
      },
      {
        keyword: 'build_time_increase',
        frequency: 5,
        impactScore: 72,
      },
      {
        keyword: 'slack_notification_failure',
        frequency: 2,
        impactScore: 25,
      },
    ];

    const reportInput: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: extractedIssuesInput,
      teamId: 'team-engineering-01',
    };

    // Mock TextAnalysisServiceAdapter
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue(extractedIssuesInput),
      assessImpactScore: jest.fn().mockImplementation((keyword: string) => {
        const issueData = extractedIssuesInput.find(
          (issue) => issue.keyword === keyword
        );
        return Promise.resolve(issueData?.impactScore ?? 50);
      }),
      classifyIssueSeverity: jest.fn().mockImplementation((keyword: string) => {
        const issueData = extractedIssuesInput.find(
          (issue) => issue.keyword === keyword
        );
        if ((issueData?.impactScore ?? 0) >= 80) {
          return Promise.resolve('high');
        } else if ((issueData?.impactScore ?? 0) >= 60) {
          return Promise.resolve('medium');
        }
        return Promise.resolve('low');
      }),
    };

    // Act: 週次課題傾向レポート生成を実行
    const report = await generateWeeklyAnalysisReport(
      reportInput,
      mockTextAnalysisService
    );

    // Assert: レポートの検証
    // (1) reportIdが存在することを確認
    expect(report.reportId).toBeDefined();
    expect(typeof report.reportId).toBe('string');
    expect(report.reportId.length).toBeGreaterThan(0);

    // (2) aggregationPeriodが正しく設定されていることを確認
    expect(report.aggregationPeriod).toBeDefined();
    expect(report.aggregationPeriod.startDate).toBe('2024-01-08');
    expect(report.aggregationPeriod.endDate).toBe('2024-01-14');

    // (3) issueRankingが必須項目として含まれていることを確認
    expect(report.issueRanking).toBeDefined();
    expect(Array.isArray(report.issueRanking)).toBe(true);

    // (4) issueRankingが上位5件を含んでいることを確認
    expect(report.issueRanking.length).toBeLessThanOrEqual(5);
    expect(report.issueRanking.length).toBeGreaterThan(0);

    // (5) 各ランキング要素の必須フィールドを確認
    report.issueRanking.forEach((rankedIssue: RankedIssue, index: number) => {
      expect(rankedIssue.issueKeyword).toBeDefined();
      expect(typeof rankedIssue.issueKeyword).toBe('string');
      expect(rankedIssue.issueKeyword.length).toBeGreaterThan(0);

      expect(rankedIssue.occurrenceCount).toBeDefined();
      expect(typeof rankedIssue.occurrenceCount).toBe('number');
      expect(rankedIssue.occurrenceCount).toBeGreaterThan(0);

      expect(rankedIssue.rank).toBeDefined();
      expect(typeof rankedIssue.rank).toBe('number');
      expect(rankedIssue.rank).toBe(index + 1);
    });

    // (6) priorityScoresが必須項目として含まれていることを確認
    expect(report.priorityScores).toBeDefined();
    expect(Array.isArray(report.priorityScores)).toBe(true);
    expect(report.priorityScores.length).toBeGreaterThan(0);

    // (7) 各優先度スコア要素の必須フィールドを確認
    report.priorityScores.forEach((priorityData) => {
      expect(priorityData.issueId).toBeDefined();
      expect(typeof priorityData.issueId).toBe('string');

      expect(priorityData.priorityScore).toBeDefined();
      expect(typeof priorityData.priorityScore).toBe('number');
      expect(priorityData.priorityScore).toBeGreaterThanOrEqual(0);
      expect(priorityData.priorityScore).toBeLessThanOrEqual(100);

      expect(priorityData.priorityRank).toBeDefined();
      expect(['high', 'medium', 'low']).toContain(priorityData.priorityRank);
    });

    // (8) 課題ランキングが影響度スコアの降順（高い順）で並んでいることを確認
    for (let i = 0; i < report.issueRanking.length - 1; i++) {
      const currentRankedIssue = report.issueRanking[i];
      const nextRankedIssue = report.issueRanking[i + 1];

      const currentPriority = report.priorityScores.find(
        (p) => p.issueId === currentRankedIssue.issueKeyword
      );
      const nextPriority = report.priorityScores.find(
        (p) => p.issueId === nextRankedIssue.issueKeyword
      );

      if (
        currentPriority &&
        nextPriority &&
        currentPriority.priorityScore !== nextPriority.priorityScore
      ) {
        expect(currentPriority.priorityScore).toBeGreaterThanOrEqual(
          nextPriority.priorityScore
        );
      }
    }

    // (9) recommendedCountermeasuresが含まれていることを確認
    expect(report.recommendedCountermeasures).toBeDefined();
    expect(Array.isArray(report.recommendedCountermeasures)).toBe(true);

    // (10) generatedAtがISO 8601形式で現在時刻から5秒以内であることを確認
    expect(report.generatedAt).toBeDefined();
    expect(typeof report.generatedAt).toBe('string');

    const generatedAtDate = new Date(report.generatedAt);
    const timeDifferenceMs = Math.abs(
      generatedAtDate.getTime() - reportGeneratedAt.getTime()
    );
    expect(timeDifferenceMs).toBeLessThanOrEqual(5000);

    // (11) TextAnalysisServiceAdapterが正しく呼び出されたことを確認
    expect(mockTextAnalysisService.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisService.assessImpactScore).toHaveBeenCalled();
    expect(mockTextAnalysisService.classifyIssueSeverity).toHaveBeenCalled();

    // (12) 外部サービスが複数回呼び出されていることを確認（各キーワードに対して）
    expect(
      mockTextAnalysisService.assessImpactScore.mock.calls.length
    ).toBeGreaterThan(0);
    expect(
      mockTextAnalysisService.classifyIssueSeverity.mock.calls.length
    ).toBeGreaterThan(0);
  });
});