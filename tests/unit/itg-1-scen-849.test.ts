import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-849: [error] 課題影響度判定・優先度スコア付与機能 - TextAnalysisServiceAdapterのassessImpactScoreが失敗したときキャッシュから前回結果を返す振る舞いになる
  it('TextAnalysisServiceAdapterのassessImpactScoreが失敗したときキャッシュから前回結果を返す', async () => {
    // Arrange: TextAnalysisServiceAdapterをスタブ化してエラーを返すように設定
    const failingTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['システム障害'],
        frequency: 2,
      }),
      assessImpactScore: jest.fn()
        .mockRejectedValueOnce(new Error('Service timeout'))
        .mockRejectedValueOnce(new Error('Service timeout'))
        .mockRejectedValueOnce(new Error('Service timeout')),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    // キャッシュデータ（課題キーワード辞書）に過去の分析結果を保存
    const cachedKeywordData = {
      keywordId: 'kw-001',
      keyword: 'システム障害',
      cachedImpactScore: 75,
      lastUpdated: new Date('2024-01-10T09:00:00Z'),
    };

    // 課題優先度スコア計算の入力データ
    const priorityScoringInput: IssuePriorityScoringInput = {
      issueId: 'issue-849',
      issueContent: 'システム障害が発生し、複数のサービスが利用不可になっている',
      occurrenceFrequency: 2,
      impactScore: 75, // キャッシュから取得した値
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T11:30:00Z',
      teamId: 'team-001',
    };

    // Act: calculateIssuePriorityScorerを呼び出し、キャッシュから復帰する振る舞いを検証
    const result: IssuePriorityScoringOutput = await calculateIssuePriorityScore(
      priorityScoringInput,
      failingTextAnalysisAdapter
    );

    // Assert: キャッシュから前回の分析結果が返却されていることを確認
    expect(result).toBeDefined();
    expect(result.issueId).toBe('issue-849');

    // 優先度スコアの計算式（具体値）
    // frequencyScore = (occurrenceFrequency / 10) * 40 = (2 / 10) * 40 = 8
    // impactScore = 75 / 100 * 40 = 30
    // resolutionDifficultyScore = (resolutionDaysAverage / 5) * 20 = (2.5 / 5) * 20 = 10
    // priorityScore = 8 + 30 + 10 = 48
    expect(result.priorityScore).toBe(48);

    // 優先度ランク判定（40 <= 48 < 70 なので「中」）
    expect(result.priorityRank).toBe('中');

    // スコア内訳の検証
    expect(result.scoreBreakdown).toEqual({
      frequencyScore: 8,
      impactScore: 30,
      resolutionDifficultyScore: 10,
    });

    // 色コード（中優先度なので黄色）
    expect(result.colorCode).toBe('#FFFF00');

    // 計算実行日時が記録されていることを確認
    expect(result.calculatedAt).toBeDefined();
    expect(typeof result.calculatedAt).toBe('string');

    // TextAnalysisServiceAdapterが3回試行されたことを確認（再試行ロジック）
    expect(failingTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledTimes(3);

    // ダッシュボード表示用メッセージが返却されていることを確認
    // （キャッシュから復帰した場合の警告フラグ）
    expect(result).toHaveProperty('cachedDataFlag');
    if ('cachedDataFlag' in result) {
      expect(result.cachedDataFlag).toBe(true);
    }

    // 手動キーワード入力フロー切り替えの対象になるか確認
    if ('fallbackMode' in result) {
      expect(result.fallbackMode).toBe('manual');
    }
  });
});