import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import { buildAction05Prompt, ACTION_05_PROMPT_VERSION } from '../../src/agents/tx-7-imp-1/prompts/action-05';
import type { Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1: 月次レポート生成から分析完了までの自動実行', () => {
  test('SCEN-129: Action 5 ボトルネック推移を特定する - 正常系での実行と次アクション遷移', async () => {
    const targetMonth = '2024-01';
    const teamId = 'team-001';
    const triggeredBy = 'schedule' as const;

    const bottleneckTimelineData = [
      {
        week: 1,
        primaryBottleneck: '課題A',
        affectedTeams: ['チームX'],
        impactScore: 8.5,
      },
      {
        week: 2,
        primaryBottleneck: '課題A',
        affectedTeams: ['チームX', 'チームY'],
        impactScore: 9.2,
      },
      {
        week: 3,
        primaryBottleneck: '課題B',
        affectedTeams: ['チームY'],
        impactScore: 7.1,
      },
    ];

    const action05Response = {
      bottleneckTimeline: bottleneckTimelineData,
      transitionAnalysis:
        'Week1-2で課題Aが拡大、Week3で課題Bへ移行',
    };

    const action04Output = {
      timeSeriesData: [
        { date: '2024-01-01', issueCount: 5, resolvedCount: 2 },
        { date: '2024-01-08', issueCount: 7, resolvedCount: 3 },
        { date: '2024-01-15', issueCount: 6, resolvedCount: 4 },
      ],
    };

    const mockAiClient: Tx7Imp1AiClient = {
      action01_collectMonthlyData: jest
        .fn()
        .mockResolvedValue({
          totalReportsSubmitted: 120,
          totalReportsExpected: 130,
          unsubmittedMembers: ['member-001'],
        }),

      action02_extractAndClassifyIssues: jest
        .fn()
        .mockResolvedValue({
          issues: [
            { id: 'issue-001', category: 'category-A', priority: 'high' },
          ],
        }),

      action03_analyzeTimeSeriesChange: jest
        .fn()
        .mockResolvedValue(action04Output),

      action04_calculatePriorityScores: jest
        .fn()
        .mockResolvedValue({
          scoredIssues: [
            { issueId: 'issue-001', priorityScore: 8.5 },
          ],
        }),

      action05_identifyBottleneckTrend: jest
        .fn()
        .mockResolvedValue(action05Response),

      action06_calculateTeamMetrics: jest
        .fn()
        .mockResolvedValue({
          teamMetrics: [
            {
              teamId: 'team-001',
              issueResolutionSpeed: 2.5,
              reportSubmissionRate: 0.923,
            },
          ],
        }),

      action07_generateAnalysisReport: jest
        .fn()
        .mockResolvedValue({
          reportId: 'report-001',
          generatedAt: new Date('2024-01-31T15:00:00Z'),
          status: 'success',
        }),

      action08_distributeReport: jest
        .fn()
        .mockResolvedValue({
          emailsSent: ['director@example.com'],
          distributionStatus: 'completed',
        }),
    };

    const result = await runTx7Imp1Agent(
      { targetMonth, teamId, triggeredBy },
      mockAiClient,
    );

    expect(mockAiClient.action05_identifyBottleneckTrend).toHaveBeenCalled();

    const action05Call = (mockAiClient.action05_identifyBottleneckTrend as jest.Mock).mock.calls[0];
    expect(action05Call).toBeDefined();
    const action05Prompt = action05Call[0];
    expect(typeof action05Prompt).toBe('string');
    expect(action05Prompt.length).toBeGreaterThan(0);

    expect(buildAction05Prompt).toBeDefined();
    expect(typeof buildAction05Prompt).toBe('function');
    expect(ACTION_05_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_05_PROMPT_VERSION).toBe('string');

    const generatedPrompt = buildAction05Prompt(targetMonth, [action04Output]);
    expect(typeof generatedPrompt).toBe('string');
    expect(generatedPrompt.length).toBeGreaterThan(0);

    expect(action05Response.bottleneckTimeline).toHaveLength(3);

    const week1 = action05Response.bottleneckTimeline[0];
    expect(week1.week).toBe(1);
    expect(week1.primaryBottleneck).toBe('課題A');
    expect(week1.impactScore).toBe(8.5);

    const week2 = action05Response.bottleneckTimeline[1];
    expect(week2.week).toBe(2);
    expect(week2.primaryBottleneck).toBe('課題A');
    expect(week2.impactScore).toBe(9.2);

    const week3 = action05Response.bottleneckTimeline[2];
    expect(week3.week).toBe(3);
    expect(week3.primaryBottleneck).toBe('課題B');
    expect(week3.impactScore).toBe(7.1);

    const averageBaselineScore = 6.0;
    const maxThreshold = averageBaselineScore * 1.3;
    const minThreshold = averageBaselineScore * 0.7;

    for (const item of action05Response.bottleneckTimeline) {
      expect(item.impactScore).toBeLessThanOrEqual(maxThreshold);
      expect(item.impactScore).toBeGreaterThanOrEqual(minThreshold);
    }

    expect(action05Response.transitionAnalysis).toBeDefined();
    expect(action05Response.transitionAnalysis.length).toBeGreaterThan(0);

    expect(mockAiClient.action06_calculateTeamMetrics).toHaveBeenCalled();

    expect(
      (mockAiClient.action05_identifyBottleneckTrend as jest.Mock).mock
        .invocationCallOrder[0],
    ).toBeLessThan(
      (mockAiClient.action06_calculateTeamMetrics as jest.Mock).mock
        .invocationCallOrder[0],
    );

    expect(result).toBeDefined();
    expect(result.status).toBe('success');
  });
});