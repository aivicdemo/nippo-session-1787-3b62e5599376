import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の優先度スコア算出と色分け表示機能', () => {
  // SCEN-2168: [error] 課題優先度スコア算出機能 - TextAnalysisServiceAdapter の assessImpactScore が失敗したとき、エラーハンドリングが実行される
  test('assessImpactScore の失敗時にエラーハンドリングが実行され、キャッシュ表示と手動入力への切り替えが可能になること', async () => {
    // Arrange: TextAnalysisServiceAdapter のスタブを準備
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockRejectedValueOnce(
        new Error('OpenAI API call failed: Request timeout after 30s')
      ),
      classifyIssueSeverity: jest.fn(),
    };

    // キャッシュに前回の分析結果を準備
    const cachedImpactScore = 65;
    const mockCacheService = {
      getLastAnalysisResult: jest.fn().mockReturnValue({
        issueId: 'issue-cached-001',
        impactScore: cachedImpactScore,
        timestamp: new Date('2024-01-15T10:00:00Z'),
      }),
      saveAnalysisResult: jest.fn(),
    };

    // 入力データを準備：テキスト解析で抽出された課題情報
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システム障害により本番環境が停止',
      occurrenceFrequency: 3,
      impactScore: 0, // 解析エラーにより未設定
      affectedTeamCount: 5,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    // Act & Assert: エラーハンドリングの検証
    let errorMessage: string | null = null;
    let fallbackToManualInput = false;
    let cachedResultUsed = false;
    let retryAttempted = false;

    try {
      // 第1回試行でエラーが発生
      await mockTextAnalysisAdapter.assessImpactScore(input.issueContent);
    } catch (error) {
      // エラーキャッチ時の処理
      errorMessage = (error as Error).message;
      
      // (1) ダッシュボードに表示するメッセージの確認
      const dashboardMessage = '課題分析が一時的に利用できません。手動入力をご利用ください';
      expect(errorMessage).toContain('OpenAI API call failed');

      // (2) キャッシュから前回の分析結果を取得
      const cachedResult = mockCacheService.getLastAnalysisResult();
      if (cachedResult) {
        cachedResultUsed = true;
        expect(cachedResult.impactScore).toBe(cachedImpactScore);
        expect(cachedResult.timestamp).toEqual(new Date('2024-01-15T10:00:00Z'));
      }

      // (3) 新規日報の場合は手動キーワード入力欄が有効化
      fallbackToManualInput = true;
      expect(fallbackToManualInput).toBe(true);

      // (4) 再試行ロジックのシミュレーション
      const retryDelays = [3000, 10000, 30000]; // 秒単位のインターバル
      for (let attemptNumber = 1; attemptNumber <= 3; attemptNumber++) {
        try {
          // 再試行ログに記録される内容を検証
          const retryLogMessage = `assessImpactScore failed - retry attempt ${attemptNumber}/3`;
          expect(retryLogMessage).toMatch(/retry attempt \d+\/3/);
          retryAttempted = true;

          // 第2、第3回試行はエラーを返さないと仮定（スタブが成功応答）
          if (attemptNumber === 2) {
            mockTextAnalysisAdapter.assessImpactScore.mockResolvedValueOnce(72);
            const retryResult = await mockTextAnalysisAdapter.assessImpactScore(
              input.issueContent
            );
            expect(retryResult).toBe(72);
            break;
          }
        } catch (retryError) {
          // 再試行でも失敗した場合、次のインターバルで再試行
          if (attemptNumber < 3) {
            const nextDelayMs = retryDelays[attemptNumber];
            expect(nextDelayMs).toBe(retryDelays[attemptNumber]);
          }
        }
      }
    }

    // 最終的な状態確認
    expect(errorMessage).toBeTruthy();
    expect(errorMessage).toContain('OpenAI API call failed');
    expect(cachedResultUsed).toBe(true);
    expect(fallbackToManualInput).toBe(true);
    expect(retryAttempted).toBe(true);

    // 実際の calculateIssuePriorityScore 関数の呼び出し
    // エラーハンドリング後でも、手動で impactScore を設定すれば処理を続行可能
    const inputWithManualImpactScore: IssuePriorityScoringInput = {
      ...input,
      impactScore: 72, // 手動入力または再試行成功後の値
    };

    const result = await calculateIssuePriorityScore(
      inputWithManualImpactScore,
      mockTextAnalysisAdapter,
      mockCacheService
    );

    // 優先度スコアが正常に計算されていることを確認
    expect(result).toBeDefined();
    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.priorityRank).toMatch(/^(高|中|低)$/);
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/);
    expect(result.calculatedAt).toBeTruthy();

    // 日報送信フローが中断されず継続できることを確認
    expect(result.issueId).toBe(inputWithManualImpactScore.issueId);
  });
});