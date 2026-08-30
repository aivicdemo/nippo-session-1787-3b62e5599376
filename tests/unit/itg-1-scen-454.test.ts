import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';
import type {
  MonthlyAnalysisReportResult,
  MonthlyReportDataset,
  MonthlyReport,
  ExtractedIssue,
} from '../../src/logic/monthly-analysis-report';

// SCEN-454: 前月データが存在しない場合（初月など）、前月比較をスキップし当月単独の分析結果を表示する
describe('Monthly Analysis Report Generation - Initial Month Edge Case', () => {
  let mockExtractMonthlyReportDataset: jest.Mock;
  let mockValidateMonthlyAnalysisDataCompleteness: jest.Mock;
  let mockAnalyzeIssueTimeSeriesChange: jest.Mock;
  let mockIdentifyMonthlyBottleneckProgression: jest.Mock;
  let mockCalculateTeamPerformanceMetrics: jest.Mock;
  let mockCalculateProjectDelayRiskScore: jest.Mock;
  let mockExtractTopPriorityChallengesForExecutives: jest.Mock;
  let mockStructureMonthlyReportContent: jest.Mock;
  let mockSaveExtractedIssueData: jest.Mock;
  let mockSendConfirmationEmailToManager: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // 当月（2024-01）のダミーデータセット
    const currentMonthDataset: MonthlyReportDataset = {
      extractionPeriod: {
        startDateTime: '2024-01-01T00:00:00Z',
        endDateTime: '2024-01-31T23:59:59Z',
      },
      totalReportCount: 3,
      reports: [
        {
          reportId: 'report-001',
          reportDate: '2024-01-15',
          reporterId: 'eng-001',
          teamId: 'team-001',
          issues: [
            {
              issueId: 'issue-001',
              issueContent: 'ビルド失敗',
              frequency: 2,
              extractedDate: new Date('2024-01-15T09:00:00Z'),
            },
          ],
          submissionTimestamp: '2024-01-15T08:30:00Z',
        },
        {
          reportId: 'report-002',
          reportDate: '2024-01-16',
          reporterId: 'eng-002',
          teamId: 'team-001',
          issues: [
            {
              issueId: 'issue-002',
              issueContent: 'テスト環境不安定',
              frequency: 1,
              extractedDate: new Date('2024-01-16T09:15:00Z'),
            },
          ],
          submissionTimestamp: '2024-01-16T08:45:00Z',
        },
        {
          reportId: 'report-003',
          reportDate: '2024-01-17',
          reporterId: 'eng-003',
          teamId: 'team-001',
          issues: [
            {
              issueId: 'issue-003',
              issueContent: 'リソース不足',
              frequency: 1,
              extractedDate: new Date('2024-01-17T09:30:00Z'),
            },
          ],
          submissionTimestamp: '2024-01-17T08:55:00Z',
        },
      ],
      dataQualityScore: 85,
    };

    // 前月（2023-12）のデータは空配列を返す
    const previousMonthDataset: MonthlyReportDataset = {
      extractionPeriod: {
        startDateTime: '2023-12-01T00:00:00Z',
        endDateTime: '2023-12-31T23:59:59Z',
      },
      totalReportCount: 0,
      reports: [],
      dataQualityScore: 0,
    };

    mockExtractMonthlyReportDataset = jest.fn((request) => {
      if (request.targetMonth === '2024-01') {
        return Promise.resolve(currentMonthDataset);
      } else if (request.targetMonth === '2023-12') {
        return Promise.resolve(previousMonthDataset);
      }
      return Promise.resolve(previousMonthDataset);
    });

    mockValidateMonthlyAnalysisDataCompleteness = jest.fn(() =>
      Promise.resolve({
        isValid: true,
        completenessScore: 85,
        issues: [],
      })
    );

    mockAnalyzeIssueTimeSeriesChange = jest.fn((request) => {
      // 前月データが空の場合、前月比較フィールドを未設定にする
      const hasNoHistoricalData = request.previousMonthIssues.length === 0;

      return Promise.resolve({
        issueTimeSeriesData: [
          {
            issueId: 'issue-001',
            issueContent: 'ビルド失敗',
            frequencyTrend: [
              { date: new Date('2024-01-08'), frequency: 1 },
              { date: new Date('2024-01-15'), frequency: 2 },
            ],
            impactTrend: [
              { date: new Date('2024-01-08'), impactScore: 45 },
              { date: new Date('2024-01-15'), impactScore: 65 },
            ],
            resolutionStatusTimeline: [
              { date: new Date('2024-01-08'), status: 'unresolved' },
              { date: new Date('2024-01-15'), status: 'in_progress' },
            ],
          },
        ],
        bottleneckSeverityRanking: [
          {
            issueId: 'issue-001',
            severityRank: 'high',
            severityScore: 65,
            justification: 'ビルド失敗により開発プロセスが停滞',
          },
        ],
        improvementTrendAnalysis: [
          {
            issueId: 'issue-001',
            trendDirection: 'stable',
            improvementRate: 0,
            daysToResolution: null,
          },
        ],
        hasHistoricalComparison: !hasNoHistoricalData,
        noHistoricalDataNote: hasNoHistoricalData
          ? '前月データが存在しないため前月比較は実施していません'
          : undefined,
      });
    });

    mockIdentifyMonthlyBottleneckProgression = jest.fn(() =>
      Promise.resolve({
        progressionPatterns: [
          {
            issueId: 'issue-001',
            progressionType: 'stable',
            weeklyFrequencyTrend: [1, 2, 2, 1],
            category: 'technical',
          },
        ],
        criticalBottlenecks: [],
        resolvedBottlenecks: [],
        emergingBottlenecks: [
          {
            issueId: 'issue-002',
            issueContent: 'テスト環境不安定',
            firstOccurrenceDate: new Date('2024-01-16'),
            impactScore: 40,
          },
        ],
      })
    );

    mockCalculateTeamPerformanceMetrics = jest.fn(() =>
      Promise.resolve({
        teamMetrics: [
          {
            teamId: 'team-001',
            issueResolutionSpeedDays: 3,
            reportSubmissionRate: 100,
            issueRecurrenceRate: 15,
            priorityScore: 78,
            performanceRank: 'high',
          },
        ],
        aggregationPeriod: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        calculationTimestamp: new Date('2024-01-31T15:00:00Z'),
      })
    );

    mockCalculateProjectDelayRiskScore = jest.fn(() =>
      Promise.resolve({
        riskScore: 55,
        riskLevel: 'medium',
        delayDaysEstimate: 2,
      })
    );

    mockExtractTopPriorityChallengesForExecutives = jest.fn(() =>
      Promise.resolve({
        selectedChallenges: [
          {
            challengeId: 'issue-001',
            priorityScore: 72,
            impactDegree: 65,
            occurrenceFrequency: 2,
          },
          {
            challengeId: 'issue-002',
            priorityScore: 45,
            impactDegree: 40,
            occurrenceFrequency: 1,
          },
        ],
        totalChallengesAnalyzed: 3,
        selectionRationale:
          '優先度スコアの高い課題から順に5件まで抽出',
        dataQualityValidationResult: {
          isValid: true,
          completenessScore: 85,
          accuracyScore: 88,
        },
      })
    );

    mockStructureMonthlyReportContent = jest.fn((request) =>
      Promise.resolve({
        reportPeriod: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        topPriorityChallenges: [
          {
            challengeId: 'issue-001',
            challengeTitle: 'ビルド失敗',
            priorityScore: 72,
            impactDegree: 65,
            occurrenceFrequency: 2,
            recommendedActions: [
              {
                actionTitle: 'ビルドパイプラインの検証',
                owner: 'eng-001',
                dueDate: '2024-02-05',
              },
            ],
          },
        ],
        teamPerformanceSummary: {
          averageResolutionDays: 3,
          averageSubmissionRate: 100,
          averageRecurrenceRate: 15,
          highPerformingTeams: ['team-001'],
          lowPerformingTeams: [],
        },
        projectDelayRiskAssessment: {
          riskScore: 55,
          riskLevel: 'medium',
          affectedProjects: ['project-001'],
        },
        analysisNotes: request.hasHistoricalComparison
          ? '前月比較データを含む'
          : '前月データが存在しないため前月比較は実施していません',
      })
    );

    mockSaveExtractedIssueData = jest.fn(() => Promise.resolve());

    mockSendConfirmationEmailToManager = jest.fn(() => Promise.resolve());
  });

  test('should generate monthly analysis report skipping previous month comparison when no prior data exists', async () => {
    // Arrange
    const input = {
      targetMonth: '2024-01',
      projectManagerId: 'PM001',
      includeExecutiveSummary: true,
      topChallengesCount: 5,
    };

    // Mock the dependencies (this would typically be injected or mocked at module level)
    jest.spyOn(require('../../src/logic/monthly-analysis-report'), 'extractMonthlyReportDataset', 'get')
      .mockReturnValue(mockExtractMonthlyReportDataset);
    jest.spyOn(require('../../src/logic/monthly-analysis-report'), 'validateMonthlyAnalysisDataCompleteness', 'get')
      .mockReturnValue(mockValidateMonthlyAnalysisDataCompleteness);
    jest.spyOn(require('../../src/logic/monthly-analysis-report'), 'analyzeIssueTimeSeriesChange', 'get')
      .mockReturnValue(mockAnalyzeIssueTimeSeriesChange);
    jest.spyOn(require('../../src/logic/monthly-analysis-report'), 'identifyMonthlyBottleneckProgression', 'get')
      .mockReturnValue(mockIdentifyMonthlyBottleneckProgression);
    jest.spyOn(require('../../src/logic/monthly-analysis-report'), 'calculateTeamPerformanceMetrics', 'get')
      .mockReturnValue(mockCalculateTeamPerformanceMetrics);
    jest.spyOn(require('../../src/logic/monthly-analysis-report'), 'calculateProjectDelayRiskScore', 'get')
      .mockReturnValue(mockCalculateProjectDelayRiskScore);
    jest.spyOn(require('../../src/logic/monthly-analysis-report'), 'extractTopPriorityChallengesForExecutives', 'get')
      .mockReturnValue(mockExtractTopPriorityChallengesForExecutives);
    jest.spyOn(require('../../src/logic/monthly-analysis-report'), 'structureMonthlyReportContent', 'get')
      .mockReturnValue(mockStructureMonthlyReportContent);
    jest.spyOn(require('../../src/logic/monthly-analysis-report'), 'saveExtractedIssueData', 'get')
      .mockReturnValue(mockSaveExtractedIssueData);
    jest.spyOn(require('../../src/logic/monthly-analysis-report'), 'sendConfirmationEmailToManager', 'get')
      .mockReturnValue(mockSendConfirmationEmailToManager);

    // Act
    const result: MonthlyAnalysisReportResult = await generateMonthlyAnalysisReport(input);

    // Assert
    // (1) reportId は UUID形式の一意識別子を保有する
    expect(result.reportId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    // (2) targetMonth は '2024-01' を保有する
    expect(result.targetMonth).toBe('2024-01');

    // (3) reportContent は analyzeIssueTimeSeriesChange の結果を含み、前月比較なしで当月単独データのみを反映
    expect(result.reportContent).toBeDefined();
    expect(result.reportContent.analysisNotes).toContain('前月データが存在しないため前月比較は実施していません');

    // (4) 業務ルール br-tx_7-005 の制約を確認
    // 前月比較関連フィールドが null/undefined で出力されるか、明示的な記載がある
    expect(
      result.reportContent.analysisNotes === undefined ||
        result.reportContent.analysisNotes.includes('前月比較')
    ).toBe(true);

    // (5) projectDelayRiskLevel は 'high'、'medium'、'low' のいずれかを保有
    expect(['high', 'medium', 'low']).toContain(result.projectDelayRiskLevel);
    expect(result.projectDelayRiskLevel).toBe('medium');

    // (6) generatedAt は現在時刻（テスト実行時刻）を基準に合理的な日時を保有
    const generatedTime = new Date(result.generatedAt);
    const now = new Date();
    const timeDifferenceMs = Math.abs(now.getTime() - generatedTime.getTime());
    expect(timeDifferenceMs).toBeLessThan(5000); // 5秒以内

    // (7) エラーが発生していないことを確認
    expect(result).not.toHaveProperty('error');

    // (8) sendConfirmationEmailToManager への呼び出し引数を確認
    expect(mockSendConfirmationEmailToManager).toHaveBeenCalled();
    const emailCallArgs = mockSendConfirmationEmailToManager.mock.calls[0][0];
    expect(emailCallArgs).toHaveProperty('reportId');
    expect(emailCallArgs).toHaveProperty('targetMonth');
    expect(emailCallArgs).toHaveProperty('reportContent');
    expect(emailCallArgs.reportId).toBe(result.reportId);
    expect(emailCallArgs.targetMonth).toBe('2024-01');
  });
});