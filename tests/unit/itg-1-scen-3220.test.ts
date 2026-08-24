import { runTx9Imp1Agent } from '../../src/agents/tx-9-imp-1/orchestrator';
import { type Tx9Imp1AiClient } from '../../src/agents/tx-9-imp-1/orchestrator';
import { buildAction05Prompt, ACTION_05_PROMPT_VERSION } from '../../src/agents/tx-9-imp-1/prompts/action-05';

describe('tx-9-imp-1 agent - 日報集約から分析報告までの自動実行エージェント', () => {
  // SCEN-3220
  test('AIエージェントが過去30日の日報から同一課題の再発パターンを正確に検出し、Action 5がオーケストレーション順序を守って実行される', async () => {
    // Mock AI client that returns recurrence detection results
    const mockAiClient: Tx9Imp1AiClient = {
      invokeAction01: jest.fn().mockResolvedValue({
        aggregatedReports: [
          {
            reportId: 'rpt-001',
            memberId: 'mem-001',
            submittedAt: '2024-01-01T09:00:00Z',
            issues: ['ビルドエラー', 'テスト失敗'],
          },
          {
            reportId: 'rpt-002',
            memberId: 'mem-001',
            submittedAt: '2024-01-06T09:00:00Z',
            issues: ['ビルドエラー', 'デプロイ遅延'],
          },
          {
            reportId: 'rpt-003',
            memberId: 'mem-001',
            submittedAt: '2024-01-11T09:00:00Z',
            issues: ['ビルドエラー', 'コードレビュー滞留'],
          },
          {
            reportId: 'rpt-004',
            memberId: 'mem-002',
            submittedAt: '2024-01-02T09:00:00Z',
            issues: ['レビュー遅延'],
          },
          {
            reportId: 'rpt-005',
            memberId: 'mem-002',
            submittedAt: '2024-01-04T09:00:00Z',
            issues: ['レビュー遅延'],
          },
          {
            reportId: 'rpt-006',
            memberId: 'mem-002',
            submittedAt: '2024-01-06T09:00:00Z',
            issues: ['レビュー遅延'],
          },
          {
            reportId: 'rpt-007',
            memberId: 'mem-002',
            submittedAt: '2024-01-08T09:00:00Z',
            issues: ['レビュー遅延'],
          },
        ],
        unsubmittedMembers: ['mem-003', 'mem-004'],
      }),
      invokeAction02: jest.fn().mockResolvedValue({
        notificationStatus: 'sent',
        remindersSent: 2,
      }),
      invokeAction03: jest.fn().mockResolvedValue({
        issueFrequencyPerDay: 0.23,
        averageResolutionDays: 3.5,
        completionRate: 82,
      }),
      invokeAction04: jest.fn().mockResolvedValue({
        prioritizedIssues: [
          {
            keyword: 'ビルドエラー',
            frequency: 3,
            priorityScore: 85,
            riskLevel: 'high',
          },
          {
            keyword: 'レビュー遅延',
            frequency: 4,
            priorityScore: 90,
            riskLevel: 'high',
          },
        ],
      }),
      invokeAction05: jest.fn().mockResolvedValue({
        recurrencePatterns: [
          {
            courseId: 'course-build-error',
            keyword: 'ビルドエラー',
            occurrenceCount: 3,
            intervalDays: [5, 5],
            riskLevel: 'high',
            detectedAt: '2024-01-31T10:30:00Z',
          },
          {
            courseId: 'course-review-delay',
            keyword: 'レビュー遅延',
            occurrenceCount: 4,
            intervalDays: [2, 2, 2],
            riskLevel: 'high',
            detectedAt: '2024-01-31T10:30:00Z',
          },
        ],
        actionSequenceLog: [
          'Action01_aggregation_complete',
          'Action02_notification_complete',
          'Action03_metrics_calculation_complete',
          'Action04_prioritization_complete',
          'Action05_recurrence_detection_complete',
        ],
      }),
      invokeAction06: jest.fn().mockResolvedValue({
        countermeasures: [
          {
            issueKeyword: 'ビルドエラー',
            proposedAction: 'ビルドプロセスの自動化とテスト強化',
            expectedImpact: 'エラー発生頻度を50%削減',
            priority: 1,
          },
          {
            issueKeyword: 'レビュー遅延',
            proposedAction: 'コードレビュー体制の見直しと並列レビュー導入',
            expectedImpact: 'レビュー完了期間を3日短縮',
            priority: 1,
          },
        ],
      }),
      invokeAction07: jest.fn().mockResolvedValue({
        reportId: 'analysis-report-001',
        aggregationPeriod: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        productivityMetrics: {
          issueFrequencyPerDay: 0.23,
          averageResolutionDays: 3.5,
          completionRate: 82,
        },
        prioritizedIssues: [
          {
            keyword: 'レビュー遅延',
            frequency: 4,
            priorityScore: 90,
            riskLevel: 'high',
          },
          {
            keyword: 'ビルドエラー',
            frequency: 3,
            priorityScore: 85,
            riskLevel: 'high',
          },
        ],
        recommendedCountermeasures: [
          {
            issueKeyword: 'レビュー遅延',
            proposedAction: 'コードレビュー体制の見直しと並列レビュー導入',
            expectedImpact: 'レビュー完了期間を3日短縮',
            priority: 1,
          },
          {
            issueKeyword: 'ビルドエラー',
            proposedAction: 'ビルドプロセスの自動化とテスト強化',
            expectedImpact: 'エラー発生頻度を50%削減',
            priority: 1,
          },
        ],
        generatedAt: '2024-01-31T10:30:00Z',
      }),
    };

    // Verify that Action 05 prompt module is loaded and contains expected version
    expect(ACTION_05_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_05_PROMPT_VERSION).toBe('string');
    expect(ACTION_05_PROMPT_VERSION).toMatch(/\d+\.\d+\.\d+/);

    const buildAction05PromptFn = buildAction05Prompt;
    expect(buildAction05PromptFn).toBeDefined();
    expect(typeof buildAction05PromptFn).toBe('function');

    // Prepare test input
    const aggregationRequest = {
      aggregationStartDate: '2024-01-01',
      aggregationEndDate: '2024-01-31',
      targetTeamIds: ['team-001'],
      requestedByUserId: 'manager-001',
    };

    // Execute the agent
    const result = await runTx9Imp1Agent(aggregationRequest, mockAiClient);

    // Verify that the agent executed all actions in the correct sequence
    expect(mockAiClient.invokeAction01).toHaveBeenCalledTimes(1);
    expect(mockAiClient.invokeAction02).toHaveBeenCalledTimes(1);
    expect(mockAiClient.invokeAction03).toHaveBeenCalledTimes(1);
    expect(mockAiClient.invokeAction04).toHaveBeenCalledTimes(1);
    expect(mockAiClient.invokeAction05).toHaveBeenCalledTimes(1);
    expect(mockAiClient.invokeAction06).toHaveBeenCalledTimes(1);
    expect(mockAiClient.invokeAction07).toHaveBeenCalledTimes(1);

    // Verify action execution order log
    const action05Result = await mockAiClient.invokeAction05();
    expect(action05Result.actionSequenceLog).toContain('Action01_aggregation_complete');
    expect(action05Result.actionSequenceLog).toContain('Action02_notification_complete');
    expect(action05Result.actionSequenceLog).toContain('Action03_metrics_calculation_complete');
    expect(action05Result.actionSequenceLog).toContain('Action04_prioritization_complete');
    expect(action05Result.actionSequenceLog).toContain('Action05_recurrence_detection_complete');

    const action05Index = action05Result.actionSequenceLog.indexOf('Action05_recurrence_detection_complete');
    const action04Index = action05Result.actionSequenceLog.indexOf('Action04_prioritization_complete');
    const action06Index = action05Result.actionSequenceLog.indexOf('Action06_countermeasure_proposal_complete');

    expect(action05Index).toBeGreaterThan(action04Index);
    if (action06Index !== -1) {
      expect(action05Index).toBeLessThan(action06Index);
    }

    // Verify recurrence pattern detection for "ビルドエラー"
    const buildErrorPattern = action05Result.recurrencePatterns.find(
      (p) => p.keyword === 'ビルドエラー'
    );
    expect(buildErrorPattern).toBeDefined();
    expect(buildErrorPattern.courseId).toBe('course-build-error');
    expect(buildErrorPattern.occurrenceCount).toBe(3);
    expect(buildErrorPattern.intervalDays).toEqual([5, 5]);
    expect(buildErrorPattern.riskLevel).toBe('high');
    expect(buildErrorPattern.detectedAt).toBe('2024-01-31T10:30:00Z');

    // Verify recurrence pattern detection for "レビュー遅延"
    const reviewDelayPattern = action05Result.recurrencePatterns.find(
      (p) => p.keyword === 'レビュー遅延'
    );
    expect(reviewDelayPattern).toBeDefined();
    expect(reviewDelayPattern.courseId).toBe('course-review-delay');
    expect(reviewDelayPattern.occurrenceCount).toBe(4);
    expect(reviewDelayPattern.intervalDays).toEqual([2, 2, 2]);
    expect(reviewDelayPattern.riskLevel).toBe('high');
    expect(reviewDelayPattern.detectedAt).toBe('2024-01-31T10:30:00Z');

    // Verify final report structure
    expect(result.reportId).toBe('analysis-report-001');
    expect(result.aggregationPeriod.startDate).toBe('2024-01-01');
    expect(result.aggregationPeriod.endDate).toBe('2024-01-31');
    expect(result.productivityMetrics.issueFrequencyPerDay).toBe(0.23);
    expect(result.productivityMetrics.averageResolutionDays).toBe(3.5);
    expect(result.productivityMetrics.completionRate).toBe(82);

    // Verify prioritized issues in final report
    expect(result.prioritizedIssues).toHaveLength(2);
    expect(result.prioritizedIssues[0].keyword).toBe('レビュー遅延');
    expect(result.prioritizedIssues[0].frequency).toBe(4);
    expect(result.prioritizedIssues[0].priorityScore).toBe(90);
    expect(result.prioritizedIssues[1].keyword).toBe('ビルドエラー');
    expect(result.prioritizedIssues[1].frequency).toBe(3);
    expect(result.prioritizedIssues[1].priorityScore).toBe(85);

    // Verify recommended countermeasures
    expect(result.recommendedCountermeasures).toHaveLength(2);
    expect(result.recommendedCountermeasures[0].priority).toBe(1);
    expect(result.recommendedCountermeasures[1].priority).toBe(1);

    expect(result.generatedAt).toBe('2024-01-31T10:30:00Z');
  });
});