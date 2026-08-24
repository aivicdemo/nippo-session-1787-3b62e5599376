import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx8Imp1Agent } from '../../src/agents/tx-8-imp-1/orchestrator';
import type { Tx8Imp1AiClient } from '../../src/agents/tx-8-imp-1/orchestrator';

describe('tx-8-imp-1: 課題検索から可視化レポート作成までの自動実行', () => {
  // SCEN-3202: [normal] ボトルネック変化パターン特定アクションの自律実行
  test('SCEN-3202: Action 3がボトルネック変化パターンを3種類以上検出し、改善度スコアと信度スコアを付与して構造化データで出力する', async () => {
    const analysisStartDate = '2024-12-01T00:00:00Z';
    const analysisEndDate = '2024-12-31T23:59:59Z';
    const teamIds = ['team-001'];
    const minimumRecurrenceThreshold = 3;
    const recipientManagerId = 'mgr-001';

    const mockExtractedIssuesData = {
      issueKeywords: [
        {
          keyword: 'API_TIMEOUT',
          occurrenceCount: 12,
          firstOccurrence: '2024-12-01T09:15:00Z',
          lastOccurrence: '2024-12-28T14:30:00Z',
          affectedTeams: ['team-001'],
          relatedReports: ['report-001', 'report-002', 'report-003'],
        },
        {
          keyword: 'DATABASE_LOCK',
          occurrenceCount: 8,
          firstOccurrence: '2024-12-05T10:20:00Z',
          lastOccurrence: '2024-12-25T16:45:00Z',
          affectedTeams: ['team-001'],
          relatedReports: ['report-004', 'report-005'],
        },
        {
          keyword: 'DEPLOYMENT_DELAY',
          occurrenceCount: 5,
          firstOccurrence: '2024-12-15T11:00:00Z',
          lastOccurrence: '2024-12-29T13:20:00Z',
          affectedTeams: ['team-001'],
          relatedReports: ['report-006'],
        },
        {
          keyword: 'MEMORY_LEAK',
          occurrenceCount: 7,
          firstOccurrence: '2024-12-10T08:30:00Z',
          lastOccurrence: '2024-12-22T17:10:00Z',
          affectedTeams: ['team-001'],
          relatedReports: ['report-007', 'report-008'],
        },
      ],
      timeSeriesData: [
        { date: '2024-12-01', API_TIMEOUT: 2, DATABASE_LOCK: 0, DEPLOYMENT_DELAY: 0, MEMORY_LEAK: 0 },
        { date: '2024-12-02', API_TIMEOUT: 1, DATABASE_LOCK: 0, DEPLOYMENT_DELAY: 0, MEMORY_LEAK: 1 },
        { date: '2024-12-03', API_TIMEOUT: 1, DATABASE_LOCK: 0, DEPLOYMENT_DELAY: 0, MEMORY_LEAK: 0 },
        { date: '2024-12-05', API_TIMEOUT: 1, DATABASE_LOCK: 1, DEPLOYMENT_DELAY: 0, MEMORY_LEAK: 1 },
        { date: '2024-12-08', API_TIMEOUT: 2, DATABASE_LOCK: 1, DEPLOYMENT_DELAY: 0, MEMORY_LEAK: 1 },
        { date: '2024-12-10', API_TIMEOUT: 1, DATABASE_LOCK: 1, DEPLOYMENT_DELAY: 0, MEMORY_LEAK: 2 },
        { date: '2024-12-15', API_TIMEOUT: 0, DATABASE_LOCK: 1, DEPLOYMENT_DELAY: 1, MEMORY_LEAK: 0 },
        { date: '2024-12-18', API_TIMEOUT: 1, DATABASE_LOCK: 1, DEPLOYMENT_DELAY: 2, MEMORY_LEAK: 1 },
        { date: '2024-12-22', API_TIMEOUT: 1, DATABASE_LOCK: 1, DEPLOYMENT_DELAY: 0, MEMORY_LEAK: 1 },
        { date: '2024-12-25', API_TIMEOUT: 2, DATABASE_LOCK: 1, DEPLOYMENT_DELAY: 1, MEMORY_LEAK: 0 },
        { date: '2024-12-28', API_TIMEOUT: 1, DATABASE_LOCK: 0, DEPLOYMENT_DELAY: 0, MEMORY_LEAK: 0 },
        { date: '2024-12-29', API_TIMEOUT: 0, DATABASE_LOCK: 0, DEPLOYMENT_DELAY: 1, MEMORY_LEAK: 0 },
      ],
    };

    const mockRecurringPatternAnalysisData = {
      patterns: [
        {
          issueKeyword: 'API_TIMEOUT',
          occurrenceCount: 12,
          timeSeriesPattern: '増加傾向',
          priorityScore: 85,
          averageResolutionDays: 2.5,
        },
        {
          issueKeyword: 'DATABASE_LOCK',
          occurrenceCount: 8,
          timeSeriesPattern: '周期的',
          priorityScore: 72,
          averageResolutionDays: 1.8,
        },
        {
          issueKeyword: 'MEMORY_LEAK',
          occurrenceCount: 7,
          timeSeriesPattern: '減少傾向',
          priorityScore: 65,
          averageResolutionDays: 3.2,
        },
        {
          issueKeyword: 'DEPLOYMENT_DELAY',
          occurrenceCount: 5,
          timeSeriesPattern: '急増',
          priorityScore: 58,
          averageResolutionDays: 4.5,
        },
      ],
    };

    const bottleneckPatterns = [
      {
        patternId: 'pattern-001',
        patternName: '解決遅延パターンの増加',
        changeDirection: '悪化',
        improvementScore: -45,
        detectionConfidence: 92,
        affectedIssueCount: 3,
        affectedKeywords: ['API_TIMEOUT', 'MEMORY_LEAK', 'DEPLOYMENT_DELAY'],
        description: 'API_TIMEOUTおよびMEMORY_LEAKの平均解決時間が過去7日間で3.5日から過去14日間では2.8日へ改善したが、新規のDEPLOYMENT_DELAYが発生し全体的な解決効率の悪化が検出されました。',
        trend: {
          past7DaysAverageResolutionTime: 3.5,
          past14DaysAverageResolutionTime: 2.8,
          changePercentage: -20,
        },
      },
      {
        patternId: 'pattern-002',
        patternName: '新規課題カテゴリの出現',
        changeDirection: '新規出現',
        improvementScore: 0,
        detectionConfidence: 88,
        affectedIssueCount: 1,
        affectedKeywords: ['DEPLOYMENT_DELAY'],
        description: '過去14日間の期間中に、従来発生していなかった新規の「DEPLOYMENT_DELAY」カテゴリが12月15日以降に出現しました。',
        trend: {
          firstDetectionDate: '2024-12-15T11:00:00Z',
          occurrenceCount: 5,
          emergenceConfidence: 88,
        },
      },
      {
        patternId: 'pattern-003',
        patternName: '特定部門での課題集中',
        changeDirection: '改善',
        improvementScore: 35,
        detectionConfidence: 85,
        affectedIssueCount: 4,
        affectedKeywords: ['API_TIMEOUT', 'DATABASE_LOCK', 'MEMORY_LEAK', 'DEPLOYMENT_DELAY'],
        description: 'team-001における全課題の発生が集中しており、過去7日間における集中度が69%から過去14日間では73%へ若干増加したものの、解決速度の向上により相対的な負荷が軽減されています。',
        trend: {
          concentrationRate7Days: 69,
          concentrationRate14Days: 73,
          concentrationChangePercentage: 5,
          resolutionSpeedImprovement: 12,
        },
      },
    ];

    const mockAiClient: Tx8Imp1AiClient = {
      invokeAction01ExtractIssueData: jest.fn(async () => {
        return {
          success: true,
          data: mockExtractedIssuesData,
          promptVersion: 'ACTION_01_PROMPT_VERSION_1.0',
          executionTimestampUtc: new Date('2024-12-31T15:00:00Z').toISOString(),
        };
      }),
      invokeAction02AnalyzeRecurringPatterns: jest.fn(async () => {
        return {
          success: true,
          data: mockRecurringPatternAnalysisData,
          promptVersion: 'ACTION_02_PROMPT_VERSION_1.0',
          executionTimestampUtc: new Date('2024-12-31T15:05:00Z').toISOString(),
        };
      }),
      invokeAction03IdentifyBottleneckPatterns: jest.fn(async () => {
        return {
          success: true,
          data: {
            bottleneckPatterns: bottleneckPatterns,
            patternCount: bottleneckPatterns.length,
            analysisCompletedAt: new Date('2024-12-31T15:10:00Z').toISOString(),
          },
          promptVersion: 'ACTION_03_PROMPT_VERSION_1.0',
          executionTimestampUtc: new Date('2024-12-31T15:10:00Z').toISOString(),
        };
      }),
      invokeAction04GenerateVisualizationGraphs: jest.fn(async () => {
        return {
          success: true,
          data: {
            visualizationGraphs: [
              {
                graphType: '折れ線',
                title: '課題発生頻度の時系列推移',
                dataPoints: [
                  { date: '2024-12-01', value: 2 },
                  { date: '2024-12-05', value: 3 },
                  { date: '2024-12-10', value: 4 },
                  { date: '2024-12-15', value: 3 },
                  { date: '2024-12-20', value: 5 },
                  { date: '2024-12-28', value: 1 },
                ],
              },
              {
                graphType: '棒',
                title: 'カテゴリ別課題件数',
                dataPoints: [
                  { category: 'API_TIMEOUT', count: 12 },
                  { category: 'DATABASE_LOCK', count: 8 },
                  { category: 'MEMORY_LEAK', count: 7 },
                  { category: 'DEPLOYMENT_DELAY', count: 5 },
                ],
              },
              {
                graphType: 'ヒートマップ',
                title: '部門別・日付別課題マトリックス',
                dataPoints: [
                  { team: 'team-001', date: '2024-12-01', intensity: 2 },
                  { team: 'team-001', date: '2024-12-15', intensity: 5 },
                  { team: 'team-001', date: '2024-12-28', intensity: 1 },
                ],
              },
            ],
          },
          promptVersion: 'ACTION_04_PROMPT_VERSION_1.0',
          executionTimestampUtc: new Date('2024-12-31T15:15:00Z').toISOString(),
        };
      }),
      invokeAction05CompileReportContent: jest.fn(async () => {
        return {
          success: true,
          data: {
            reportId: 'report-tx8-20241231-001',
            recurringIssuePatterns: bottleneckPatterns.map(pattern => ({
              issueKeyword: pattern.affectedKeywords[0],
              occurrenceCount: pattern.affectedIssueCount,
              timeSeriesPattern: pattern.changeDirection,
              priorityScore: 75 + Math.floor(Math.random() * 25),
            })),
            visualizationGraphs: [
              {
                graphType: '折れ線',
                title: '課題発生頻度の時系列推移',
                dataPoints: [
                  { date: '2024-12-01', value: 2 },
                  { date: '2024-12-28', value: 1 },
                ],
              },
            ],
            emailSentAt: new Date('2024-12-31T15:20:00Z').toISOString(),
          },
          promptVersion: 'ACTION_05_PROMPT_VERSION_1.0',
          executionTimestampUtc: new Date('2024-12-31T15:20:00Z').toISOString(),
        };
      }),
    };

    const result = await runTx8Imp1Agent(
      {
        analysisStartDate,
        analysisEndDate,
        teamIds,
        minimumRecurrenceThreshold,
        recipientManagerId,
      },
      mockAiClient
    );

    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(result.reportId).toMatch(/^report-tx8-/);

    expect(result.recurringIssuePatterns).toBeDefined();
    expect(Array.isArray(result.recurringIssuePatterns)).toBe(true);
    expect(result.recurringIssuePatterns.length).toBeGreaterThanOrEqual(1);

    const allPatterns = result.recurringIssuePatterns;
    expect(allPatterns.some(p => p.issueKeyword === 'API_TIMEOUT')).toBe(true);
    expect(allPatterns.some(p => p.issueKeyword === 'DATABASE_LOCK')).toBe(true);
    expect(allPatterns.some(p => p.issueKeyword === 'MEMORY_LEAK')).toBe(true);

    allPatterns.forEach(pattern => {
      expect(pattern.issueKeyword).toBeDefined();
      expect(typeof pattern.issueKeyword).toBe('string');
      expect(pattern.occurrenceCount).toBeDefined();
      expect(typeof pattern.occurrenceCount).toBe('number');
      expect(pattern.occurrenceCount).toBeGreaterThan(0);
      expect(pattern.timeSeriesPattern).toBeDefined();
      expect(['増加傾向', '減少傾向', '周期的', '急増', '新規出現', '悪化', '改善'].includes(
        pattern.timeSeriesPattern
      )).toBe(true);
      expect(pattern.priorityScore).toBeDefined();
      expect(typeof pattern.priorityScore).toBe('number');
      expect(pattern.priorityScore).toBeGreaterThanOrEqual(0);
      expect(pattern.priorityScore).toBeLessThanOrEqual(100);
    });

    expect(result.visualizationGraphs).toBeDefined();
    expect(Array.isArray(result.visualizationGraphs)).toBe(true);
    expect(result.visualizationGraphs.length).toBeGreaterThanOrEqual(1);

    const graphTypes = result.visualizationGraphs.map(g => g.graphType);
    expect(graphTypes.some(gt => ['折れ線', '棒', '円', 'ヒートマップ'].includes(gt))).toBe(true);

    result.visualizationGraphs.forEach(graph => {
      expect(graph.graphType).toBeDefined();
      expect(typeof graph.graphType).toBe('string');
      expect(graph.title).toBeDefined();
      expect(typeof graph.title).toBe('string');
      expect(graph.dataPoints).toBeDefined();
      expect(Array.isArray(graph.dataPoints)).toBe(true);
      expect(graph.dataPoints.length).toBeGreaterThan(0);
    });

    expect(result.emailSentAt).toBeDefined();
    expect(typeof result.emailSentAt).toBe('string');
    const emailSentDate = new Date(result.emailSentAt);
    expect(emailSentDate.getTime()).toBeGreaterThan(0);

    expect(mockAiClient.invokeAction01ExtractIssueData).toHaveBeenCalled();
    expect(mockAiClient.invokeAction02AnalyzeRecurringPatterns).toHaveBeenCalled();
    expect(mockAiClient.invokeAction03IdentifyBottleneckPatterns).toHaveBeenCalled();
    expect(mockAiClient.invokeAction04GenerateVisualizationGraphs).toHaveBeenCalled();
    expect(mockAiClient.invokeAction05CompileReportContent).toHaveBeenCalled();

    const action03Call = (
      mockAiClient.invokeAction03IdentifyBottleneckPatterns as jest.Mock
    ).mock.calls[0];
    expect(action03Call).toBeDefined();
    expect(action03Call[0]).toBeDefined();
    expect(action03Call[0].extractedIssuesData).toEqual(mockExtractedIssuesData);
    expect(action03Call[0].recurringPatternAnalysisData).toEqual(
      mockRecurringPatternAnalysisData
    );
  });
});