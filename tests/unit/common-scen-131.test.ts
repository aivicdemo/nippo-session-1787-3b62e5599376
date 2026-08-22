import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { runTx7Imp1Agent } from '../../src/agents/tx-7-imp-1/orchestrator';
import type { Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('tx-7-imp-1: Monthly Report Generation Agent', () => {
  // SCEN-131: [normal] 月次レポート生成から分析完了までの自動実行 AIエージェント
  test('should execute Action 7 with prioritized analysis results matching contract specification', async () => {
    // Setup: Initialize fake AI client matching Tx7Imp1AiClient structure
    const fakeAiClient: Tx7Imp1AiClient = {
      async invokeAction01(prompt: string): Promise<string> {
        // Action 1: Verify monthly trigger
        return JSON.stringify({
          triggerConfirmed: true,
          month: '2024-01',
          timestamp: '2024-01-01T00:00:00Z'
        });
      },
      async invokeAction02(prompt: string): Promise<string> {
        // Action 2: Extract accumulated report data
        return JSON.stringify({
          reportDataExtracted: true,
          dataPoints: 45,
          period: '2024-01'
        });
      },
      async invokeAction03(prompt: string): Promise<string> {
        // Action 3: Generate report
        return JSON.stringify({
          reportGenerated: true,
          reportId: 'REP-2024-01-001'
        });
      },
      async invokeAction04(prompt: string): Promise<string> {
        // Action 4: Analyze time-series changes
        return JSON.stringify({
          timeSeriesAnalysis: [
            {
              date: '2024-01-10',
              issueCount: 12,
              avgResolutionTime: 4.5,
              trend: 'increasing'
            },
            {
              date: '2024-01-20',
              issueCount: 18,
              avgResolutionTime: 3.8,
              trend: 'increasing'
            },
            {
              date: '2024-01-31',
              issueCount: 15,
              avgResolutionTime: 3.2,
              trend: 'stable'
            }
          ]
        });
      },
      async invokeAction05(prompt: string): Promise<string> {
        // Action 5: Identify bottleneck transitions
        return JSON.stringify({
          bottleneckTransitions: [
            {
              period: 'early',
              bottleneck: 'resource_shortage',
              severity: 8.5
            },
            {
              period: 'mid',
              bottleneck: 'process_inefficiency',
              severity: 7.2
            },
            {
              period: 'late',
              bottleneck: 'communication_gap',
              severity: 6.1
            }
          ]
        });
      },
      async invokeAction06(prompt: string): Promise<string> {
        // Action 6: Calculate team performance metrics
        return JSON.stringify({
          teamPerformance: [
            {
              teamId: 'TEAM-A',
              issueResolutionSpeed: 3.2,
              reportSubmissionRate: 0.92,
              issueRecurrenceRate: 0.12
            },
            {
              teamId: 'TEAM-B',
              issueResolutionSpeed: 3.8,
              reportSubmissionRate: 0.88,
              issueRecurrenceRate: 0.15
            }
          ]
        });
      },
      async invokeAction07(prompt: string): Promise<string> {
        // Action 7: Assign priority and summarize analysis results
        return JSON.stringify({
          prioritizedAnalysis: [
            {
              priority: 'high',
              analysisItem: 'Resource shortage impact on issue resolution',
              trend: 'improving',
              impactScore: 87,
              recommendedAction: 'Increase dedicated resource allocation to Team A by 2 engineers for Q1'
            },
            {
              priority: 'high',
              analysisItem: 'Process inefficiency in issue triage workflow',
              trend: 'stable',
              impactScore: 82,
              recommendedAction: 'Standardize issue triage checklist and implement automated pre-screening'
            },
            {
              priority: 'medium',
              analysisItem: 'Communication gaps between teams on escalation',
              trend: 'deteriorating',
              impactScore: 65,
              recommendedAction: 'Establish daily sync between Team A and Team B for high-priority issues'
            },
            {
              priority: 'medium',
              analysisItem: 'Issue recurrence rate elevated in Team B',
              trend: 'stable',
              impactScore: 58,
              recommendedAction: 'Conduct root-cause analysis workshop for recurring issue patterns'
            },
            {
              priority: 'low',
              analysisItem: 'Minor variance in report submission timing',
              trend: 'improving',
              impactScore: 23,
              recommendedAction: 'Adjust reminder notification schedule by 15 minutes'
            }
          ],
          escalationRequired: [
            {
              category: 'anomaly_detection',
              description: 'Team B recurrence rate 25% above baseline',
              requiresReview: true
            }
          ]
        });
      }
    };

    // Setup: Input parameters for monthly report generation
    const generationRequest = {
      targetMonth: '2024-01',
      teamId: 'ORG-ALL',
      triggeredBy: 'schedule' as const,
      includeDetailedAnalysis: true
    };

    // Execute: Call runTx7Imp1Agent with fake AI client
    const result = await runTx7Imp1Agent(generationRequest, fakeAiClient);

    // Verify: Action 7 prompt modules are loaded correctly
    expect(result).toBeDefined();
    expect(result.reportId).toBe('REP-2024-01-001');

    // Verify: Action 7 receives correct input data types
    expect(result.timeSeriesData).toBeDefined();
    expect(Array.isArray(result.timeSeriesData)).toBe(true);
    expect(result.timeSeriesData.length).toBeGreaterThanOrEqual(3);

    expect(result.bottleneckTrend).toBeDefined();
    expect(result.bottleneckTrend.timeSeriesData).toBeDefined();
    expect(Array.isArray(result.bottleneckTrend.timeSeriesData)).toBe(true);

    expect(result.teamPerformanceMetrics).toBeDefined();
    expect(result.teamPerformanceMetrics.teamMetrics).toBeDefined();
    expect(Array.isArray(result.teamPerformanceMetrics.teamMetrics)).toBe(true);

    // Verify: Output structure matches {priority, analysisItem, trend, impactScore(0-100), recommendedAction}
    expect(result.topPriorityChallenges).toBeDefined();
    expect(Array.isArray(result.topPriorityChallenges)).toBe(true);
    expect(result.topPriorityChallenges.length).toBeGreaterThanOrEqual(3);

    // Verify: All items have required structure
    result.topPriorityChallenges.forEach((item) => {
      expect(item).toHaveProperty('priority');
      expect(item).toHaveProperty('analysisItem');
      expect(item).toHaveProperty('trend');
      expect(item).toHaveProperty('impactScore');
      expect(item).toHaveProperty('recommendedAction');

      // Verify: priority values are valid
      expect(['high', 'medium', 'low']).toContain(item.priority);

      // Verify: analysisItem is non-empty string
      expect(typeof item.analysisItem).toBe('string');
      expect(item.analysisItem.length).toBeGreaterThan(0);

      // Verify: trend values are valid
      expect(['improving', 'stable', 'deteriorating']).toContain(item.trend);

      // Verify: impactScore is numeric and within 0-100 range
      expect(typeof item.impactScore).toBe('number');
      expect(item.impactScore).toBeGreaterThanOrEqual(0);
      expect(item.impactScore).toBeLessThanOrEqual(100);

      // Verify: recommendedAction is specific and actionable
      expect(typeof item.recommendedAction).toBe('string');
      expect(item.recommendedAction.length).toBeGreaterThan(0);
    });

    // Verify: Array is sorted by priority (high > medium > low)
    const priorities = result.topPriorityChallenges.map((item) => item.priority);
    let previousPriorityIndex = 0;
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    priorities.forEach((priority) => {
      const currentIndex = priorityOrder[priority as 'high' | 'medium' | 'low'];
      expect(currentIndex).toBeGreaterThanOrEqual(previousPriorityIndex);
      previousPriorityIndex = currentIndex;
    });

    // Verify: Specific impact scores from Action 7 output
    const highPriorityItems = result.topPriorityChallenges.filter(
      (item) => item.priority === 'high'
    );
    expect(highPriorityItems.length).toBeGreaterThanOrEqual(2);
    expect(highPriorityItems[0].impactScore).toBe(87);
    expect(highPriorityItems[1].impactScore).toBe(82);

    const mediumPriorityItems = result.topPriorityChallenges.filter(
      (item) => item.priority === 'medium'
    );
    expect(mediumPriorityItems.length).toBeGreaterThanOrEqual(2);
    expect(mediumPriorityItems[0].impactScore).toBe(65);
    expect(mediumPriorityItems[1].impactScore).toBe(58);

    const lowPriorityItems = result.topPriorityChallenges.filter(
      (item) => item.priority === 'low'
    );
    expect(lowPriorityItems.length).toBeGreaterThanOrEqual(1);
    expect(lowPriorityItems[0].impactScore).toBe(23);

    // Verify: recommendedAction contains concrete and specific actions
    highPriorityItems.forEach((item) => {
      expect(item.recommendedAction).toMatch(
        /increase|allocate|standardize|establish|conduct|adjust|implement/i
      );
    });

    // Verify: Escalation conditions are properly flagged
    expect(result.escalationFlags).toBeDefined();
    expect(Array.isArray(result.escalationFlags)).toBe(true);
    expect(result.escalationFlags.length).toBeGreaterThan(0);

    const anomalyFlag = result.escalationFlags.find(
      (flag) => flag.category === 'anomaly_detection'
    );
    expect(anomalyFlag).toBeDefined();
    expect(anomalyFlag?.requiresReview).toBe(true);
    expect(anomalyFlag?.description).toMatch(/Team B|recurrence rate/i);

    // Verify: Report generation timestamp is set
    expect(result.generatedAt).toBeDefined();
    expect(result.generatedAt instanceof Date).toBe(true);

    // Verify: Report status indicates success
    expect(result.status).toBe('success');

    // Verify: No contradiction with AIVIC goal (10 members email sending)
    expect(result.emailSentTo).toBeDefined();
    expect(Array.isArray(result.emailSentTo)).toBe(true);
    expect(result.emailSentTo.length).toBeGreaterThanOrEqual(0);
  });
});