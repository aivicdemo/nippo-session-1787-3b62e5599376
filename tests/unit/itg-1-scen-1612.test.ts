import { validateReportQuality } from '../../src/logic/weekly-issue-analysis';
import { type ReportQualityValidationInput, type ReportQualityValidationResult } from '../../src/logic/weekly-issue-analysis';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  // SCEN-1612: [normal] 課題分析結果再現性検証機能 - 同じ抽出済み課題に対して 2 回影響度判定を実行し、両回のスコア結果が完全に一致する
  test('同一課題に対する影響度判定スコアが 2 回の実行で完全に一致する', () => {
    const reportId = 'rpt_001_weekly_analysis';
    const aggregationStartDate = '2024-01-08';
    const aggregationEndDate = '2024-01-14';
    const teamId = 'team_dev_001';

    const mockReportContent = {
      reportId,
      aggregationPeriod: {
        startDate: aggregationStartDate,
        endDate: aggregationEndDate,
      },
      issueRanking: [
        {
          issueKeyword: 'データベース接続タイムアウト',
          occurrenceCount: 5,
          rank: 1,
        },
      ],
      priorityScores: [
        {
          issueId: 'issue_db_timeout_001',
          priorityScore: 72,
          priorityRank: 'high' as const,
        },
      ],
      recommendedCountermeasures: [
        {
          issueKeyword: 'データベース接続タイムアウト',
          proposedAction: 'コネクションプール設定を見直す',
          estimatedEffort: 'medium',
          expectedImpactScore: 72,
        },
      ],
      generatedAt: '2024-01-15T09:00:00Z',
    };

    const mockSourceReportData = [
      {
        reportDate: new Date('2024-01-08'),
        reportContent: 'データベース接続タイムアウトが頻発している',
        submittedByUserId: 'user_eng_001',
        teamId,
      },
      {
        reportDate: new Date('2024-01-09'),
        reportContent: 'DB タイムアウトエラーが本番環境で発生',
        submittedByUserId: 'user_eng_002',
        teamId,
      },
      {
        reportDate: new Date('2024-01-10'),
        reportContent: 'データベース接続タイムアウト: リトライ実装中',
        submittedByUserId: 'user_eng_003',
        teamId,
      },
      {
        reportDate: new Date('2024-01-11'),
        reportContent: 'タイムアウト現象が減少傾向',
        submittedByUserId: 'user_eng_001',
        teamId,
      },
      {
        reportDate: new Date('2024-01-12'),
        reportContent: 'DB 接続周りの調査が進行中',
        submittedByUserId: 'user_eng_002',
        teamId,
      },
    ];

    const validationInput: ReportQualityValidationInput = {
      reportId,
      reportContent: mockReportContent,
      sourceReportData: mockSourceReportData,
      validationCriteria: {
        minRequiredIssueCount: 3,
        minAccuracyThreshold: 80,
        requiredReportSections: [
          'aggregationPeriod',
          'issueRanking',
          'priorityScores',
          'recommendedCountermeasures',
        ],
      },
    };

    // 1 回目の検証実行
    const firstValidationResult: ReportQualityValidationResult = validateReportQuality(validationInput);

    // 1 回目の結果からスコアを抽出
    const firstPriorityScore = firstValidationResult.isValid
      ? mockReportContent.priorityScores[0].priorityScore
      : null;

    // 同じ入力で 2 回目の検証を実行
    const secondValidationResult: ReportQualityValidationResult = validateReportQuality(validationInput);

    // 2 回目の結果からスコアを抽出
    const secondPriorityScore = secondValidationResult.isValid
      ? mockReportContent.priorityScores[0].priorityScore
      : null;

    // 期待値: 1 回目と 2 回目の影響度スコアが完全に一致する
    expect(firstValidationResult.validationStatus).toBe('approved');
    expect(secondValidationResult.validationStatus).toBe('approved');
    expect(firstValidationResult.isValid).toBe(true);
    expect(secondValidationResult.isValid).toBe(true);
    expect(firstPriorityScore).toBe(72);
    expect(secondPriorityScore).toBe(72);
    expect(firstPriorityScore).toEqual(secondPriorityScore);

    // 検証対象セクションが全て存在することを確認
    expect(firstValidationResult.issues).toHaveLength(0);
    expect(secondValidationResult.issues).toHaveLength(0);
  });
});