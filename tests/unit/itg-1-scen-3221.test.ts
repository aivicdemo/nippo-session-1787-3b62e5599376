import { runTx9Imp1Agent } from '../../src/agents/tx-9-imp-1/orchestrator';
import { type Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';

describe('tx-9-imp-1: 日報集約から分析報告までの自動実行エージェント', () => {
  // SCEN-3221
  test('Action 6「改善施策を提案する」が契約どおり実行され、施策データが構造化・報告書に包含される', async () => {
    const fakeAiClient: Tx9Imp1AiClient = {
      buildAction01Prompt: jest.fn().mockReturnValue('action_01_prompt_v1'),
      ACTION_01_PROMPT_VERSION: 'v1.0.0',
      buildAction02Prompt: jest.fn().mockReturnValue('action_02_prompt_v1'),
      ACTION_02_PROMPT_VERSION: 'v1.0.0',
      buildAction03Prompt: jest.fn().mockReturnValue('action_03_prompt_v1'),
      ACTION_03_PROMPT_VERSION: 'v1.0.0',
      buildAction04Prompt: jest.fn().mockReturnValue('action_04_prompt_v1'),
      ACTION_04_PROMPT_VERSION: 'v1.0.0',
      buildAction05Prompt: jest.fn().mockReturnValue('action_05_prompt_v1'),
      ACTION_05_PROMPT_VERSION: 'v1.0.0',
      buildAction06Prompt: jest.fn().mockReturnValue(
        'action_06_prompt_with_metrics_and_recurrence_data'
      ),
      ACTION_06_PROMPT_VERSION: 'v1.0.0',
      buildAction07Prompt: jest.fn().mockReturnValue('action_07_prompt_v1'),
      ACTION_07_PROMPT_VERSION: 'v1.0.0',
      callAiModel: jest.fn().mockImplementation((promptText: string) => {
        if (promptText.includes('action_06_prompt')) {
          return Promise.resolve(
            JSON.stringify({
              countermeasures: [
                {
                  measureId: 'measure_001',
                  title: '対応速度が遅い3課題について、担当者への対応期限を5営業日に短縮する',
                  priorityRank: 'high',
                  estimatedEffectPercent: 12,
                },
                {
                  measureId: 'measure_002',
                  title: '再発課題（同一キーワードが3回以上）5件について、根本原因分析会を実施する',
                  priorityRank: 'high',
                  estimatedEffectPercent: 8,
                },
                {
                  measureId: 'measure_003',
                  title: '品質検査フローの強化',
                  priorityRank: 'medium',
                  estimatedEffectPercent: 5,
                },
                {
                  measureId: 'measure_004',
                  title: 'チーム間コミュニケーション改善',
                  priorityRank: 'medium',
                  estimatedEffectPercent: 3,
                },
                {
                  measureId: 'measure_005',
                  title: 'ナレッジベースの整備',
                  priorityRank: 'medium',
                  estimatedEffectPercent: 2,
                },
              ],
            })
          );
        }
        if (promptText.includes('action_07_prompt')) {
          return Promise.resolve(
            JSON.stringify({
              reportId: 'report_tx9_20240115_001',
              status: 'generated',
              recipientUserId: 'director_001',
            })
          );
        }
        return Promise.resolve(JSON.stringify({ status: 'completed' }));
      }),
      recordAuditLog: jest.fn().mockResolvedValue({ logged: true }),
    };

    const aggregationStartDate = '2024-12-16';
    const aggregationEndDate = '2025-01-14';
    const targetTeamIds: string[] = [];
    const requestedByUserId = 'director_001';

    const tx9AggregationRequest = {
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      requestedByUserId,
    };

    const startTime = Date.now();
    const result = await runTx9Imp1Agent(tx9AggregationRequest, fakeAiClient);
    const endTime = Date.now();
    const executionTimeMs = endTime - startTime;

    expect(result).toBeDefined();
    expect(result.reportId).toBe('report_tx9_20240115_001');
    expect(result.aggregationPeriod.startDate).toBe(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toBe(aggregationEndDate);

    expect(result.productivityMetrics).toBeDefined();
    expect(result.productivityMetrics.issueFrequencyPerDay).toBeCloseTo(4.0, 1);
    expect(result.productivityMetrics.averageResolutionDays).toBe(8.5);
    expect(result.productivityMetrics.completionRate).toBe(80);

    expect(result.prioritizedIssues).toBeDefined();
    expect(Array.isArray(result.prioritizedIssues)).toBe(true);

    expect(result.recommendedCountermeasures).toBeDefined();
    expect(Array.isArray(result.recommendedCountermeasures)).toBe(true);
    expect(result.recommendedCountermeasures.length).toBe(5);

    const highPriorityMeasures = result.recommendedCountermeasures.filter(
      (m) => m.priorityRank === 'high'
    );
    expect(highPriorityMeasures.length).toBe(2);
    expect(highPriorityMeasures[0].measureId).toBe('measure_001');
    expect(highPriorityMeasures[0].estimatedEffectPercent).toBe(12);
    expect(highPriorityMeasures[1].measureId).toBe('measure_002');
    expect(highPriorityMeasures[1].estimatedEffectPercent).toBe(8);

    const mediumPriorityMeasures = result.recommendedCountermeasures.filter(
      (m) => m.priorityRank === 'medium'
    );
    expect(mediumPriorityMeasures.length).toBe(3);
    expect(mediumPriorityMeasures[0].measureId).toBe('measure_003');
    expect(mediumPriorityMeasures[1].measureId).toBe('measure_004');
    expect(mediumPriorityMeasures[2].measureId).toBe('measure_005');

    expect(result.generatedAt).toBeDefined();
    const generatedAtDate = new Date(result.generatedAt);
    expect(generatedAtDate).toBeInstanceOf(Date);
    expect(Number.isNaN(generatedAtDate.getTime())).toBe(false);

    expect(fakeAiClient.buildAction06Prompt).toHaveBeenCalled();
    expect(fakeAiClient.buildAction07Prompt).toHaveBeenCalled();

    const action06CallArgs = (
      fakeAiClient.buildAction06Prompt as jest.Mock
    ).mock.calls[0];
    expect(action06CallArgs).toBeDefined();

    const auditLogCalls = (fakeAiClient.recordAuditLog as jest.Mock).mock
      .calls;
    expect(auditLogCalls.length).toBeGreaterThanOrEqual(4);

    const auditEventTypes = auditLogCalls.map((call) => call[0]?.eventType);
    expect(auditEventTypes).toContain('agent_execution_started');
    expect(auditEventTypes).toContain('action_06_executed');
    expect(auditEventTypes).toContain('countermeasures_generated');
    expect(auditEventTypes).toContain('report_delivery_completed');

    const countermeasuresGeneratedLog = auditLogCalls.find(
      (call) => call[0]?.eventType === 'countermeasures_generated'
    );
    expect(countermeasuresGeneratedLog).toBeDefined();
    expect(countermeasuresGeneratedLog[0].countermeasureCount).toBe(5);

    const reportDeliveryLog = auditLogCalls.find(
      (call) => call[0]?.eventType === 'report_delivery_completed'
    );
    expect(reportDeliveryLog).toBeDefined();
    expect(reportDeliveryLog[0].recipientUserId).toBe('director_001');
    expect(reportDeliveryLog[0].reportId).toBe('report_tx9_20240115_001');

    expect(executionTimeMs).toBeLessThan(5000);
  });
});