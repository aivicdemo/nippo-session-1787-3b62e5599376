import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { generateMonthlyAnalysisReport } from '../../src/logic/analysis-reporting';

describe('generateMonthlyAnalysisReport', () => {
  // SCEN-131: [normal] 月次レポート生成から分析完了までの自動実行 AIエージェント
  test('should generate prioritized analysis report with high-medium-low sorted items and concrete impact scores', async () => {
    const mock_end_date = new Date('2024-01-31T23:59:59Z');
    const mock_start_date = new Date('2024-01-01T00:00:00Z');
    const mock_team_count = 5;
    const mock_issue_count = 12;
    const mock_avg_resolution_days = 4.2;
    const mock_recurrence_rate = 0.18;

    const input_analysis_data = {
      report_month: '2024-01',
      time_series_data: [
        {
          date: '2024-01-08',
          issue_count: 3,
          resolved_count: 1,
          avg_resolution_hours: 24.5,
        },
        {
          date: '2024-01-15',
          issue_count: 4,
          resolved_count: 2,
          avg_resolution_hours: 18.0,
        },
        {
          date: '2024-01-22',
          issue_count: 3,
          resolved_count: 3,
          avg_resolution_hours: 12.0,
        },
        {
          date: '2024-01-29',
          issue_count: 2,
          resolved_count: 2,
          avg_resolution_hours: 8.5,
        },
      ],
      bottleneck_data: [
        { week: 1, bottleneck_name: 'database_performance', occurrences: 5 },
        {
          week: 2,
          bottleneck_name: 'database_performance',
          occurrences: 3,
        },
        {
          week: 3,
          bottleneck_name: 'deployment_process',
          occurrences: 2,
        },
        {
          week: 4,
          bottleneck_name: 'deployment_process',
          occurrences: 1,
        },
      ],
      team_performance_metrics: [
        {
          team_id: 'team_alpha',
          team_name: 'Frontend Team',
          issue_count: 4,
          resolved_count: 3,
          avg_days_to_resolve: 3.5,
        },
        {
          team_id: 'team_beta',
          team_name: 'Backend Team',
          issue_count: 5,
          resolved_count: 4,
          avg_days_to_resolve: 5.2,
        },
        {
          team_id: 'team_gamma',
          team_name: 'DevOps Team',
          issue_count: 3,
          resolved_count: 3,
          avg_days_to_resolve: 2.1,
        },
      ],
    };

    const expected_high_priority_items = [
      {
        priority: 'high',
        analysisItem: 'database_performance bottleneck persistence',
        trend: 'improving',
        impactScore: 87,
        recommendedAction:
          'Backend Team should implement database query optimization and caching strategy',
      },
      {
        priority: 'high',
        analysisItem: 'Frontend Team resolution speed',
        trend: 'stable',
        impactScore: 76,
        recommendedAction:
          'Frontend Team needs code review and automated testing process improvement',
      },
    ];

    const expected_medium_priority_items = [
      {
        priority: 'medium',
        analysisItem: 'deployment_process improvement trajectory',
        trend: 'improving',
        impactScore: 54,
        recommendedAction:
          'DevOps Team should document deployment runbook and create incident response protocol',
      },
      {
        priority: 'medium',
        analysisItem: 'Backend Team resolution capacity',
        trend: 'stable',
        impactScore: 45,
        recommendedAction:
          'Consider load balancing or parallel task processing for Backend Team',
      },
    ];

    const expected_low_priority_items = [
      {
        priority: 'low',
        analysisItem: 'DevOps Team efficiency',
        trend: 'improving',
        impactScore: 23,
        recommendedAction:
          'Continue current practices; monitor for future escalation',
      },
    ];

    const result = await generateMonthlyAnalysisReport(input_analysis_data);

    expect(result).toBeDefined();
    expect(Array.isArray(result.prioritized_items)).toBe(true);

    const sorted_items = result.prioritized_items;

    expect(sorted_items.length).toBeGreaterThanOrEqual(3);

    const high_items = sorted_items.filter((item) => item.priority === 'high');
    const medium_items = sorted_items.filter(
      (item) => item.priority === 'medium'
    );
    const low_items = sorted_items.filter((item) => item.priority === 'low');

    expect(high_items.length).toBeGreaterThan(0);
    expect(medium_items.length).toBeGreaterThan(0);
    expect(low_items.length).toBeGreaterThan(0);

    const priority_order = {
      high: 0,
      medium: 1,
      low: 2,
    };

    for (let i = 0; i < sorted_items.length - 1; i++) {
      const current_priority = priority_order[sorted_items[i].priority];
      const next_priority =
        priority_order[sorted_items[i + 1].priority];
      expect(current_priority).toBeLessThanOrEqual(next_priority);
    }

    sorted_items.forEach((item) => {
      expect(typeof item.priority).toBe('string');
      expect(['high', 'medium', 'low']).toContain(item.priority);

      expect(typeof item.analysisItem).toBe('string');
      expect(item.analysisItem.length).toBeGreaterThan(0);

      expect(typeof item.trend).toBe('string');
      expect(['improving', 'stable', 'declining']).toContain(item.trend);

      expect(typeof item.impactScore).toBe('number');
      expect(item.impactScore).toBeGreaterThanOrEqual(0);
      expect(item.impactScore).toBeLessThanOrEqual(100);

      expect(typeof item.recommendedAction).toBe('string');
      expect(item.recommendedAction.length).toBeGreaterThan(5);
      expect(
        item.recommendedAction.includes('should') ||
          item.recommendedAction.includes('Team') ||
          item.recommendedAction.includes('process')
      ).toBe(true);
    });

    const first_high_item = high_items[0];
    expect(first_high_item.impactScore).toBeGreaterThanOrEqual(75);

    const first_medium_item = medium_items[0];
    expect(first_medium_item.impactScore).toBeLessThan(75);
    expect(first_medium_item.impactScore).toBeGreaterThanOrEqual(50);

    const first_low_item = low_items[0];
    expect(first_low_item.impactScore).toBeLessThan(50);

    expect(result.escalation_items).toBeDefined();
    expect(Array.isArray(result.escalation_items)).toBe(true);

    if (result.escalation_items.length > 0) {
      result.escalation_items.forEach((escalation_item) => {
        expect(typeof escalation_item.issue_id).toBe('string');
        expect(typeof escalation_item.escalation_reason).toBe('string');
        expect(
          escalation_item.escalation_reason.includes('anomaly') ||
            escalation_item.escalation_reason.includes('pattern') ||
            escalation_item.escalation_reason.includes('manual_review')
        ).toBe(true);
        expect(typeof escalation_item.requires_human_review).toBe('boolean');
        expect(escalation_item.requires_human_review).toBe(true);
      });
    }

    expect(result.analysis_metadata).toBeDefined();
    expect(typeof result.analysis_metadata.report_month).toBe('string');
    expect(result.analysis_metadata.report_month).toBe('2024-01');
    expect(typeof result.analysis_metadata.generated_at).toBe('string');
    expect(typeof result.analysis_metadata.total_issues_analyzed).toBe(
      'number'
    );
    expect(result.analysis_metadata.total_issues_analyzed).toBeGreaterThan(0);
    expect(typeof result.analysis_metadata.trend_summary).toBe('string');
  });
});