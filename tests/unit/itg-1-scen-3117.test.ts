import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import { type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('tx-3-imp-1: 日報集約から優先度別課題一覧提示までの自動判定・配信', () => {
  test('SCEN-3117: 集約済み日報から優先度別課題一覧を自動生成し優先度順に配列', async () => {
    // テストフィクスチャ: 集約済み日報データ
    const aggregatedReportData = {
      reportIds: ['report-001', 'report-002', 'report-003'],
      teamId: 'team-alpha',
      aggregatedAt: '2024-01-15T10:00:00Z',
      reports: [
        {
          memberId: 'member-001',
          yesterdayAccomplishment: 'ユーザー認証機能の実装完了',
          todayPlan: 'API テスト作成',
          challengesText: 'データベース接続がタイムアウトしている。本番環境で頻繁に発生。',
        },
        {
          memberId: 'member-002',
          yesterdayAccomplishment: 'UI コンポーネントのリファクタリング',
          todayPlan: 'レスポンシブデザイン対応',
          challengesText: 'ビルドプロセスが遅い。チーム全体の生産性に影響。',
        },
        {
          memberId: 'member-003',
          yesterdayAccomplishment: '検証ロジック修正',
          todayPlan: 'ドキュメント更新',
          challengesText: 'データベース接続の再試行ロジックが不足。同じ問題が繰り返し発生している。',
        },
      ],
    };

    // Fake AI Client 実装
    const fakeAiClient: Tx3Imp1AiClient = {
      async extractKeywords(reportText: string) {
        // Action 1: 課題キーワード抽出（5～8個、出現頻度付き）
        return {
          keywords: [
            { keyword: 'データベース接続', frequency: 2, context: 'タイムアウトとネットワークエラー' },
            { keyword: 'ビルドプロセス遅延', frequency: 1, context: 'チーム全体の生産性低下' },
            { keyword: '再試行ロジック不足', frequency: 1, context: '同一課題の繰り返し発生' },
            { keyword: 'API テスト環境', frequency: 1, context: '検証環境がない' },
            { keyword: '認証機能実装', frequency: 1, context: 'セキュリティ検証待ち' },
            { keyword: 'UI レスポンシブ対応', frequency: 1, context: 'モバイル対応が未完了' },
          ],
          extractedAt: '2024-01-15T10:15:00Z',
        };
      },

      async classifyCategory(keyword: string) {
        // Action 2: カテゴリ分類
        const categoryMap: Record<string, string> = {
          'データベース接続': 'システム障害',
          'ビルドプロセス遅延': '業務プロセス改善',
          '再試行ロジック不足': 'システム障害',
          'API テスト環境': '業務プロセス改善',
          '認証機能実装': 'スキル不足',
          'UI レスポンシブ対応': 'スキル不足',
        };
        return {
          keyword,
          category: categoryMap[keyword] || '業務プロセス改善',
        };
      },

      async assessPriority(keyword: string, category: string) {
        // Action 3: 優先度自動判定（影響範囲・緊急度・再発リスク）
        const priorityMap: Record<string, { impactScore: number; urgency: 'high' | 'medium' | 'low'; riskOfRecurrence: boolean }> = {
          'データベース接続': { impactScore: 95, urgency: 'high', riskOfRecurrence: true },
          'ビルドプロセス遅延': { impactScore: 70, urgency: 'medium', riskOfRecurrence: true },
          '再試行ロジック不足': { impactScore: 85, urgency: 'high', riskOfRecurrence: true },
          'API テスト環境': { impactScore: 65, urgency: 'medium', riskOfRecurrence: false },
          '認証機能実装': { impactScore: 50, urgency: 'medium', riskOfRecurrence: false },
          'UI レスポンシブ対応': { impactScore: 40, urgency: 'low', riskOfRecurrence: false },
        };
        const assessment = priorityMap[keyword] || { impactScore: 30, urgency: 'low', riskOfRecurrence: false };
        return {
          keyword,
          impactScore: assessment.impactScore,
          urgency: assessment.urgency,
          riskOfRecurrence: assessment.riskOfRecurrence,
        };
      },

      async generatePrioritizedList(
        issues: Array<{
          keyword: string;
          category: string;
          impactScore: number;
          urgency: 'high' | 'medium' | 'low';
          riskOfRecurrence: boolean;
        }>,
      ) {
        // Action 4: 優先度別一覧生成
        // 優先度ルール: P1 = impactScore >= 80 かつ urgency === 'high'
        //              P2 = impactScore 50-79 または urgency === 'medium'
        //              P3 = impactScore < 50 かつ urgency === 'low'
        const assignPriority = (
          impactScore: number,
          urgency: 'high' | 'medium' | 'low',
        ): 'P1' | 'P2' | 'P3' => {
          if (impactScore >= 80 && urgency === 'high') return 'P1';
          if (impactScore >= 50 && impactScore < 80) return 'P2';
          if (urgency === 'medium') return 'P2';
          return 'P3';
        };

        const prioritized = issues.map((issue) => ({
          priority: assignPriority(issue.impactScore, issue.urgency),
          keyword: issue.keyword,
          category: issue.category,
          impactScore: issue.impactScore,
          urgency: issue.urgency,
          riskOfRecurrence: issue.riskOfRecurrence,
          generatedAt: '2024-01-15T10:20:00Z',
        }));

        // ソート: P1→P2→P3、同一優先度内では再発リスク有→無
        prioritized.sort((a, b) => {
          const priorityOrder: Record<string, number> = { P1: 0, P2: 1, P3: 2 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }
          if (a.riskOfRecurrence !== b.riskOfRecurrence) {
            return a.riskOfRecurrence ? -1 : 1;
          }
          return 0;
        });

        return prioritized;
      },
    };

    // runTx3Imp1Agent を実行
    const result = await runTx3Imp1Agent(
      {
        aggregatedReportIds: aggregatedReportData.reportIds,
        analysisStartDate: '2024-01-15T00:00:00Z',
        analysisEndDate: '2024-01-15T23:59:59Z',
        managerUserId: 'manager-001',
        priorityThresholdScore: 70,
      },
      fakeAiClient,
    );

    // 期待結果の検証

    // (1) 返却データの基本構造確認
    expect(result).toBeDefined();
    expect(result.executionId).toBeDefined();
    expect(typeof result.executionId).toBe('string');
    expect(result.extractedIssuesCount).toBe(6);
    expect(Array.isArray(result.prioritizedIssuesList)).toBe(true);
    expect(result.completionTimestamp).toBeDefined();

    // (2) 優先度別配列の順序確認: P1 → P2 → P3
    const issues = result.prioritizedIssuesList;

    // P1 課題: impactScore >= 80 かつ urgency === 'high'
    const p1Issues = issues.filter((issue) => issue.priority === 'P1');
    expect(p1Issues.length).toBeGreaterThan(0);
    expect(p1Issues[0].keyword).toBe('データベース接続');
    expect(p1Issues[0].impactScore).toBe(95);
    expect(p1Issues[0].urgency).toBe('high');
    expect(p1Issues[0].riskOfRecurrence).toBe(true);

    // 他の P1 課題の確認
    const p1RecurrenceRisks = p1Issues.map((issue) => issue.riskOfRecurrence);
    expect(p1RecurrenceRisks[0]).toBe(true);

    // P2 課題: impactScore 50-79 または urgency === 'medium'
    const p2Issues = issues.filter((issue) => issue.priority === 'P2');
    expect(p2Issues.length).toBeGreaterThan(0);
    for (const issue of p2Issues) {
      expect(
        (issue.impactScore >= 50 && issue.impactScore < 80) || issue.urgency === 'medium',
      ).toBe(true);
    }

    // P3 課題: impactScore < 50 かつ urgency === 'low'
    const p3Issues = issues.filter((issue) => issue.priority === 'P3');
    expect(p3Issues.length).toBeGreaterThan(0);
    for (const issue of p3Issues) {
      expect(issue.impactScore < 50 && issue.urgency === 'low').toBe(true);
    }

    // (3) 優先度の厳密な順序確認
    let lastPriorityIndex = -1;
    const priorityOrder: Record<string, number> = { P1: 0, P2: 1, P3: 2 };
    for (const issue of issues) {
      const currentPriorityIndex = priorityOrder[issue.priority];
      expect(currentPriorityIndex).toBeGreaterThanOrEqual(lastPriorityIndex);
      lastPriorityIndex = currentPriorityIndex;
    }

    // (4) 同一優先度内での再発リスク順序確認
    for (let i = 0; i < issues.length - 1; i++) {
      if (issues[i].priority === issues[i + 1].priority) {
        if (issues[i].riskOfRecurrence && !issues[i + 1].riskOfRecurrence) {
          // OK: 再発リスク有が無より先
          expect(true).toBe(true);
        } else if (!issues[i].riskOfRecurrence && issues[i + 1].riskOfRecurrence) {
          // NG: 再発リスク無が有より先（エラー）
          expect(false).toBe(true);
        }
      }
    }

    // (5) 各課題オブジェクトのフィールド確認
    for (const issue of issues) {
      expect(issue).toHaveProperty('priority');
      expect(['P1', 'P2', 'P3']).toContain(issue.priority);
      expect(issue).toHaveProperty('keyword');
      expect(typeof issue.keyword).toBe('string');
      expect(issue).toHaveProperty('category');
      expect(typeof issue.category).toBe('string');
      expect(issue).toHaveProperty('impactScore');
      expect(typeof issue.impactScore).toBe('number');
      expect(issue.impactScore).toBeGreaterThanOrEqual(0);
      expect(issue.impactScore).toBeLessThanOrEqual(100);
      expect(issue).toHaveProperty('urgency');
      expect(['high', 'medium', 'low']).toContain(issue.urgency);
      expect(issue).toHaveProperty('riskOfRecurrence');
      expect(typeof issue.riskOfRecurrence).toBe('boolean');
      expect(issue).toHaveProperty('generatedAt');
      expect(typeof issue.generatedAt).toBe('string');
    }

    // (6) generatedAt タイムスタンプが ISO8601 形式であることを確認
    for (const issue of issues) {
      const timestamp = new Date(issue.generatedAt);
      expect(timestamp.getTime()).toBeGreaterThan(0);
      expect(issue.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    }

    // (7) JSON シリアライズ可能性を確認
    const jsonString = JSON.stringify(result.prioritizedIssuesList);
    expect(typeof jsonString).toBe('string');
    const reparsed = JSON.parse(jsonString);
    expect(reparsed).toEqual(result.prioritizedIssuesList);

    // (8) completionTimestamp の形式確認
    expect(result.completionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});