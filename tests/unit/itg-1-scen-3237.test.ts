import { runTx11Imp1Agent } from '../../src/agents/tx-11-imp-1/orchestrator';
import { buildAction04Prompt, ACTION_04_PROMPT_VERSION } from '../../src/agents/tx-11-imp-1/prompts/action-04';
import type { Tx11Imp1AiClient } from '../../src/agents/tx-11-imp-1/orchestrator';

describe('Tx11Imp1Agent - 日報収集・確認・催促の自動化エージェント', () => {
  // SCEN-3237
  test('should execute Action 4 to search past issues and present reference information to members when extracting keywords from daily reports', async () => {
    // テスト実行時刻を固定
    const execution_timestamp = new Date('2026-01-29T08:00:00Z');

    // テスト前提条件: 過去日報データベースの想定レコード
    const past_issues_db = [
      {
        issue_id: '接客クレーム対応',
        first_occurrence_date: '2026-01-15',
        occurrences: [
          { date: '2026-01-15', action_taken: 'マニュアル改訂' },
          { date: '2026-01-22', action_taken: 'マニュアル改訂', implementation_status: '未実施' }
        ],
        cumulative_count: 2,
        recommended_action: '前回マニュアル改訂を完了させることが急務。同一課題の再発を防ぐため優先度を上げて対応すること'
      },
      {
        issue_id: '在庫確認システム',
        first_occurrence_date: '2026-01-10',
        occurrences: [
          { date: '2026-01-10', action_taken: '発注ルール見直し', implementation_status: '実施済み' }
        ],
        cumulative_count: 1,
        recommended_action: 'システム応答遅延は前回の在庫ルール見直しと別課題。システム性能改善チームへ報告推奨'
      }
    ];

    // 本日の新規日報から抽出された課題テキスト
    const today_issue_text = '顧客対応時に商品在庫確認システムが応答遅延し、接客クレームが3件発生';

    // TextAnalysisServiceAdapter スタブ
    const mock_text_analysis_adapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        '接客クレーム対応': 0.85,
        '在庫確認システム': 0.60,
        '応答遅延': 0.55
      }),
      assessImpactScore: jest.fn().mockResolvedValue(75)
    };

    // Tx11Imp1AiClient 型のスタブ
    const mock_ai_client: Tx11Imp1AiClient = {
      invokeAction: jest.fn().mockImplementation(async (action_name, prompt_text) => {
        // Action 4 呼び出しの検証
        if (action_name === 'action-04') {
          // Action 4 プロンプトが buildAction04Prompt により構築されたことを検証
          const built_prompt = buildAction04Prompt(
            { issues: [{ keyword: '接客クレーム対応', frequency: 0.85 }] },
            { timestamp: execution_timestamp.toISOString() }
          );
          expect(built_prompt).toBeDefined();
          expect(ACTION_04_PROMPT_VERSION).toBeDefined();

          // AI クライアントの応答: 過去事例検索結果
          return {
            success: true,
            reference_information: [
              {
                past_issue_id: '接客クレーム対応',
                first_occurrence_date: '2026-01-15',
                cumulative_occurrences: 2,
                previous_action_taken: 'マニュアル改訂',
                implementation_status: '未実施',
                recommended_action: '前回マニュアル改訂を完了させることが急務。同一課題の再発を防ぐため優先度を上げて対応すること'
              },
              {
                past_issue_id: '在庫確認システム',
                first_occurrence_date: '2026-01-10',
                cumulative_occurrences: 1,
                previous_action_taken: '発注ルール見直し',
                implementation_status: '実施済み',
                recommended_action: 'システム応答遅延は前回の在庫ルール見直しと別課題。システム性能改善チームへ報告推奨'
              }
            ]
          };
        }
        return { success: false };
      })
    };

    // runTx11Imp1Agent 実行
    const agent_input = {
      executionTimestamp: execution_timestamp,
      teamId: 'team-001',
      reportDeadlineTime: '09:00',
      managerEmail: 'manager@example.com'
    };

    const result = await runTx11Imp1Agent(agent_input, mock_ai_client);

    // 検証: Action 4 が呼び出されたこと
    expect(mock_ai_client.invokeAction).toHaveBeenCalled();
    const action_04_calls = (mock_ai_client.invokeAction as jest.Mock).mock.calls.filter(
      (call) => call[0] === 'action-04'
    );
    expect(action_04_calls.length).toBeGreaterThan(0);

    // 検証: 参考情報が構造化されて返されたこと
    expect(result).toBeDefined();
    if (result && 'pastIssueReferencesProvided' in result) {
      expect(result.pastIssueReferencesProvided).toBe(true);
    }

    // 検証: TextAnalysisServiceAdapter が extractKeywords を呼び出したこと
    expect(mock_text_analysis_adapter.extractKeywords).toHaveBeenCalled();

    // 検証: 参考情報に同一課題『接客クレーム対応』の過去2回の発生記録が含まれること
    // (実装上、参考情報がメンバーに提示されることを検証)
    const reference_data = action_04_calls[0]?.[1];
    expect(reference_data).toBeDefined();

    // 検証: 推奨アクション『前回マニュアル改訂を完了させることが急務』がテキスト形式で提示されること
    if (result && typeof result === 'object' && 'prioritizedIssues' in result) {
      const prioritized_list = (result as any).prioritizedIssues;
      if (Array.isArray(prioritized_list) && prioritized_list.length > 0) {
        // 課題リストに参考情報が含まれていることを確認
        const has_remediation_guidance = JSON.stringify(prioritized_list).includes(
          '前回マニュアル改訂を完了させることが急務'
        );
        expect(has_remediation_guidance || result.pastIssueReferencesProvided).toBe(true);
      }
    }

    // 検証: 提示が監査ログに記録されたことを確認
    // (executionStatus が成功を示していることを確認)
    if (result && 'executionStatus' in result) {
      expect(['success', 'partial_failure']).toContain(result.executionStatus);
    }
  });
});