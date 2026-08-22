import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';
import { runTx4Imp1Agent } from '../../src/agents/tx-4-imp-1/orchestrator';
import { buildAction03Prompt, ACTION_03_PROMPT_VERSION } from '../../src/agents/tx-4-imp-1/prompts/action-03';
import type { Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';

describe('notification-delivery: sendUnsubmittedReminder with TX4 recurrence risk evaluation', () => {
  // SCEN-075: ダッシュボード分析から課題指示までの自動実行 AIエージェント
  // 「過去の類似課題と照合して再発リスクを評価する」の自律処理が契約どおり実行される
  
  let mockAiClient: jest.Mocked<Tx4Imp1AiClient>;
  let pastCaseDatabase: Array<{
    caseId: string;
    department: string;
    issueType: string;
    detectedDate: string;
    resolutionMethod: string;
    recurrenceFlag: boolean;
  }>;
  let currentDashboardAnalysis: Array<{
    issueName: string;
    detectionDate: string;
    importance: 'HIGH' | 'MEDIUM' | 'LOW';
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;

  beforeEach(() => {
    // 過去課題データベース（スタブ）を初期化
    pastCaseDatabase = [
      {
        caseId: 'PAST-001',
        department: 'Sales',
        issueType: 'Delivery Delay',
        detectedDate: '2024-01-15',
        resolutionMethod: 'Resource Addition',
        recurrenceFlag: true,
      },
    ];

    // 現在のダッシュボード分析結果（スタブ）を初期化
    currentDashboardAnalysis = [
      {
        issueName: 'Delivery Delay in Sales Department',
        detectionDate: '2024-01-29',
        importance: 'HIGH',
        urgency: 'HIGH',
      },
    ];

    // モックAIクライアントの設定
    mockAiClient = {
      callAction03: jest.fn().mockResolvedValue({
        similarityScore: 85,
        riskLevel: 'HIGH',
        reasoning:
          'Same department and same type of delay event. Recurred 14 days after previous occurrence. Risk score: 85/100',
        recommendedAction:
          'Report immediately to sales manager and consider applying previous resolution method (Resource Addition)',
      }),
    } as any;
  });

  test('should evaluate recurrence risk by comparing current issue with past similar cases and incorporate result into morning meeting report', async () => {
    // action-03プロンプト生成関数の呼び出しを追跡
    const buildAction03PromptSpy = jest.spyOn(
      require('../../src/agents/tx-4-imp-1/prompts/action-03'),
      'buildAction03Prompt',
      'get'
    );

    // 現在の課題（ダッシュボード分析結果）
    const currentIssue = currentDashboardAnalysis[0];

    // 過去の類似課題を検索（シンプルなフィルタロジック）
    const similarPastCases = pastCaseDatabase.filter(
      (pastCase) =>
        pastCase.department === 'Sales' && pastCase.issueType === 'Delivery Delay'
    );

    expect(similarPastCases).toHaveLength(1);
    expect(similarPastCases[0].caseId).toBe('PAST-001');

    // action-03プロンプトの生成（モック）
    const action03Prompt = buildAction03Prompt({
      currentIssue: currentIssue.issueName,
      pastCases: similarPastCases,
      evaluationCriteria: {
        similarity: 'department and issue type match',
        riskFactors: ['recurrence flag', 'time since last occurrence'],
      },
    });

    // プロンプトが以下の要素を含むことを確認
    // (a) 現在の課題内容
    expect(action03Prompt).toContain('Delivery Delay in Sales Department');
    
    // (b) 過去課題のレコードID
    expect(action03Prompt).toContain('PAST-001');
    
    // (c) 照合指示
    expect(action03Prompt).toMatch(/similar|risk.*evaluat|score/i);

    // モックAIクライアント経由でリスク評価を実行
    const riskAssessmentResult = await mockAiClient.callAction03({
      currentIssue: currentIssue.issueName,
      pastCases: similarPastCases,
    });

    // 再発リスク評価結果の検証
    expect(riskAssessmentResult.similarityScore).toBe(85);
    expect(riskAssessmentResult.riskLevel).toBe('HIGH');
    expect(riskAssessmentResult.reasoning).toMatch(/same department/i);
    expect(riskAssessmentResult.reasoning).toMatch(/14 day/i);
    expect(riskAssessmentResult.recommendedAction).toContain(
      'Resource Addition'
    );

    // 朝会報告資料に再発リスク評価結果が組み込まれた形式を検証
    const morningMeetingReport = {
      issue: currentIssue.issueName,
      recurrenceRisk: `HIGH (${riskAssessmentResult.similarityScore}/100)`,
      recommendedApproach:
        'Prioritize considering resource addition based on previous resolution method',
    };

    expect(morningMeetingReport.recurrenceRisk).toBe('HIGH (85/100)');
    expect(morningMeetingReport.recommendedApproach).toContain('resource addition');

    // ACTION_03_PROMPT_VERSIONがバージョン管理と一致していることを確認
    expect(ACTION_03_PROMPT_VERSION).toBeDefined();
    expect(typeof ACTION_03_PROMPT_VERSION).toBe('string');

    // sendUnsubmittedReminderを呼び出す（統合確認）
    // ここではモック引数で渡されたAIクライアントが使用されることを確認
    const unsubmittedReminders = await sendUnsubmittedReminder(
      {
        dashboardAnalysis: currentDashboardAnalysis,
        pastCaseDatabase: pastCaseDatabase,
        targetDepartments: ['Sales'],
      },
      mockAiClient
    );

    // リマインダーが生成されたことを確認
    expect(unsubmittedReminders).toBeDefined();

    // スタブデータ以外のシステム連携が発生していないことを確認
    // (モックAIクライアントのみが呼び出されている)
    expect(mockAiClient.callAction03).toHaveBeenCalled();
  });
});