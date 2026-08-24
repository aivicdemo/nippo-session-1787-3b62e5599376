import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from '../../src/agents/tx-4-imp-1/prompts/action-03';
import type { Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';

describe('ダッシュボード分析から課題指示までの自動実行エージェント', () => {
  test('SCEN-3131: [normal] action-03が過去の類似課題との照合により再発リスクを正確に評価する', async () => {
    // Setup: 過去の類似課題データベース
    const pastIncidents = [
      {
        incidentId: 'PAST-001',
        projectId: 'PROJECT-A',
        occurredDate: '2025-01-15',
        keyword: '納期遅延',
        countermeasure: 'リソース追加',
      },
      {
        incidentId: 'PAST-002',
        projectId: 'PROJECT-A',
        occurredDate: '2025-01-08',
        keyword: '納期遅延',
        countermeasure: 'スケジュール短縮',
      },
      {
        incidentId: 'PAST-003',
        projectId: 'PROJECT-B',
        occurredDate: '2025-01-22',
        keyword: '品質低下',
        countermeasure: 'レビュー強化',
      },
    ];

    // 現在の課題
    const currentIssue = {
      projectId: 'PROJECT-A',
      issueTitle: '進捗遅延',
      progressPercentage: 80,
      keyword: '納期遅延',
      occurredDate: '2025-01-29',
      description: 'プロジェクトAの進捗が計画比80%に留まり、納期遅延のリスクが高まっている',
    };

    // Mock AI Client
    const mockAiClient: Tx4Imp1AiClient = {
      async evaluateRiskFromPastIncidents(prompt: string): Promise<{
        similarityScore: number;
        riskLevel: 'high' | 'medium' | 'low';
        pastIncidentCount: number;
        recommendedMonitoringItems: string[];
        estimatedRecoveryDays: number;
        evaluatedAt: string;
      }> {
        // Verify the prompt contains required elements
        expect(prompt).toContain('納期遅延');
        expect(prompt).toContain('PROJECT-A');
        expect(prompt).toContain('過去課題');

        return {
          similarityScore: 0.92,
          riskLevel: 'high',
          pastIncidentCount: 2,
          recommendedMonitoringItems: [
            'リソース確保状況',
            'スケジュール進捗',
            '品質指標',
          ],
          estimatedRecoveryDays: 2,
          evaluatedAt: '2025-01-29T09:00:00Z',
        };
      },
    };

    // Build action-03 prompt
    const action03Prompt = buildAction03Prompt(
      currentIssue,
      pastIncidents,
      ACTION_03_PROMPT_VERSION
    );

    // Verify prompt structure
    expect(action03Prompt).toContain('過去の類似課題');
    expect(action03Prompt).toContain('再発リスク');
    expect(action03Prompt).toContain('類似度');

    // Execute action-03 via orchestrator with mocked AI client
    const executionRequest = {
      teamId: 'TEAM-001',
      managerId: 'MGR-001',
      reportDate: '2025-01-29',
      meetingStartTime: '09:00',
    };

    const result = await runTx4Imp1Agent(executionRequest, mockAiClient);

    // Verify the action-03 result structure
    expect(result).toBeDefined();
    expect(result.executionId).toBeDefined();

    // Verify risk evaluation attributes exist and have correct values
    const riskEvaluation = result.prioritizedIssues?.[0];
    expect(riskEvaluation).toBeDefined();

    if (riskEvaluation && 'similarityScore' in riskEvaluation) {
      expect(riskEvaluation.similarityScore).toBe(0.92);
      expect(riskEvaluation.similarityScore).toBeGreaterThanOrEqual(0);
      expect(riskEvaluation.similarityScore).toBeLessThanOrEqual(1);
    }

    // Verify risk level
    if (riskEvaluation && 'riskLevel' in riskEvaluation) {
      expect(riskEvaluation.riskLevel).toBe('high');
      expect(['high', 'medium', 'low']).toContain(riskEvaluation.riskLevel);
    }

    // Verify past incident count
    if (riskEvaluation && 'pastIncidentCount' in riskEvaluation) {
      expect(riskEvaluation.pastIncidentCount).toBe(2);
      expect(riskEvaluation.pastIncidentCount).toBeGreaterThan(0);
    }

    // Verify recommended monitoring items
    if (riskEvaluation && 'recommendedMonitoringItems' in riskEvaluation) {
      expect(Array.isArray(riskEvaluation.recommendedMonitoringItems)).toBe(true);
      expect(riskEvaluation.recommendedMonitoringItems.length).toBeGreaterThan(0);
      expect(riskEvaluation.recommendedMonitoringItems).toContain(
        'リソース確保状況'
      );
      expect(riskEvaluation.recommendedMonitoringItems).toContain(
        'スケジュール進捗'
      );
      expect(riskEvaluation.recommendedMonitoringItems).toContain('品質指標');
    }

    // Verify estimated recovery days
    if (riskEvaluation && 'estimatedRecoveryDays' in riskEvaluation) {
      expect(riskEvaluation.estimatedRecoveryDays).toBe(2);
      expect(riskEvaluation.estimatedRecoveryDays).toBeGreaterThan(0);
    }

    // Verify escalation condition: riskLevel === 'high' should trigger escalation
    const escalationTriggered = riskEvaluation &&
      'riskLevel' in riskEvaluation &&
      riskEvaluation.riskLevel === 'high';
    expect(escalationTriggered).toBe(true);

    // Verify audit log contains required fields
    expect(result.completionTimestamp).toBeDefined();
    expect(result.completionTimestamp).toBeInstanceOf(Date);

    // Verify countermeasurePlan includes risk assessment
    expect(result.countermeasurePlan).toBeDefined();
    expect(result.countermeasurePlan.topPriorityIssue).toBeDefined();
    expect(typeof result.countermeasurePlan.topPriorityIssue).toBe('string');
    expect(result.countermeasurePlan.estimatedResolutionDays).toBe(2);
    expect(result.countermeasurePlan.recommendedActions).toBeDefined();
    expect(Array.isArray(result.countermeasurePlan.recommendedActions)).toBe(
      true
    );

    // Verify summaryEmailSent flag
    expect(typeof result.summaryEmailSent).toBe('boolean');

    // Verify aggregated report and issue counts
    expect(result.aggregatedReportCount).toBeGreaterThanOrEqual(0);
    expect(result.extractedIssueCount).toBeGreaterThanOrEqual(1);

    // Final assertion: Risk level 'high' indicates escalation is needed
    expect(result.countermeasurePlan.assignedTeamId).toBeDefined();
    expect(typeof result.countermeasurePlan.assignedTeamId).toBe('string');
  });
});