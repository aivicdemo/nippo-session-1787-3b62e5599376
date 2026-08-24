import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation', () => {
  // SCEN-1598: [edge] 週次課題傾向レポート生成機能 - 課題キーワード抽出結果に重複データを含む場合、ランキング集計が正確に行われる
  test('should accurately aggregate duplicate keywords across multiple daily reports and rank by total occurrence count', () => {
    // Arrange: テストデータとして、同一の課題キーワード「データベース接続エラー」を含む3件の日報を準備
    const report1Content = 'Yesterday worked on database connection setup. Encountered database connection error three times. Today will implement retry logic.';
    const report2Content = 'Completed API integration. Found database connection error twice during testing. Need to investigate root cause.';
    const report3Content = 'Database connection error occurred five times in production. Critical issue affecting multiple services. Implementing connection pooling.';

    const extractedIssueData_report1 = {
      reportDate: '2024-01-08',
      keywords: [
        { keyword: 'データベース接続エラー', occurrenceCount: 3, impactScore: 75 },
        { keyword: 'リトライロジック', occurrenceCount: 1, impactScore: 50 },
      ],
    };

    const extractedIssueData_report2 = {
      reportDate: '2024-01-09',
      keywords: [
        { keyword: 'データベース接続エラー', occurrenceCount: 2, impactScore: 70 },
        { keyword: 'API統合', occurrenceCount: 1, impactScore: 45 },
      ],
    };

    const extractedIssueData_report3 = {
      reportDate: '2024-01-10',
      keywords: [
        { keyword: 'データベース接続エラー', occurrenceCount: 5, impactScore: 90 },
        { keyword: 'コネクションプーリング', occurrenceCount: 1, impactScore: 60 },
      ],
    };

    // TextAnalysisServiceAdapterのextractKeywordsメソッドをスタブで設定
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn()
        .mockResolvedValueOnce(extractedIssueData_report1)
        .mockResolvedValueOnce(extractedIssueData_report2)
        .mockResolvedValueOnce(extractedIssueData_report3),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: [
        extractedIssueData_report1,
        extractedIssueData_report2,
        extractedIssueData_report3,
      ],
      teamId: 'team-001',
    };

    // Act: 週次課題傾向レポート生成機能を実行
    const reportPromise = generateWeeklyAnalysisReport(input, mockTextAnalysisAdapter);

    // Assert: 生成されたレポートの課題ランキングデータを検証
    return reportPromise.then((report: WeeklyAnalysisReport) => {
      // 重複する課題キーワード『データベース接続エラー』が複数日報から抽出された場合、出現頻度の合計値が正確に集計される
      const databaseErrorIssue = report.issueRanking.find(
        (issue) => issue.issueKeyword === 'データベース接続エラー'
      );

      expect(databaseErrorIssue).toBeDefined();
      expect(databaseErrorIssue!.occurrenceCount).toBe(10); // 3 + 2 + 5
      expect(databaseErrorIssue!.rank).toBe(1); // ランキング1位

      // その他のキーワードは各1出現頻度として正確にランキング下位に集計される
      const retryLogicIssue = report.issueRanking.find(
        (issue) => issue.issueKeyword === 'リトライロジック'
      );
      const apiIntegrationIssue = report.issueRanking.find(
        (issue) => issue.issueKeyword === 'API統合'
      );
      const connectionPoolingIssue = report.issueRanking.find(
        (issue) => issue.issueKeyword === 'コネクションプーリング'
      );

      expect(retryLogicIssue).toBeDefined();
      expect(retryLogicIssue!.occurrenceCount).toBe(1);
      expect(retryLogicIssue!.rank).toBeGreaterThan(1);

      expect(apiIntegrationIssue).toBeDefined();
      expect(apiIntegrationIssue!.occurrenceCount).toBe(1);
      expect(apiIntegrationIssue!.rank).toBeGreaterThan(1);

      expect(connectionPoolingIssue).toBeDefined();
      expect(connectionPoolingIssue!.occurrenceCount).toBe(1);
      expect(connectionPoolingIssue!.rank).toBeGreaterThan(1);

      // レポートの基本情報を検証
      expect(report.reportId).toBeDefined();
      expect(typeof report.reportId).toBe('string');
      expect(report.aggregationPeriod.startDate).toBe('2024-01-08');
      expect(report.aggregationPeriod.endDate).toBe('2024-01-14');

      // 優先度スコアが含まれていることを確認
      expect(report.priorityScores).toBeDefined();
      expect(Array.isArray(report.priorityScores)).toBe(true);

      const databaseErrorPriority = report.priorityScores.find(
        (priority) => priority.issueId === databaseErrorIssue!.issueKeyword
      );
      expect(databaseErrorPriority).toBeDefined();
      expect(databaseErrorPriority!.priorityScore).toBeGreaterThanOrEqual(0);
      expect(databaseErrorPriority!.priorityScore).toBeLessThanOrEqual(100);
      expect(['high', 'medium', 'low']).toContain(databaseErrorPriority!.priorityRank);

      // 推奨対策が含まれていることを確認
      expect(report.recommendedCountermeasures).toBeDefined();
      expect(Array.isArray(report.recommendedCountermeasures)).toBe(true);

      // 生成日時が記録されていることを確認
      expect(report.generatedAt).toBeDefined();
      const generatedAtDate = new Date(report.generatedAt);
      expect(generatedAtDate instanceof Date && !isNaN(generatedAtDate.getTime())).toBe(true);
    });
  });
});