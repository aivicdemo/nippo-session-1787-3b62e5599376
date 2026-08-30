import { prepareDashboardData } from '../../src/logic/dashboard-presentation';
import { type DashboardDisplayData, type PrioritizedIssueDisplay } from '../../src/logic/dashboard-presentation';

describe('朝会報告管理システム - ダッシュボード表示データ準備', () => {
  // SCEN-306: [normal] 部長向けダッシュボード表示用に、提出状況サマリー、未提出メンバー一覧、優先度別課題一覧、課題キーワード発生頻度ランキングを集計・整形して返す。
  test('prepareDashboardData は業務ルール br-tx_2-005 に従って優先度スコア計算を実施し、色分けコードと影響度を含むダッシュボードデータを返す', () => {
    const teamId = 'team-001';
    const targetDate = new Date('2024-01-15T09:00:00Z');
    const requestingUserId = 'user-manager-001';

    const mockSubmissionStatusSummary = {
      submittedCount: 9,
      totalMembers: 10,
      submissionDeadline: new Date('2024-01-15T09:00:00Z'),
    };

    const mockUnsubmittedMembers = [
      { memberId: 'user-eng-010', memberName: 'Member10' },
    ];

    const mockExtractedIssues = [
      {
        issueText: '顧客A対応遅延',
        reporterCount: 6,
        affectedTeamMembers: 8,
      },
      {
        issueText: 'システム不具合報告',
        reporterCount: 4,
        affectedTeamMembers: 5,
      },
      {
        issueText: 'ドキュメント未更新',
        reporterCount: 2,
        affectedTeamMembers: 3,
      },
    ];

    const totalTeamSize = 10;
    const colorThresholds = { red: 60, yellow: 40, green: 0 };

    const result: DashboardDisplayData = prepareDashboardData({
      teamId,
      targetDate,
      requestingUserId,
      submissionStatusSummary: mockSubmissionStatusSummary,
      unsubmittedMembers: mockUnsubmittedMembers,
      extractedIssues: mockExtractedIssues,
      totalTeamSize,
      colorThresholds,
    });

    // 1. prioritizedIssueList が存在することを確認
    expect(result.prioritizedIssueList).toBeDefined();
    expect(Array.isArray(result.prioritizedIssueList)).toBe(true);
    expect(result.prioritizedIssueList.length).toBe(3);

    // 2. 課題1の優先度スコア計算を検証
    // 課題1: reporterCount=6, affectedTeamMembers=8
    // impactPercentage = (8 / 10) * 100 = 80
    // priorityScore = (6 * 0.6) + (80 * 0.4) = 3.6 + 32 = 35.6
    const issue1 = result.prioritizedIssueList[0];
    expect(issue1.issueContent).toBe('顧客A対応遅延');
    expect(issue1.priorityScore).toBeCloseTo(35.6, 1);

    // 3. 課題2の優先度スコア計算を検証
    // 課題2: reporterCount=4, affectedTeamMembers=5
    // impactPercentage = (5 / 10) * 100 = 50
    // priorityScore = (4 * 0.6) + (50 * 0.4) = 2.4 + 20 = 22.4
    const issue2 = result.prioritizedIssueList[1];
    expect(issue2.issueContent).toBe('システム不具合報告');
    expect(issue2.priorityScore).toBeCloseTo(22.4, 1);

    // 4. 課題3の優先度スコア計算を検証
    // 課題3: reporterCount=2, affectedTeamMembers=3
    // impactPercentage = (3 / 10) * 100 = 30
    // priorityScore = (2 * 0.6) + (30 * 0.4) = 1.2 + 12 = 13.2
    const issue3 = result.prioritizedIssueList[2];
    expect(issue3.issueContent).toBe('ドキュメント未更新');
    expect(issue3.priorityScore).toBeCloseTo(13.2, 1);

    // 5. 色分けコードが colorThresholds に基づいて正しく判定されることを確認
    // 課題1: priorityScore=35.6 → 60未満、40未満 → green（35.6 < 40）
    expect(['red', 'yellow', 'green']).toContain(issue1.colorCode);
    expect(issue1.colorCode).toBe('green');

    // 課題2: priorityScore=22.4 → 60未満、40未満 → green
    expect(['red', 'yellow', 'green']).toContain(issue2.colorCode);
    expect(issue2.colorCode).toBe('green');

    // 課題3: priorityScore=13.2 → 60未満、40未満 → green
    expect(['red', 'yellow', 'green']).toContain(issue3.colorCode);
    expect(issue3.colorCode).toBe('green');

    // 6. impactLevel が 高・中・低 のいずれかであることを確認
    expect(['高', '中', '低', 'high', 'medium', 'low']).toContain(issue1.impactLevel);
    expect(['高', '中', '低', 'high', 'medium', 'low']).toContain(issue2.impactLevel);
    expect(['高', '中', '低', 'high', 'medium', 'low']).toContain(issue3.impactLevel);

    // 7. frequencyRank が reporterCount 降順（1,2,3）であることを確認
    expect(issue1.reporterCount).toBe(6);
    expect(issue2.reporterCount).toBe(4);
    expect(issue3.reporterCount).toBe(2);

    // 8. prioritizedIssueList が priorityScore の降順でソートされていることを確認
    expect(issue1.priorityScore).toBeGreaterThanOrEqual(issue2.priorityScore);
    expect(issue2.priorityScore).toBeGreaterThanOrEqual(issue3.priorityScore);

    // 9. すべての要素で必須フィールドが設定されていることを確認
    for (const issue of result.prioritizedIssueList) {
      expect(issue.issueContent).toBeDefined();
      expect(typeof issue.issueContent).toBe('string');
      expect(issue.priorityScore).toBeDefined();
      expect(typeof issue.priorityScore).toBe('number');
      expect(issue.colorCode).toBeDefined();
      expect(typeof issue.colorCode).toBe('string');
      expect(issue.impactLevel).toBeDefined();
      expect(typeof issue.impactLevel).toBe('string');
    }

    // 10. ダッシュボードデータ全体の構造を確認
    expect(result.submissionStatusSummary).toBeDefined();
    expect(result.unsubmittedMembers).toBeDefined();
    expect(result.lastUpdatedAt).toBeDefined();
  });
});