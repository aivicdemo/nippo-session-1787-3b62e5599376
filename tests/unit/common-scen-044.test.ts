import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssues } from '../../src/logic/issue-extraction-prioritization';

describe('issue-extraction-prioritization', () => {
  // SCEN-044: [normal] 日報収集から課題抽出・配信までの自律実行 AIエージェント
  // 抽出内容を優先度別に色分けして整理する
  test('should extract and rank issues with color-coded priority levels', () => {
    const extracted_issues = [
      {
        id: 'issue_001',
        content: 'DB接続タイムアウトが本番環境で頻発',
        category: 'technical',
        impact_scope: 'production',
        frequency: 'frequent',
        business_impact: 'high',
      },
      {
        id: 'issue_002',
        content: 'API レスポンス時間が5秒を超えることがある',
        category: 'performance',
        impact_scope: 'staging',
        frequency: 'occasional',
        business_impact: 'medium',
      },
      {
        id: 'issue_003',
        content: 'ドキュメント誤字が見つかった',
        category: 'documentation',
        impact_scope: 'internal',
        frequency: 'rare',
        business_impact: 'low',
      },
      {
        id: 'issue_004',
        content: 'ユーザー認証失敗率が3%に上昇',
        category: 'security',
        impact_scope: 'production',
        frequency: 'frequent',
        business_impact: 'critical',
      },
      {
        id: 'issue_005',
        content: 'ログファイルサイズが増加傾向',
        category: 'infrastructure',
        impact_scope: 'production',
        frequency: 'continuous',
        business_impact: 'medium',
      },
    ];

    const result = extractAndRankIssues(extracted_issues);

    expect(result).toBeDefined();
    expect(result.priorityLevels).toBeDefined();
    expect(Array.isArray(result.priorityLevels)).toBe(true);
    expect(result.priorityLevels.length).toBe(3);

    const high_level = result.priorityLevels.find((p) => p.level === 'high');
    const medium_level = result.priorityLevels.find((p) => p.level === 'medium');
    const low_level = result.priorityLevels.find((p) => p.level === 'low');

    expect(high_level).toBeDefined();
    expect(medium_level).toBeDefined();
    expect(low_level).toBeDefined();

    expect(high_level!.color).toBe('#FF0000');
    expect(medium_level!.color).toBe('#FFA500');
    expect(low_level!.color).toBe('#00FF00');

    expect(Array.isArray(high_level!.items)).toBe(true);
    expect(Array.isArray(medium_level!.items)).toBe(true);
    expect(Array.isArray(low_level!.items)).toBe(true);

    const high_items = high_level!.items;
    const medium_items = medium_level!.items;
    const low_items = low_level!.items;

    const total_ranked = high_items.length + medium_items.length + low_items.length;
    expect(total_ranked).toBe(extracted_issues.length);

    const issue_004_in_high = high_items.some((item) => item.id === 'issue_004');
    expect(issue_004_in_high).toBe(true);

    const issue_001_in_high = high_items.some((item) => item.id === 'issue_001');
    expect(issue_001_in_high).toBe(true);

    const issue_002_in_medium = medium_items.some((item) => item.id === 'issue_002');
    expect(issue_002_in_medium).toBe(true);

    const issue_005_in_medium = medium_items.some((item) => item.id === 'issue_005');
    expect(issue_005_in_medium).toBe(true);

    const issue_003_in_low = low_items.some((item) => item.id === 'issue_003');
    expect(issue_003_in_low).toBe(true);

    high_items.forEach((item) => {
      expect(item.id).toBeDefined();
      expect(item.priority).toBe('high');
      expect(typeof item.content).toBe('string');
    });

    medium_items.forEach((item) => {
      expect(item.id).toBeDefined();
      expect(item.priority).toBe('medium');
      expect(typeof item.content).toBe('string');
    });

    low_items.forEach((item) => {
      expect(item.id).toBeDefined();
      expect(item.priority).toBe('low');
      expect(typeof item.content).toBe('string');
    });

    const all_returned_ids = result.priorityLevels.flatMap((p) =>
      p.items.map((item) => item.id)
    );
    const input_ids = extracted_issues.map((i) => i.id);
    expect(all_returned_ids.sort()).toEqual(input_ids.sort());
  });
});