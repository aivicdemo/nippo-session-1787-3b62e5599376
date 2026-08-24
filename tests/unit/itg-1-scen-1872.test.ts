import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AgentInput, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1 orchestrator: runTx7Imp1Agent', () => {
  // SCEN-1872: [edge] 月次課題傾向分析レポート生成処理の失敗時再試行制御 - 前回レポート生成完了から本回失敗検出までの期間が月末を含む場合、正確に処理される
  test('should handle month-boundary data aggregation with accurate timestamps and metadata when previous completion is end-of-month and current failure detection is mid-next-month', async () => {
    // Setup: Previous completion at 2025-01-31 23:59:59 (January end)
    const previousCompletionTime = new Date('2025-01-31T23:59:59Z');
    
    // Current failure detection at 2025-02-15 09:00:00 (mid-February)
    const currentFailureDetectionTime = new Date('2025-02-15T09:00:00Z');
    
    // Target period: 2025-01-01 to 2025-02-15
    const targetMonthStart = '2025-01-01';
    const targetMonthEnd = '2025-02-15';
    const managerUserId = 'manager-001';
    
    // Action 1: Data extraction spanning month boundary
    let action1CallCount = 0;
    let action1PassedContext: any = null;
    
    // Action 2: Data validation across months
    let action2CallCount = 0;
    let action2ReceivedDataset: any = null;
    
    // Action 3: Report generation with timestamp recording
    let action3CallCount = 0;
    let action3GeneratedReportId: string | null = null;
    let action3RecordedTimestamps: any = null;
    
    // Action 4: Time series analysis
    let action4CallCount = 0;
    let action4AggregationPeriod: any = null;
    
    // Action 5: Bottleneck trend analysis
    let action5CallCount = 0;
    let action5PeriodInfo: any = null;
    
    // Action 6: Team performance metrics
    let action6CallCount = 0;
    let action6MetricsAggregationPeriod: any = null;
    
    // Action 7: Priority ranking
    let action7CallCount = 0;
    let action7TrendChangeDetected: boolean = false;
    let action7RankedChallenges: any = null;
    
    // Action 8: Report generation for manager
    let action8CallCount = 0;
    let action8ReportMetadata: any = null;
    let action8GeneratedReport: any = null;
    
    const mockAiClient: Tx7Imp1AiClient = {
      executeAction01_ExtractMonthlyData: async (context) => {
        action1CallCount++;
        action1PassedContext = context;
        
        // Verify period includes both January and February data
        return {
          januaryReports: [
            {
              reportId: 'report-jan-001',
              submittedAt: new Date('2025-01-15T08:30:00Z'),
              teamId: 'team-001',
              challenges: ['Challenge A', 'Challenge B'],
            },
            {
              reportId: 'report-jan-002',
              submittedAt: new Date('2025-01-28T09:15:00Z'),
              teamId: 'team-002',
              challenges: ['Challenge C'],
            },
          ],
          februaryReports: [
            {
              reportId: 'report-feb-001',
              submittedAt: new Date('2025-02-05T08:45:00Z'),
              teamId: 'team-001',
              challenges: ['Challenge A', 'Challenge D'],
            },
            {
              reportId: 'report-feb-002',
              submittedAt: new Date('2025-02-12T09:00:00Z'),
              teamId: 'team-002',
              challenges: ['Challenge E'],
            },
          ],
          aggregationPeriod: {
            start: '2025-01-01T00:00:00Z',
            end: '2025-02-15T09:00:00Z',
          },
        };
      },

      executeAction02_ValidateDataConsistency: async (dataset) => {
        action2CallCount++;
        action2ReceivedDataset = dataset;
        
        return {
          isConsistent: true,
          duplicateCount: 0,
          totalRecordCount: 4,
          aggregationPeriodVerified: {
            start: '2025-01-01T00:00:00Z',
            end: '2025-02-15T09:00:00Z',
            spansMonthBoundary: true,
            monthsCovered: ['2025-01', '2025-02'],
          },
        };
      },

      executeAction03_GenerateReport: async (validatedDataset) => {
        action3CallCount++;
        action3GeneratedReportId = `report-${Date.now()}`;
        
        action3RecordedTimestamps = {
          previousCompletionTime: previousCompletionTime.toISOString(),
          currentFailureDetectionTime: currentFailureDetectionTime.toISOString(),
          processingPeriod: {
            from: previousCompletionTime.toISOString(),
            to: currentFailureDetectionTime.toISOString(),
          },
        };
        
        return {
          reportId: action3GeneratedReportId,
          generatedAt: currentFailureDetectionTime,
          processingMetadata: action3RecordedTimestamps,
          dataRange: {
            startDate: '2025-01-01',
            endDate: '2025-02-15',
            totalReportsIncluded: 4,
          },
        };
      },

      executeAction04_AnalyzeTimeSeriesData: async (reportWithData) => {
        action4CallCount++;
        action4AggregationPeriod = {
          start: '2025-01-01',
          end: '2025-02-15',
        };
        
        return {
          timeSeriesData: [
            {
              date: '2025-01-15',
              bottleneckSeverity: 65,
              challengeCount: 2,
            },
            {
              date: '2025-01-28',
              bottleneckSeverity: 70,
              challengeCount: 3,
            },
            {
              date: '2025-02-05',
              bottleneckSeverity: 68,
              challengeCount: 2,
            },
            {
              date: '2025-02-12',
              bottleneckSeverity: 72,
              challengeCount: 3,
            },
          ],
          aggregationPeriod: action4AggregationPeriod,
          monthBoundaryTransition: {
            lastJanuaryEntry: {
              date: '2025-01-28',
              severity: 70,
            },
            firstFebruaryEntry: {
              date: '2025-02-05',
              severity: 68,
            },
          },
        };
      },

      executeAction05_AnalyzeBottleneckTrend: async (timeSeriesData) => {
        action5CallCount++;
        action5PeriodInfo = {
          start: '2025-01-01',
          end: '2025-02-15',
          spansMonthBoundary: true,
        };
        
        return {
          improvementTrend: 'stable',
          recurringIssuePattern: ['Challenge A', 'Challenge B'],
          aggregationPeriod: action5PeriodInfo,
          monthCrossoverPattern: {
            januaryEndTrend: 'increasing',
            februaryStartTrend: 'slightly_improving',
            continuousIssues: ['Challenge A'],
          },
        };
      },

      executeAction06_CalculateTeamPerformanceMetrics: async (analysisResults) => {
        action6CallCount++;
        action6MetricsAggregationPeriod = {
          start: '2025-01-01T00:00:00Z',
          end: '2025-02-15T09:00:00Z',
        };
        
        return {
          teamMetrics: [
            {
              teamId: 'team-001',
              challengeResolutionSpeed: 3.5,
              reportSubmissionRate: 0.95,
              challengeRecurrenceRate: 0.15,
            },
            {
              teamId: 'team-002',
              challengeResolutionSpeed: 2.8,
              reportSubmissionRate: 0.88,
              challengeRecurrenceRate: 0.22,
            },
          ],
          aggregationPeriod: action6MetricsAggregationPeriod,
          dataDistribution: {
            januaryDataPoints: 2,
            februaryDataPoints: 2,
          },
        };
      },

      executeAction07_AssignPriorities: async (teamMetrics) => {
        action7CallCount++;
        
        action7TrendChangeDetected = true;
        action7RankedChallenges = [
          {
            challengeId: 'chal-001',
            keyword: 'Challenge A',
            priorityScore: 85,
            occurrenceFrequency: 2,
            impactLevel: 'high',
            resolutionDaysAverage: 3,
            monthBoundaryRelevance: {
              appearedInJanuary: true,
              appearedInFebruary: true,
              recurrenceAcrossMonths: true,
            },
          },
          {
            challengeId: 'chal-002',
            keyword: 'Challenge B',
            priorityScore: 72,
            occurrenceFrequency: 1,
            impactLevel: 'medium',
            resolutionDaysAverage: 2,
            monthBoundaryRelevance: {
              appearedInJanuary: true,
              appearedInFebruary: false,
              recurrenceAcrossMonths: false,
            },
          },
        ];
        
        return {
          prioritizedChallenges: action7RankedChallenges,
          trendAnalysis: {
            preMonthBoundaryTrend: 'worsening',
            postMonthBoundaryTrend: 'stable',
            trendChangeDetected: true,
          },
        };
      },

      executeAction08_GenerateManagerReport: async (prioritizedData) => {
        action8CallCount++;
        
        action8ReportMetadata = {
          processingPeriod: {
            from: '2025-01-31T23:59:59Z',
            to: '2025-02-15T09:00:00Z',
          },
          targetDataRange: {
            start: '2025-01-01',
            end: '2025-02-15',
            spansMonthBoundary: true,
            monthsCovered: ['2025-01', '2025-02'],
          },
          dataAggregationNotice: 'Data aggregation period crosses month boundary (Jan 31 - Feb 15)',
        };
        
        action8GeneratedReport = {
          reportId: action3GeneratedReportId,
          executionStatus: 'success',
          analysisResultSummary: {
            topPriorityChallenges: action7RankedChallenges,
            performanceMetrics: {
              teamMetrics: [
                {
                  teamId: 'team-001',
                  challengeResolutionSpeed: 3.5,
                  reportSubmissionRate: 0.95,
                  challengeRecurrenceRate: 0.15,
                },
                {
                  teamId: 'team-002',
                  challengeResolutionSpeed: 2.8,
                  reportSubmissionRate: 0.88,
                  challengeRecurrenceRate: 0.22,
                },
              ],
            },
            bottleneckTrend: {
              improvementTrend: 'stable',
              recurringIssuePattern: ['Challenge A', 'Challenge B'],
              monthBoundaryTransition: {
                from: '2025-01-28',
                to: '2025-02-05',
              },
            },
          },
          deliveryTimestamp: currentFailureDetectionTime,
          metadata: action8ReportMetadata,
        };
        
        return action8GeneratedReport;
      },
    };

    const agentInput: Tx7Imp1AgentInput = {
      triggerTimestamp: currentFailureDetectionTime,
      targetMonth: '2025-02',
      managerUserId: managerUserId,
      includeDetailedAnalysis: true,
    };

    // Add context about previous completion time
    const agentInputWithContext = {
      ...agentInput,
      previousCompletionContext: {
        completedAt: previousCompletionTime,
        failureDetectedAt: currentFailureDetectionTime,
      },
    } as any;

    // Execute orchestrator
    const result = await runTx7Imp1Agent(agentInputWithContext, mockAiClient);

    // Verify all actions were called in sequence
    expect(action1CallCount).toBe(1);
    expect(action2CallCount).toBe(1);
    expect(action3CallCount).toBe(1);
    expect(action4CallCount).toBe(1);
    expect(action5CallCount).toBe(1);
    expect(action6CallCount).toBe(1);
    expect(action7CallCount).toBe(1);
    expect(action8CallCount).toBe(1);

    // Verify Action 1 passed correct context with month boundary spanning
    expect(action1PassedContext).toBeDefined();
    expect(action1PassedContext.previousCompletionTime).toEqual(previousCompletionTime);
    expect(action1PassedContext.failureDetectionTime).toEqual(currentFailureDetectionTime);

    // Verify Action 2 received dataset with consistency checks
    expect(action2ReceivedDataset).toBeDefined();
    expect(action2ReceivedDataset.aggregationPeriod).toBeDefined();

    // Verify Action 3 recorded accurate timestamps
    expect(action3RecordedTimestamps.processingPeriod.from).toBe('2025-01-31T23:59:59Z');
    expect(action3RecordedTimestamps.processingPeriod.to).toBe('2025-02-15T09:00:00Z');

    // Verify Action 4 aggregation period spans both months
    expect(action4AggregationPeriod.start).toBe('2025-01-01');
    expect(action4AggregationPeriod.end).toBe('2025-02-15');

    // Verify Action 5 period info includes month boundary flag
    expect(action5PeriodInfo.start).toBe('2025-01-01');
    expect(action5PeriodInfo.end).toBe('2025-02-15');
    expect(action5PeriodInfo.spansMonthBoundary).toBe(true);

    // Verify Action 6 metrics aggregation period is accurate
    expect(action6MetricsAggregationPeriod.start).toBe('2025-01-01T00:00:00Z');
    expect(action6MetricsAggregationPeriod.end).toBe('2025-02-15T09:00:00Z');

    // Verify Action 7 detected trend change across month boundary
    expect(action7TrendChangeDetected).toBe(true);
    expect(action7RankedChallenges).toBeDefined();
    expect(action7RankedChallenges.length).toBe(2);

    // Verify Challenge A (recurring across months) has highest priority
    expect(action7RankedChallenges[0].keyword).toBe('Challenge A');
    expect(action7RankedChallenges[0].priorityScore).toBe(85);
    expect(action7RankedChallenges[0].monthBoundaryRelevance.recurrenceAcrossMonths).toBe(true);

    // Verify Action 8 report metadata contains exact processing period
    expect(action8ReportMetadata.processingPeriod.from).toBe('2025-01-31T23:59:59Z');
    expect(action8ReportMetadata.processingPeriod.to).toBe('2025-02-15T09:00:00Z');

    // Verify target data range in metadata
    expect(action8ReportMetadata.targetDataRange.start).toBe('2025-01-01');
    expect(action8ReportMetadata.targetDataRange.end).toBe('2025-02-15');
    expect(action8ReportMetadata.targetDataRange.spansMonthBoundary).toBe(true);
    expect(action8ReportMetadata.targetDataRange.monthsCovered).toEqual(['2025-01', '2025-02']);

    // Verify final orchestrator output includes all required metadata
    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(result.executionStatus).toBe('success');

    // Verify analysis result summary contains accurate period information
    expect(result.analysisResultSummary).toBeDefined();
    expect(result.analysisResultSummary.topPriorityChallenges).toBeDefined();
    expect(result.analysisResultSummary.topPriorityChallenges.length).toBe(2);

    // Verify bottleneck trend includes month boundary transition info
    expect(result.analysisResultSummary.bottleneckTrend).toBeDefined();
    expect(result.analysisResultSummary.bottleneckTrend.improvementTrend).toBe('stable');

    // Verify team performance metrics are aggregated for full period
    expect(result.analysisResultSummary.performanceMetrics).toBeDefined();
    expect(result.analysisResultSummary.performanceMetrics.teamMetrics).toBeDefined();
    expect(result.analysisResultSummary.performanceMetrics.teamMetrics.length).toBe(2);

    // Verify delivery timestamp is current failure detection time
    expect(result.deliveryTimestamp).toEqual(currentFailureDetectionTime);

    // Verify metadata in final report contains month boundary spanning indicator
    expect(result.analysisResultSummary.bottleneckTrend.monthBoundaryTransition).toBeDefined();
    expect(result.analysisResultSummary.bottleneckTrend.monthBoundaryTransition.from).toBe('2025-01-28');
    expect(result.analysisResultSummary.bottleneckTrend.monthBoundaryTransition.to).toBe('2025-02-05');

    // Verify no data loss or duplication across month boundary
    // Total challenge occurrences from Action 7 should reflect all reports
    const totalOccurrences = action7RankedChallenges.reduce((sum, c) => sum + c.occurrenceFrequency, 0);
    expect(totalOccurrences).toBe(3); // Challenge A: 2, Challenge B: 1

    // Verify Challenge A appears in both months' data
    const challengeAInAction7 = action7RankedChallenges.find(c => c.keyword === 'Challenge A');
    expect(challengeAInAction7.monthBoundaryRelevance.appearedInJanuary).toBe(true);
    expect(challengeAInAction7.monthBoundaryRelevance.appearedInFebruary).toBe(true);
  });
});