import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度判定機能 - 複数課題の優先度ランクが同値の場合の順序維持', () => {
  test('SCEN-598: 優先度が同値（中）の複数課題について、登録順序が保持される', () => {
    // テストデータ準備：優先度がすべて「中」の課題3件
    const issueA = {
      issueId: 'issue-001',
      issueContent: 'システムダウン対応',
      occurrenceFrequency: 2,
      impactScore: 50,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const issueB = {
      issueId: 'issue-002',
      issueContent: 'ドキュメント整備',
      occurrenceFrequency: 1,
      impactScore: 45,
      affectedTeamCount: 1,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const issueC = {
      issueId: 'issue-003',
      issueContent: 'デバッグ作業',
      occurrenceFrequency: 2,
      impactScore: 48,
      affectedTeamCount: 1,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    // 呼び出し順序と呼び出し回数をトラッキング
    let classifyIssueSeverityCallCount = 0;
    const callTracker: Array<{ issueId: string; issueContent: string }> = [];

    // TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn((content: string) => {
        classifyIssueSeverityCallCount++;
        // 呼び出し順序を記録
        if (content.includes('システムダウン')) {
          callTracker.push({ issueId: 'issue-001', issueContent: content });
          return '中';
        } else if (content.includes('ドキュメント')) {
          callTracker.push({ issueId: 'issue-002', issueContent: content });
          return '中';
        } else if (content.includes('デバッグ')) {
          callTracker.push({ issueId: 'issue-003', issueContent: content });
          return '中';
        }
        return '中';
      }),
    };

    // 課題優先度判定ロジックを実行：登録順序（A→B→C）で投入
    const resultA = calculateIssuePriorityScore(issueA, mockTextAnalysisServiceAdapter);
    const resultB = calculateIssuePriorityScore(issueB, mockTextAnalysisServiceAdapter);
    const resultC = calculateIssuePriorityScore(issueC, mockTextAnalysisServiceAdapter);

    // 結果の検証：優先度ランクがすべて「中」であることを確認
    expect(resultA.priorityRank).toBe('中');
    expect(resultB.priorityRank).toBe('中');
    expect(resultC.priorityRank).toBe('中');

    // 優先度スコアが同値の範囲内（40～69）であることを確認
    expect(resultA.priorityScore).toBeGreaterThanOrEqual(40);
    expect(resultA.priorityScore).toBeLessThan(70);
    expect(resultB.priorityScore).toBeGreaterThanOrEqual(40);
    expect(resultB.priorityScore).toBeLessThan(70);
    expect(resultC.priorityScore).toBeGreaterThanOrEqual(40);
    expect(resultC.priorityScore).toBeLessThan(70);

    // 各課題のスコアが計算されていることを検証
    expect(typeof resultA.priorityScore).toBe('number');
    expect(typeof resultB.priorityScore).toBe('number');
    expect(typeof resultC.priorityScore).toBe('number');

    // scoreBreakdownが正しく計算されていることを確認
    expect(resultA.scoreBreakdown).toBeDefined();
    expect(resultA.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(resultA.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(resultA.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(resultA.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(resultA.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(resultA.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    // colorCodeが適切に設定されていることを確認（中優先度は黄色）
    expect(resultA.colorCode).toBe('#FFFF00');
    expect(resultB.colorCode).toBe('#FFFF00');
    expect(resultC.colorCode).toBe('#FFFF00');

    // calculatedAtがISO 8601形式で設定されていることを確認
    expect(resultA.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // TextAnalysisServiceAdapterのclassifyIssueSeverityが3回呼び出されたことを確認
    expect(classifyIssueSeverityCallCount).toBe(3);

    // 呼び出し順序が登録順序と一致することを確認
    expect(callTracker.length).toBe(3);
    expect(callTracker[0].issueId).toBe('issue-001');
    expect(callTracker[1].issueId).toBe('issue-002');
    expect(callTracker[2].issueId).toBe('issue-003');

    // 各課題のissueIdが正しく保持されていることを確認
    expect(resultA.issueId).toBe('issue-001');
    expect(resultB.issueId).toBe('issue-002');
    expect(resultC.issueId).toBe('issue-003');
  });
});