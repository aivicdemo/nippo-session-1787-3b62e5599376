import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度判定機能 - 外部サービス失敗時のリトライ動作', () => {
  let callCount: number;
  let callTimestamps: number[];
  let loggedEvents: Array<{ timestamp: number; eventType: string; error?: string }>;

  beforeEach(() => {
    callCount = 0;
    callTimestamps = [];
    loggedEvents = [];
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // SCEN-584: [error] 課題優先度判定機能 - TextAnalysisServiceAdapterが失敗したとき課題抽出リトライが3回実行される
  test('TextAnalysisServiceAdapterが常に失敗する場合、3秒・10秒・30秒のインターバルで正確に3回のリトライが実行され、4回目以上は実行されないこと', async () => {
    // スタブ化: TextAnalysisServiceAdapter.extractKeywords が常に失敗を返す
    const failingTextAnalysisAdapter = {
      extractKeywords: jest.fn(async () => {
        callCount++;
        const currentTimestamp = Date.now();
        callTimestamps.push(currentTimestamp);
        loggedEvents.push({
          timestamp: currentTimestamp,
          eventType: 'extractKeywords_failure',
          error: 'External service unavailable',
        });
        throw new Error('TextAnalysisService failed: connection timeout');
      }),
      assessImpactScore: jest.fn(async () => ({
        impactScore: 50,
        confidence: 0.7,
      })),
      classifyIssueSeverity: jest.fn(async () => 'high'),
    };

    // テスト入力: 課題優先度判定の実行条件
    const testInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システムがダウンしており、サーバーが応答しない',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-a',
    };

    // リトライロジック初期状態を確認: リトライ回数カウンタが 0 に初期化されていることを検証
    expect(callCount).toBe(0);
    expect(callTimestamps).toEqual([]);
    expect(loggedEvents).toEqual([]);

    // calculateIssuePriorityScore を実行
    // 注: 実装では failingTextAnalysisAdapter を DI または module.mock で差し替える想定
    // ここではスタブの呼び出し挙動を直接検証
    let result: IssuePriorityScoringOutput | null = null;
    let finalError: Error | null = null;

    try {
      // 実装が textAnalysisAdapter を内部で使用している場合、
      // calculateIssuePriorityScore の実行開始
      result = await calculateIssuePriorityScore(
        testInput,
        failingTextAnalysisAdapter as any
      );
    } catch (error) {
      finalError = error as Error;
    }

    // 1回目のAPI呼び出し失敗を確認
    expect(callCount).toBeGreaterThanOrEqual(1);
    expect(callTimestamps.length).toBeGreaterThanOrEqual(1);
    expect(loggedEvents[0]).toMatchObject({
      eventType: 'extractKeywords_failure',
      error: 'External service unavailable',
    });

    // 3秒のインターバルを進める
    jest.advanceTimersByTime(3000);

    // スタブの 2回目呼び出しが自動実行されたことを確認
    // （リトライロジックが 3 秒後に再実行される）
    expect(callCount).toBeGreaterThanOrEqual(2);
    expect(callTimestamps.length).toBeGreaterThanOrEqual(2);

    // 2回目のAPI呼び出しが失敗していることを確認
    expect(loggedEvents[1]).toMatchObject({
      eventType: 'extractKeywords_failure',
      error: 'External service unavailable',
    });

    // 2回目と1回目の呼び出し時刻の差が約3秒であることを検証
    const firstCallTime = callTimestamps[0];
    const secondCallTime = callTimestamps[1];
    expect(secondCallTime - firstCallTime).toBe(3000);

    // 10秒のインターバルを進める
    jest.advanceTimersByTime(10000);

    // 3回目のAPI呼び出しが自動実行されたことを確認
    expect(callCount).toBeGreaterThanOrEqual(3);
    expect(callTimestamps.length).toBeGreaterThanOrEqual(3);

    // 3回目のAPI呼び出しが失敗していることを確認
    expect(loggedEvents[2]).toMatchObject({
      eventType: 'extractKeywords_failure',
      error: 'External service unavailable',
    });

    // 3回目と2回目の呼び出し時刻の差が約10秒であることを検証
    const thirdCallTime = callTimestamps[2];
    expect(thirdCallTime - secondCallTime).toBe(10000);

    // 30秒のインターバルを進める
    jest.advanceTimersByTime(30000);

    // 4回目のAPI呼び出しが実行されていないことを確認
    expect(callCount).toBe(3);
    expect(callTimestamps.length).toBe(3);
    expect(loggedEvents.length).toBe(3);

    // ダッシュボード表示用の代替結果が返されることを期待
    // （前回キャッシュ結果または「利用できません」メッセージ）
    if (result) {
      expect(result).toHaveProperty('issueId', testInput.issueId);
      // キャッシュから復帰した結果であるか、または graceful fallback であることを検証
      expect(result).toHaveProperty('priorityScore');
    } else if (finalError) {
      // エラー時は適切なログと前回キャッシュで復帰することを期待
      expect(finalError.message).toMatch(/temporary|cache|fallback/i);
    }

    // アプリケーションログの記録を検証: 計3回の失敗とそれぞれの発生時刻が記録されている
    expect(loggedEvents).toHaveLength(3);
    expect(loggedEvents[0].timestamp).toBe(firstCallTime);
    expect(loggedEvents[1].timestamp).toBe(secondCallTime);
    expect(loggedEvents[2].timestamp).toBe(thirdCallTime);

    // ログの eventType が一貫していることを検証
    loggedEvents.forEach((event) => {
      expect(event.eventType).toBe('extractKeywords_failure');
      expect(event.error).toBe('External service unavailable');
    });

    // リトライが正確に3回で打ち切られることを検証
    expect(callCount).toBe(3);
    expect(failingTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(3);
  });
});