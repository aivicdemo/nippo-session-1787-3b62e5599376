import { extractAndRankIssues } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Prioritization', () => {
  // SCEN-027: [normal] 日報集約から課題優先順位付けと未提出通知までの自律実行 AIエージェント
  // Action 4: 課題の重要度と緊急度から優先順位を自動付与
  test('should extract and rank issues by importance and urgency scores according to contract', () => {
    const input_issues = [
      {
        issue_id: 'ISSUE_001',
        content: 'Critical system outage affecting all users',
        importance_level: 'critical',
        urgency_level: 'high',
        affected_users: 500,
        recurrence_count: 0,
      },
      {
        issue_id: 'ISSUE_002',
        content: 'Minor UI display inconsistency',
        importance_level: 'normal',
        urgency_level: 'low',
        affected_users: 5,
        recurrence_count: 1,
      },
      {
        issue_id: 'ISSUE_003',
        content: 'Database performance degradation',
        importance_level: 'medium',
        urgency_level: 'high',
        affected_users: 100,
        recurrence_count: 2,
      },
    ];

    const priority_rule = {
      importance_weight: 0.4,
      urgency_weight: 0.6,
      recurrence_penalty: 0.1,
      critical_multiplier: 2.0,
      importance_scale: { critical: 10, medium: 5, normal: 2 },
      urgency_scale: { high: 10, low: 3 },
    };

    const result = extractAndRankIssues(input_issues, priority_rule);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);

    const ranked_result = result as Array<{
      issue_id: string;
      content: string;
      importance_score: number;
      urgency_score: number;
      composite_priority_score: number;
      priority_rank: number;
    }>;

    expect(ranked_result[0].issue_id).toBe('ISSUE_001');
    expect(ranked_result[0].importance_score).toBe(10);
    expect(ranked_result[0].urgency_score).toBe(10);
    expect(ranked_result[0].composite_priority_score).toBe(20.0);
    expect(ranked_result[0].priority_rank).toBe(1);

    expect(ranked_result[1].issue_id).toBe('ISSUE_003');
    expect(ranked_result[1].importance_score).toBe(5);
    expect(ranked_result[1].urgency_score).toBe(10);
    expect(ranked_result[1].composite_priority_score).toBeCloseTo(8.0, 1);
    expect(ranked_result[1].priority_rank).toBe(2);

    expect(ranked_result[2].issue_id).toBe('ISSUE_002');
    expect(ranked_result[2].importance_score).toBe(2);
    expect(ranked_result[2].urgency_score).toBe(3);
    expect(ranked_result[2].composite_priority_score).toBeCloseTo(2.5, 1);
    expect(ranked_result[2].priority_rank).toBe(3);

    expect(ranked_result[0].composite_priority_score).toBeGreaterThan(
      ranked_result[1].composite_priority_score
    );
    expect(ranked_result[1].composite_priority_score).toBeGreaterThan(
      ranked_result[2].composite_priority_score
    );

    const idempotent_result = extractAndRankIssues(input_issues, priority_rule);
    expect(idempotent_result).toEqual(result);
  });
});