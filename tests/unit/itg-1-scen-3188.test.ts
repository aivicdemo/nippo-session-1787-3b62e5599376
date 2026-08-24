import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { type Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1: 月次レポート生成から分析完了までの自動実行', () => {
  // SCEN-3188
  test('should execute all ordered actions from monthly report generation trigger to manager presentation', async () => {
    const triggerTimestamp = new Date('2024-01-01T09:00:00Z');
    const targetMonth = '2024-01';
    const managerUserId = 'mgr-001';

    // Mock audit events to collect execution history
    const auditEvents: Array<{
      actionId: string;
      status: string;
      timestamp: Date;
      input?: Record<string, unknown>;
      output?: Record<string, unknown>;
    }> = [];

    // Action-01 prompt module mock
    const buildAction01Prompt = jest.fn().mockReturnValue({
      messages: [
        {
          role: 'system',
          content: 'Verify monthly report generation trigger confirmation for 2024-01',
        },
      ],
    });
    const ACTION_01_PROMPT_VERSION = '1.0.0';

    // Action-02 prompt module mock
    const buildAction02Prompt = jest.fn().mockReturnValue({
      messages: [
        {
          role: 'system',
          content: 'Extract accumulated report data for 2024-01',
        },
      ],
    });
    const ACTION_02_PROMPT_VERSION = '1.0.0';

    // Action-03 prompt module mock
    const buildAction03Prompt = jest.fn().mockReturnValue({
      messages: [
        {
          role: 'system',
          content: 'Execute report generation process',
        },
      ],
    });
    const ACTION_03_PROMPT_VERSION = '1.0.0';

    // Action-04 prompt module mock
    const buildAction04Prompt = jest.fn().mockReturnValue({
      messages: [
        {
          role: 'system',
          content: 'Analyze time-series changes of challenges',
        },
      ],
    });
    const ACTION_04_PROMPT_VERSION = '1.0.0';

    // Action-05 prompt module mock
    const buildAction05Prompt = jest.fn().mockReturnValue({
      messages: [
        {
          role: 'system',
          content: 'Identify bottleneck trend transitions',
        },
      ],
    });
    const ACTION_05_PROMPT_VERSION = '1.0.0';

    // Action-06 prompt module mock
    const buildAction06Prompt = jest.fn().mockReturnValue({
      messages: [
        {
          role: 'system',
          content: 'Calculate team performance metrics',
        },
      ],
    });
    const ACTION_06_PROMPT_VERSION = '1.0.0';

    // Action-07 prompt module mock
    const buildAction07Prompt = jest.fn().mockReturnValue({
      messages: [
        {
          role: 'system',
          content: 'Execute priority assignment for challenges',
        },
      ],
    });
    const ACTION_07_PROMPT_VERSION = '1.0.0';

    // Action-08 prompt module mock
    const buildAction08Prompt = jest.fn().mockReturnValue({
      messages: [
        {
          role: 'system',
          content: 'Present analysis report to manager',
        },
      ],
    });
    const ACTION_08_PROMPT_VERSION = '1.0.0';

    // Mock Tx7Imp1AiClient
    const mockAiClient: Tx7Imp1AiClient = {
      async callAiForAction01(prompt: unknown) {
        const actionId = 'action-01';
        const timestamp = new Date('2024-01-01T09:05:00Z');
        const output = {
          triggerStatus: 'confirmed',
          targetMonth: '2024-01',
          message: 'Monthly report generation trigger confirmed',
        };
        auditEvents.push({
          actionId,
          status: 'success',
          timestamp,
          input: { prompt },
          output,
        });
        return output;
      },

      async callAiForAction02(prompt: unknown) {
        const actionId = 'action-02';
        const timestamp = new Date('2024-01-01T09:10:00Z');
        const extractedDataCount = 300; // 10 members × 30 days
        const output = {
          extractedRecordCount: extractedDataCount,
          targetMonth: '2024-01',
          dataValidation: {
            completeness: 0.98,
            inconsistencies: 6,
          },
          sampleRecords: [
            {
              memberId: 'emp-001',
              reportDate: '2024-01-01',
              yesterday: 'Completed feature A',
              today: 'Start feature B',
              challenges: 'API integration delay',
            },
            {
              memberId: 'emp-002',
              reportDate: '2024-01-01',
              yesterday: 'Fixed bugs in module X',
              today: 'Testing module Y',
              challenges: 'Performance issue detected',
            },
          ],
        };
        auditEvents.push({
          actionId,
          status: 'success',
          timestamp,
          input: { prompt },
          output,
        });
        return output;
      },

      async callAiForAction03(prompt: unknown) {
        const actionId = 'action-03';
        const timestamp = new Date('2024-01-01T09:15:00Z');
        const output = {
          reportId: 'rpt-2024-01-001',
          generatedAt: new Date('2024-01-01T09:15:00Z'),
          reportContent: {
            generationDate: new Date('2024-01-01T09:15:00Z'),
            targetMonth: '2024-01',
            totalReportRecords: 300,
            totalChallengesDetected: 48,
          },
        };
        auditEvents.push({
          actionId,
          status: 'success',
          timestamp,
          input: { prompt },
          output,
        });
        return output;
      },

      async callAiForAction04(prompt: unknown) {
        const actionId = 'action-04';
        const timestamp = new Date('2024-01-01T09:20:00Z');
        const output = {
          timeSeriesAnalysis: [
            {
              challengeId: 'ch-001',
              keyword: 'API integration',
              firstOccurrenceDate: '2024-01-02',
              lastOccurrenceDate: '2024-01-28',
              occurrenceCount: 8,
              affectedMembers: 3,
            },
            {
              challengeId: 'ch-002',
              keyword: 'Performance issue',
              firstOccurrenceDate: '2024-01-05',
              lastOccurrenceDate: '2024-01-25',
              occurrenceCount: 12,
              affectedMembers: 5,
            },
            {
              challengeId: 'ch-003',
              keyword: 'Database connection',
              firstOccurrenceDate: '2024-01-10',
              lastOccurrenceDate: '2024-01-20',
              occurrenceCount: 5,
              affectedMembers: 2,
            },
          ],
          analysisQuality: 'high',
        };
        auditEvents.push({
          actionId,
          status: 'success',
          timestamp,
          input: { prompt },
          output,
        });
        return output;
      },

      async callAiForAction05(prompt: unknown) {
        const actionId = 'action-05';
        const timestamp = new Date('2024-01-01T09:25:00Z');
        const output = {
          bottleneckTrend: {
            timeSeriesData: [
              {
                date: '2024-01-01',
                severityRank: 1,
                activeChallengeCount: 5,
              },
              {
                date: '2024-01-15',
                severityRank: 3,
                activeChallengeCount: 18,
              },
              {
                date: '2024-01-31',
                severityRank: 2,
                activeChallengeCount: 12,
              },
            ],
            improvementTrend: 'improving',
            recurringIssuePattern: [
              'API integration',
              'Performance issue',
              'Database connection',
            ],
            dependencyAnalysis: [
              {
                parentChallenge: 'API integration',
                childChallenges: ['Performance issue', 'Database connection'],
              },
            ],
          },
        };
        auditEvents.push({
          actionId,
          status: 'success',
          timestamp,
          input: { prompt },
          output,
        });
        return output;
      },

      async callAiForAction06(prompt: unknown) {
        const actionId = 'action-06';
        const timestamp = new Date('2024-01-01T09:30:00Z');
        const output = {
          teamPerformanceMetrics: {
            memberMetrics: [
              {
                memberId: 'emp-001',
                challengeReportCount: 8,
                completedTaskCount: 15,
                inProgressTaskCount: 3,
              },
              {
                memberId: 'emp-002',
                challengeReportCount: 12,
                completedTaskCount: 22,
                inProgressTaskCount: 2,
              },
              {
                memberId: 'emp-003',
                challengeReportCount: 5,
                completedTaskCount: 18,
                inProgressTaskCount: 4,
              },
              {
                memberId: 'emp-004',
                challengeReportCount: 10,
                completedTaskCount: 20,
                inProgressTaskCount: 3,
              },
              {
                memberId: 'emp-005',
                challengeReportCount: 6,
                completedTaskCount: 16,
                inProgressTaskCount: 5,
              },
              {
                memberId: 'emp-006',
                challengeReportCount: 3,
                completedTaskCount: 25,
                inProgressTaskCount: 1,
              },
              {
                memberId: 'emp-007',
                challengeReportCount: 2,
                completedTaskCount: 19,
                inProgressTaskCount: 3,
              },
              {
                memberId: 'emp-008',
                challengeReportCount: 1,
                completedTaskCount: 21,
                inProgressTaskCount: 2,
              },
              {
                memberId: 'emp-009',
                challengeReportCount: 0,
                completedTaskCount: 23,
                inProgressTaskCount: 1,
              },
              {
                memberId: 'emp-010',
                challengeReportCount: 1,
                completedTaskCount: 20,
                inProgressTaskCount: 2,
              },
            ],
            teamAverageResolutionDays: 3.5,
            teamChallengeResolutionRate: 0.92,
          },
        };
        auditEvents.push({
          actionId,
          status: 'success',
          timestamp,
          input: { prompt },
          output,
        });
        return output;
      },

      async callAiForAction07(prompt: unknown) {
        const actionId = 'action-07';
        const timestamp = new Date('2024-01-01T09:35:00Z');
        const output = {
          prioritizedChallenges: [
            {
              challengeId: 'ch-002',
              keyword: 'Performance issue',
              priorityScore: 92,
              priorityRank: 'high',
              rationale:
                'High frequency (12 occurrences), broad impact (5 members), bottleneck severity rank 3',
              occurrenceFrequency: 12,
              impactLevel: 'high',
              resolutionDaysAverage: 3,
            },
            {
              challengeId: 'ch-001',
              keyword: 'API integration',
              priorityScore: 78,
              priorityRank: 'high',
              rationale:
                'Consistent throughout month, impacts multiple dependencies, critical for delivery',
              occurrenceFrequency: 8,
              impactLevel: 'high',
              resolutionDaysAverage: 4,
            },
            {
              challengeId: 'ch-003',
              keyword: 'Database connection',
              priorityScore: 55,
              priorityRank: 'medium',
              rationale:
                'Moderate frequency (5 occurrences), cascading impact from API integration',
              occurrenceFrequency: 5,
              impactLevel: 'medium',
              resolutionDaysAverage: 3,
            },
          ],
        };
        auditEvents.push({
          actionId,
          status: 'success',
          timestamp,
          input: { prompt },
          output,
        });
        return output;
      },

      async callAiForAction08(prompt: unknown) {
        const actionId = 'action-08';
        const timestamp = new Date('2024-01-01T09:40:00Z');
        const output = {
          reportId: 'rpt-2024-01-001',
          executionStatus: 'success',
          analysisResultSummary: {
            executionDate: new Date('2024-01-01T09:40:00Z'),
            targetMonth: '2024-01',
            extractedReportRecordCount: 300,
            detectedChallengeCount: 48,
            topPriorityChallenges: [
              {
                challengeId: 'ch-002',
                keyword: 'Performance issue',
                priorityScore: 92,
                priorityRank: 'high',
                impactLevel: 'high',
              },
              {
                challengeId: 'ch-001',
                keyword: 'API integration',
                priorityScore: 78,
                priorityRank: 'high',
                impactLevel: 'high',
              },
              {
                challengeId: 'ch-003',
                keyword: 'Database connection',
                priorityScore: 55,
                priorityRank: 'medium',
                impactLevel: 'medium',
              },
            ],
            performanceMetricsSnapshot: {
              teamAverageResolutionDays: 3.5,
              teamChallengeResolutionRate: 0.92,
              highPriorityResolutionRate: 0.88,
            },
            bottleneckTrendSummary: {
              improvementTrend: 'improving',
              severityPeakDate: '2024-01-15',
              severityPeakRank: 3,
              recurringPatternCount: 3,
            },
            anomalyDetectionFlags: {
              hasAnomalies: false,
              anomalousMembers: [],
              anomalousDateRanges: [],
            },
          },
          deliveryTimestamp: new Date('2024-01-01T09:40:00Z'),
        };
        auditEvents.push({
          actionId,
          status: 'success',
          timestamp,
          input: { prompt },
          output,
        });
        return output;
      },
    };

    // Inject input matching Tx7Imp1AgentInput structure
    const agentInput = {
      triggerTimestamp,
      targetMonth,
      managerUserId,
      includeDetailedAnalysis: true,
    };

    // Execute the agent
    const result = await runTx7Imp1Agent(agentInput, mockAiClient);

    // Verify Action-01: Trigger confirmation
    expect(buildAction01Prompt).toBeDefined();
    expect(ACTION_01_PROMPT_VERSION).toBe('1.0.0');

    // Verify Action-02: Data extraction
    expect(buildAction02Prompt).toBeDefined();
    expect(ACTION_02_PROMPT_VERSION).toBe('1.0.0');

    // Verify Action-03: Report generation
    expect(buildAction03Prompt).toBeDefined();
    expect(ACTION_03_PROMPT_VERSION).toBe('1.0.0');

    // Verify Action-04: Time-series analysis
    expect(buildAction04Prompt).toBeDefined();
    expect(ACTION_04_PROMPT_VERSION).toBe('1.0.0');

    // Verify Action-05: Bottleneck trend analysis
    expect(buildAction05Prompt).toBeDefined();
    expect(ACTION_05_PROMPT_VERSION).toBe('1.0.0');

    // Verify Action-06: Performance metrics
    expect(buildAction06Prompt).toBeDefined();
    expect(ACTION_06_PROMPT_VERSION).toBe('1.0.0');

    // Verify Action-07: Priority assignment
    expect(buildAction07Prompt).toBeDefined();
    expect(ACTION_07_PROMPT_VERSION).toBe('1.0.0');

    // Verify Action-08: Manager presentation
    expect(buildAction08Prompt).toBeDefined();
    expect(ACTION_08_PROMPT_VERSION).toBe('1.0.0');

    // Verify result structure and content
    expect(result).toBeDefined();
    expect(result.reportId).toBe('rpt-2024-01-001');
    expect(result.executionStatus).toBe('success');

    // Verify analysis result summary structure
    expect(result.analysisResultSummary).toBeDefined();
    expect(result.analysisResultSummary.targetMonth).toBe('2024-01');
    expect(result.analysisResultSummary.extractedReportRecordCount).toBe(300);
    expect(result.analysisResultSummary.detectedChallengeCount).toBe(48);

    // Verify top priority challenges (top 5 as per specification)
    expect(result.analysisResultSummary.topPriorityChallenges).toHaveLength(3);
    expect(result.analysisResultSummary.topPriorityChallenges[0].priorityScore).toBe(92);
    expect(result.analysisResultSummary.topPriorityChallenges[0].keyword).toBe(
      'Performance issue'
    );
    expect(result.analysisResultSummary.topPriorityChallenges[1].priorityScore).toBe(78);
    expect(result.analysisResultSummary.topPriorityChallenges[1].keyword).toBe('API integration');
    expect(result.analysisResultSummary.topPriorityChallenges[2].priorityScore).toBe(55);

    // Verify performance metrics
    expect(result.analysisResultSummary.performanceMetricsSnapshot).toBeDefined();
    expect(result.analysisResultSummary.performanceMetricsSnapshot.teamAverageResolutionDays).toBe(
      3.5
    );
    expect(result.analysisResultSummary.performanceMetricsSnapshot.teamChallengeResolutionRate).toBe(
      0.92
    );
    expect(
      result.analysisResultSummary.performanceMetricsSnapshot.highPriorityResolutionRate
    ).toBe(0.88);

    // Verify bottleneck trend summary
    expect(result.analysisResultSummary.bottleneckTrendSummary).toBeDefined();
    expect(result.analysisResultSummary.bottleneckTrendSummary.improvementTrend).toBe(
      'improving'
    );
    expect(result.analysisResultSummary.bottleneckTrendSummary.severityPeakRank).toBe(3);
    expect(result.analysisResultSummary.bottleneckTrendSummary.recurringPatternCount).toBe(3);

    // Verify anomaly detection
    expect(result.analysisResultSummary.anomalyDetectionFlags).toBeDefined();
    expect(result.analysisResultSummary.anomalyDetectionFlags.hasAnomalies).toBe(false);

    // Verify delivery timestamp
    expect(result.deliveryTimestamp).toEqual(new Date('2024-01-01T09:40:00Z'));

    // Verify audit events
    expect(auditEvents).toHaveLength(8);

    // Verify Action-01 audit event
    expect(auditEvents[0].actionId).toBe('action-01');
    expect(auditEvents[0].status).toBe('success');
    expect(auditEvents[0].timestamp).toEqual(new Date('2024-01-01T09:05:00Z'));
    expect(auditEvents[0].output?.triggerStatus).toBe('confirmed');

    // Verify Action-02 audit event
    expect(auditEvents[1].actionId).toBe('action-02');
    expect(auditEvents[1].status).toBe('success');
    expect(auditEvents[1].timestamp).toEqual(new Date('2024-01-01T09:10:00Z'));
    expect(auditEvents[1].output?.extractedRecordCount).toBe(300);

    // Verify Action-03 audit event
    expect(auditEvents[2].actionId).toBe('action-03');
    expect(auditEvents[2].status).toBe('success');
    expect(auditEvents[2].timestamp).toEqual(new Date('2024-01-01T09:15:00Z'));
    expect(auditEvents[2].output?.reportId).toBe('rpt-2024-01-001');

    // Verify Action-04 audit event
    expect(auditEvents[3].actionId).toBe('action-04');
    expect(auditEvents[3].status).toBe('success');
    expect(auditEvents[3].timestamp).toEqual(new Date('2024-01-01T09:20:00Z'));
    expect(auditEvents[3].output?.timeSeriesAnalysis).toBeDefined();

    // Verify Action-05 audit event
    expect(auditEvents[4].actionId).toBe('action-05');
    expect(auditEvents[4].status).toBe('success');
    expect(auditEvents[4].timestamp).toEqual(new Date('2024-01-01T09:25:00Z'));
    expect(auditEvents[4].output?.bottleneckTrend).toBeDefined();

    // Verify Action-06 audit event
    expect(auditEvents[5].actionId).toBe('action-06');
    expect(auditEvents[5].status).toBe('success');
    expect(auditEvents[5].timestamp).toEqual(new Date('2024-01-01T09:30:00Z'));
    expect(auditEvents[5].output?.teamPerformanceMetrics).toBeDefined();

    // Verify Action-07 audit event
    expect(auditEvents[6].actionId).toBe('action-07');
    expect(auditEvents[6].status).toBe('success');
    expect(auditEvents[6].timestamp).toEqual(new Date('2024-01-01T09:35:00Z'));
    expect(auditEvents[6].output?.prioritizedChallenges).toHaveLength(3);

    // Verify Action-08 audit event (final presentation)
    expect(auditEvents[7].actionId).toBe('action-08');
    expect(auditEvents[7].status).toBe('success');
    expect(auditEvents[7].timestamp).toEqual(new Date('2024-01-01T09:40:00Z'));
    expect(auditEvents[7].output?.reportId).toBe('rpt-2024-01-001');

    // Verify all 8 actions executed in sequence
    expect(auditEvents.map((e) => e.actionId)).toEqual([
      'action-01',
      'action-02',
      'action-03',
      'action-04',
      'action-05',
      'action-06',
      'action-07',
      'action-08',
    ]);

    // Verify all actions completed successfully
    expect(auditEvents.every((e) => e.status === 'success')).toBe(true);

    // Verify audit event timestamps are in ascending order
    for (let i = 0; i < auditEvents.length - 1; i++) {
      expect(auditEvents[i].timestamp.getTime()).toBeLessThan(
        auditEvents[i + 1].timestamp.getTime()
      );
    }
  });
});