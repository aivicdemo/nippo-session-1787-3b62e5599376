import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題影響度判定機能 - 優先度スコア算出', () => {
  // SCEN-211
  test('抽出された課題に対してOpenAI APIが正常応答し、チーム波及度スコアが算出される', async () => {
    // Arrange: TextAnalysisServiceAdapter のスタブを準備
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'サーバーダウン', frequency: 5 },
        { keyword: '納期遅延', frequency: 3 },
        { keyword: 'メモリリーク', frequency: 2 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(65),
      classifyIssueSeverity: jest.fn(),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'サーバーダウンが発生し、複数チームが影響を受けた',
      occurrenceFrequency: 5,
      impactScore: 65,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-01',
    };

    // Act: calculateIssuePriorityScore を呼び出し
    const startTime = Date.now();
    const result: IssuePriorityScoringOutput = await calculateIssuePriorityScore(
      input,
      mockTextAnalysisServiceAdapter
    );
    const responseTime = Date.now() - startTime;

    // Assert: 戻り値の検証
    expect(result).toBeDefined();
    expect(result.issueId).toBe('issue-001');
    expect(typeof result.priorityScore).toBe('number');
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.priorityScore).toBe(65);
    expect(result.priorityRank).toBe('中');
    expect(result.scoreBreakdown).toBeDefined();
    expect(typeof result.scoreBreakdown.frequencyScore).toBe('number');
    expect(typeof result.scoreBreakdown.impactScore).toBe('number');
    expect(typeof result.scoreBreakdown.resolutionDifficultyScore).toBe('number');
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/);
    expect(result.calculatedAt).toBeDefined();
    expect(responseTime).toBeLessThan(30000);

    // スタブが正しく呼び出されたことを確認
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
  });
});