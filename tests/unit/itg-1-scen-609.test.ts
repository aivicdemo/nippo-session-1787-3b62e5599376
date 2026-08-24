import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能', () => {
  // SCEN-609: [normal] 課題優先度スコア計算機能 - チーム波及度が高い課題は優先度スコアに正反映される
  test('チーム波及度スコアが高い場合、優先度スコアが低波及度の場合より高い値となること', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // 高波及度スコア（75）での計算
    mockTextAnalysisServiceAdapter.assessImpactScore.mockReturnValue(75);

    const highImpactInput = {
      issueId: 'ISSUE-001',
      issueContent: 'サーバー障害により全サービス停止',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T10:00:00Z',
      teamId: 'TEAM-A',
    };

    const highImpactResult = calculateIssuePriorityScore(
      highImpactInput,
      mockTextAnalysisServiceAdapter
    );

    // 低波及度スコア（30）での計算
    mockTextAnalysisServiceAdapter.assessImpactScore.mockReturnValue(30);

    const lowImpactInput = {
      issueId: 'ISSUE-002',
      issueContent: 'サーバー障害により全サービス停止',
      occurrenceFrequency: 5,
      impactScore: 30,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T10:00:00Z',
      teamId: 'TEAM-A',
    };

    const lowImpactResult = calculateIssuePriorityScore(
      lowImpactInput,
      mockTextAnalysisServiceAdapter
    );

    // 高波及度スコア（75）の場合の優先度スコアが、低波及度スコア（30）の場合より高いことを確認
    expect(highImpactResult.priorityScore).toBeGreaterThan(
      lowImpactResult.priorityScore
    );

    // 計算結果に波及度スコアが反映されていることを確認
    expect(highImpactResult.scoreBreakdown.impactScore).toBe(40);
    expect(lowImpactResult.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(
      0
    );

    // 外部サービス（assessImpactScore）が呼び出されたことを確認
    expect(
      mockTextAnalysisServiceAdapter.assessImpactScore
    ).toHaveBeenCalled();

    // 高波及度の優先度ランクが「高」であることを確認
    expect(highImpactResult.priorityRank).toBe('高');

    // 高波及度の色コードが赤であることを確認
    expect(highImpactResult.colorCode).toBe('#FF0000');

    // 優先度スコアが1～100の範囲内であることを確認
    expect(highImpactResult.priorityScore).toBeGreaterThanOrEqual(1);
    expect(highImpactResult.priorityScore).toBeLessThanOrEqual(100);
  });
});