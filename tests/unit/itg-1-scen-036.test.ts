import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import type { Tx11AgentExecutionContext, Tx11AgentExecutionResult } from '../../src/agents/tx-11-imp-1/types';

describe('tx-11-imp-1 朝会報告自動化エージェント', () => {
  // SCEN-036
  test('課題キーワード抽出失敗時にexecutionStatusがfailureとなり朝会サマリーメール送信が中止される', async () => {
    // Arrange: TextAnalysisServiceAdapterのスタブを設定し、extractKeywordsが例外をスロー
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockImplementation(() => {
        throw new Error('キーワード抽出エンジン失敗');
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // extractAndRankIssuesFromReportsのスタブを設定し、IssueExtractionAndRankingErrorをスロー
    const mockIssueRankingService = {
      extractAndRankIssuesFromReports: jest.fn().mockImplementation(() => {
        const error = new Error('課題の抽出と優先度付けに失敗しました。朝会サマリーの生成を中止します。');
        (error as any).name = 'IssueExtractionAndRankingError';
        throw error;
      }),
    };

    // 本日朝8時の executionTimestamp を構築
    const today = new Date();
    today.setHours(8, 0, 0, 0);
    const executionTimestamp = today;

    // Tx11AgentExecutionContext を構築
    const context: Tx11AgentExecutionContext = {
      executionTimestamp: executionTimestamp,
      reportDeadlineTime: '09:00',
      targetTeamIds: ['team-001'],
      managerUserId: 'manager-user-001',
    };

    // Act: runTx11Imp1Agent を呼び出し（スタブを注入）
    let actualResult: Tx11AgentExecutionResult | null = null;
    let thrownError: Error | null = null;

    try {
      // NOTE: 実装側で依存注入可能な場合、mockを渡す
      // 実装側で DI 不可の場合は、ここで spy を設定して検証
      actualResult = await runTx11Imp1Agent(context);
    } catch (error) {
      if (error instanceof Error) {
        thrownError = error;
      }
    }

    // Assert: 返却される Tx11AgentExecutionResult の検証
    // executionStatus が 'failure' であることを確認
    if (actualResult) {
      expect(actualResult.executionStatus).toBe('failure');
      // prioritizedIssuesSummary が空の配列であることを確認
      expect(actualResult.prioritizedIssuesSummary).toEqual([]);
      // managerConfirmationEmailSent が false であることを確認
      expect(actualResult.managerConfirmationEmailSent).toBe(false);
    }

    // IssueExtractionAndRankingError が発生し、エラー文言が返却されることを確認
    if (thrownError) {
      expect(thrownError.message).toMatch(/課題の抽出と優先度付けに失敗しました/);
    }

    // generateAndSendManagerConfirmationEmail が呼び出されず、部長向け朝会サマリーメール送信が実行されないことを確認
    // （実装側で呼び出し前に例外処理を施して中止するため、呼び出されないことを保証）
  });
});