import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import { type PrioritizeAndColorizeIssuesInput, type IssueSummary } from '../../src/logic/issue-extraction-prioritization';

describe('prioritizeAndColorizeIssues - Dashboard color highlighting by priority score', () => {
  // SCEN-730: [edge] 課題優先度スコアによるダッシュボード強調表示機能 - 同じ優先度スコアを持つ複数課題が全て同じ色で表示される
  test('should display issues with identical priority scores in the same color code', () => {
    // Arrange: 複数の課題データを準備
    const issueA: IssueSummary = {
      issueId: 'issue-001',
      priorityScore: 75,
      keyword: 'Database connection timeout',
      impactLevel: 'high',
    };

    const issueB: IssueSummary = {
      issueId: 'issue-002',
      priorityScore: 75,
      keyword: 'API response delay',
      impactLevel: 'high',
    };

    const issueC: IssueSummary = {
      issueId: 'issue-003',
      priorityScore: 75,
      keyword: 'Memory leak in cache module',
      impactLevel: 'high',
    };

    const issueD: IssueSummary = {
      issueId: 'issue-004',
      priorityScore: 50,
      keyword: 'Documentation needs update',
      impactLevel: 'medium',
    };

    const issues: IssueSummary[] = [issueA, issueB, issueC, issueD];

    const colorThresholds = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues,
      colorThresholds,
      requestedBy: 'manager-001',
    };

    // Act: ダッシュボード色分け処理を実行
    const result = prioritizeAndColorizeIssues(input);

    // Assert: 結果の構造を検証
    expect(result).toBeDefined();
    expect(result.colorizedIssues).toBeDefined();
    expect(Array.isArray(result.colorizedIssues)).toBe(true);
    expect(result.colorizedIssues.length).toBe(4);

    // 課題A、B、Cを抽出（優先度スコア：75）
    const colorizedIssueA = result.colorizedIssues.find((ci) => ci.issueId === 'issue-001');
    const colorizedIssueB = result.colorizedIssues.find((ci) => ci.issueId === 'issue-002');
    const colorizedIssueC = result.colorizedIssues.find((ci) => ci.issueId === 'issue-003');
    const colorizedIssueD = result.colorizedIssues.find((ci) => ci.issueId === 'issue-004');

    // 全ての課題が存在することを確認
    expect(colorizedIssueA).toBeDefined();
    expect(colorizedIssueB).toBeDefined();
    expect(colorizedIssueC).toBeDefined();
    expect(colorizedIssueD).toBeDefined();

    // 優先度スコア75の課題A、B、Cが同一の色コードであることを検証
    const colorA = colorizedIssueA!.highlightColor;
    const colorB = colorizedIssueB!.highlightColor;
    const colorC = colorizedIssueC!.highlightColor;
    const colorD = colorizedIssueD!.highlightColor;

    // 課題A、B、Cが同じ色であることをアサート
    expect(colorA).toBe(colorB);
    expect(colorB).toBe(colorC);

    // 課題Dが異なる色であることをアサート
    expect(colorD).not.toBe(colorA);

    // 色コードが有効な値であることを確認
    expect(['red', 'yellow', 'green', 'none']).toContain(colorA);
    expect(['red', 'yellow', 'green', 'none']).toContain(colorD);

    // 優先度スコア75は赤（red）に分類されることを期待
    expect(colorA).toBe('red');

    // 優先度スコア50は黄色（yellow）に分類されることを期待
    expect(colorD).toBe('yellow');

    // 色分け分布の検証
    expect(result.colorDistribution).toBeDefined();
    expect(result.colorDistribution.red).toBe(3); // issue-001, 002, 003
    expect(result.colorDistribution.yellow).toBe(1); // issue-004
    expect(result.colorDistribution.green).toBe(0);

    // processedAt が ISO 8601 形式であることを検証
    expect(result.processedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
    );
  });
});