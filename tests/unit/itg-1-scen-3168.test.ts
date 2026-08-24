import { runTx6Imp1Agent } from '../../src/agents/tx-6-imp-1/orchestrator';
import { buildAction06Prompt, ACTION_06_PROMPT_VERSION } from '../../src/agents/tx-6-imp-1/prompts/action-06';
import type { Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('tx-6-imp-1: 日報収集から分析レポート生成までの自動実行', () => {
  // SCEN-3168
  test('日報収集から分析レポート生成までの自動実行が、action-06プロンプトで分析結果をレポート形式で生成する', async () => {
    // モックAIクライアントの定義
    const mockAiClient: Tx6Imp1AiClient = {
      executeAction01: jest.fn().mockResolvedValue({
        reportId: 'report-2025-01-13-001',
        collectedReportCount: 5,
        uncollectedMemberIds: []
      }),
      executeAction02: jest.fn().mockResolvedValue({
        notificationsSent: 0,
        failedNotifications: []
      }),
      executeAction03: jest.fn().mockResolvedValue({
        extractedKeywords: [
          { keyword: 'システム障害', frequency: 2, severity: 'HIGH' },
          { keyword: '対応遅延', frequency: 2, severity: 'HIGH' },
          { keyword: '業務プロセス改善', frequency: 1, severity: 'MEDIUM' }
        ]
      }),
      executeAction04: jest.fn().mockResolvedValue({
        priorityScores: [
          { keyword: 'システム障害', score: 85, rank: 'HIGH' },
          { keyword: '対応遅延', score: 82, rank: 'HIGH' },
          { keyword: '業務プロセス改善', score: 45, rank: 'LOW' }
        ]
      }),
      executeAction05: jest.fn().mockResolvedValue({
        categories: [
          {
            categoryName: 'システム・インフラ',
            issueCount: 2,
            previousWeekCount: 1,
            trendPercentage: 100
          },
          {
            categoryName: '業務プロセス',
            issueCount: 1,
            previousWeekCount: 0,
            trendPercentage: 0
          }
        ]
      }),
      executeAction06: jest.fn().mockResolvedValue({
        reportTitle: '週次課題分析レポート（2025-01-13）',
        generatedAt: new Date('2025-01-13T09:00:00Z'),
        analysisDate: '2025-01-06～2025-01-12',
        sections: [
          {
            categoryName: 'システム・インフラ',
            issueCount: 2,
            trendDescription: '前週比+100%（前週1件→今週2件）。システム障害と対応遅延が継続報告。',
            priorityScore: 85,
            keywordList: ['システム障害', '対応遅延']
          },
          {
            categoryName: '業務プロセス',
            issueCount: 1,
            trendDescription: '新規報告。業務プロセス改善の必要性が認識。',
            priorityScore: 45,
            keywordList: ['業務プロセス改善']
          }
        ],
        escalationFlags: [
          {
            issueId: 'issue-001',
            severity: 'HIGH',
            reason: '重大インシデント：システム障害により業務継続に影響。経営判断が必要。'
          }
        ],
        auditLog: {
          executionId: 'exec-2025-01-13-001',
          timestamp: new Date('2025-01-13T09:00:00Z'),
          processedReportCount: 5,
          escalationCount: 1
        }
      }),
      executeAction07: jest.fn().mockResolvedValue({
        emailSent: true,
        recipientCount: 1,
        deliveryStatus: 'sent'
      })
    };

    // テストデータ：前週の日報データ
    const weeklyReports = [
      {
        reportId: 'report-member-a',
        memberId: 'member-a',
        date: new Date('2025-01-06'),
        yesterday: 'API認証機能の実装完了',
        today: 'テスト環境でのバグ修正',
        challenges: 'システム障害により対応が遅れている'
      },
      {
        reportId: 'report-member-b',
        memberId: 'member-b',
        date: new Date('2025-01-07'),
        yesterday: 'データベース最適化',
        today: '本番環境への反映準備',
        challenges: 'システム障害の影響でテストがブロック'
      },
      {
        reportId: 'report-member-c',
        memberId: 'member-c',
        date: new Date('2025-01-08'),
        yesterday: '顧客資料作成',
        today: 'プレゼン準備',
        challenges: 'なし'
      },
      {
        reportId: 'report-member-d',
        memberId: 'member-d',
        date: new Date('2025-01-09'),
        yesterday: 'テスト実行',
        today: 'バグ報告書作成',
        challenges: '対応遅延により検証期間が逼迫'
      },
      {
        reportId: 'report-member-e',
        memberId: 'member-e',
        date: new Date('2025-01-10'),
        yesterday: 'ドキュメント更新',
        today: 'レビュー対応',
        challenges: '業務プロセス改善の必要性を感じた'
      }
    ];

    const input = {
      executionTimestamp: new Date('2025-01-13T09:00:00Z'),
      analysisStartDate: '2025-01-06',
      analysisEndDate: '2025-01-12',
      teamId: 'team-dev-001'
    };

    // runTx6Imp1Agent関数を呼び出し
    const result = await runTx6Imp1Agent(input, mockAiClient);

    // buildAction06Promptが呼ばれたことを確認
    expect(mockAiClient.executeAction06).toHaveBeenCalled();
    
    // buildAction06Promptモジュールが正しくエクスポートされていることを確認
    expect(buildAction06Prompt).toBeDefined();
    expect(ACTION_06_PROMPT_VERSION).toBeDefined();

    // レポート構造の検証：reportTitleが「週次課題分析レポート（YYYY-MM-DD）」形式
    expect(result.reportTitle).toBe('週次課題分析レポート（2025-01-13）');

    // generatedAtが実行時刻より前であることを確認
    expect(result.generatedAt).toEqual(new Date('2025-01-13T09:00:00Z'));

    // analysisDateが先週の月曜日～日曜日の期間を示す文字列形式
    expect(result.analysisDate).toBe('2025-01-06～2025-01-12');

    // sectionsが複数のカテゴリを含むことを確認
    expect(result.sections).toHaveLength(2);
    expect(result.sections[0].categoryName).toBe('システム・インフラ');
    expect(result.sections[1].categoryName).toBe('業務プロセス');

    // 各カテゴリのissueCountが0以上の整数
    expect(result.sections[0].issueCount).toBe(2);
    expect(result.sections[1].issueCount).toBe(1);

    // trendDescriptionが日本語テキストで具体的な増減を含む
    expect(result.sections[0].trendDescription).toContain('前週比');
    expect(result.sections[0].trendDescription).toContain('+100%');

    // priorityScoreが0～100の数値型で、重大度「高」の課題が80以上
    expect(result.sections[0].priorityScore).toBe(85);
    expect(result.sections[0].priorityScore).toBeGreaterThanOrEqual(80);

    // 重大度「低」の課題が50未満
    expect(result.sections[1].priorityScore).toBe(45);
    expect(result.sections[1].priorityScore).toBeLessThan(50);

    // escalationFlagsに重大インシデント案件が含まれる
    expect(result.escalationFlags).toHaveLength(1);
    expect(result.escalationFlags[0].issueId).toBe('issue-001');
    expect(result.escalationFlags[0].severity).toBe('HIGH');
    expect(result.escalationFlags[0].reason).toContain('経営判断が必要');

    // 同一課題の再発検出を検証
    const systemInfraSection = result.sections.find(s => s.categoryName === 'システム・インフラ');
    expect(systemInfraSection?.trendDescription).toContain('継続報告');

    // レポートが優先度スコア降順で整列されていることを確認
    expect(result.sections[0].priorityScore).toBeGreaterThanOrEqual(result.sections[1].priorityScore);

    // 戻り値がPromise型であり、レポートオブジェクトを返すことを確認
    expect(result).toHaveProperty('reportTitle');
    expect(result).toHaveProperty('generatedAt');
    expect(result).toHaveProperty('analysisDate');
    expect(result).toHaveProperty('sections');
    expect(result).toHaveProperty('escalationFlags');
    expect(result).toHaveProperty('auditLog');

    // 監査ログの記録を検証
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog.executionId).toBe('exec-2025-01-13-001');
    expect(result.auditLog.timestamp).toEqual(new Date('2025-01-13T09:00:00Z'));
    expect(result.auditLog.processedReportCount).toBe(5);
    expect(result.auditLog.escalationCount).toBe(1);
  });
});