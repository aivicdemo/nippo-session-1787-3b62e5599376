import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題影響度判定・優先度スコア算出機能', () => {
  test('SCEN-1635: TextAnalysisServiceAdapter.assessImpactScore がタイムアウトに達したとき、リトライを実行し全て失敗後はエラーを返す', async () => {
    // Setup: タイムアウトエラーをシミュレートするスタブ
    const timeoutError = new Error('Request timeout after 30000ms');
    (timeoutError as any).statusCode = 408;

    let callCount = 0;
    const mockAssessImpactScore = jest.fn().mockImplementation(() => {
      callCount++;
      return Promise.reject(timeoutError);
    });

    // リトライ設定（3秒・10秒・30秒のインターバルで最大3回再試行）
    const retryPolicy = {
      maxRetries: 3,
      intervals: [3000, 10000, 30000],
      timeoutMs: 30000,
    };

    // TextAnalysisServiceAdapter スタブ
    const mockTextAnalysisAdapter = {
      assessImpactScore: mockAssessImpactScore,
    };

    const issuePriorityInput: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: '本番環境クラッシュ',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T10:00:00Z',
      teamId: 'TEAM-001',
    };

    // 実行: calculateIssuePriorityScore を呼び出す
    // TextAnalysisServiceAdapter がタイムアウトを返すシナリオ
    let result: IssuePriorityScoringOutput | null = null;
    let thrownError: Error | null = null;

    try {
      result = await calculateIssuePriorityScore(
        issuePriorityInput,
        mockTextAnalysisAdapter as any
      );
    } catch (error) {
      thrownError = error as Error;
    }

    // 検証: リトライが実行されたことを確認
    expect(callCount).toBe(4); // 初回呼び出し + 再試行3回

    // エラーが返されたことを確認
    expect(thrownError).toBeDefined();
    expect(thrownError?.message).toMatch(/タイムアウト|timeout/i);

    // スコア算出結果が null になることを確認
    expect(result).toBeNull();

    // 内部ログに4回の呼び出し試行記録があることを確認（呼び出し回数で検証）
    expect(mockAssessImpactScore).toHaveBeenCalledTimes(4);
  });
});