import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type { GenerateAndSendSummaryEmailInput, SubmittedReportSummary } from '../../src/logic/notification-delivery';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  // SCEN-235: [edge] 日報集約メール生成機能 - チームメンバー10名全員報告完了時、優先度スコアが同値で並ぶ課題が複数件含まれる場合に提出順序で安定ソートされる
  test('should maintain stable sort by submission time when multiple issues have identical priority scores', async () => {
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const managerUserId = 'manager-001';
    const reportDeadlineTime = '09:30';

    // チームメンバー10名の報告データを作成
    // 優先度スコアが75で同値の3つの課題を含める
    const submittedReports: SubmittedReportSummary[] = [
      {
        reporterId: 'engineer-001',
        reporterName: 'Engineer A',
        submittedAt: '2024-01-15T09:00:10Z',
        challenges: ['Database connection timeout issues', 'API response delay']
      },
      {
        reporterId: 'engineer-002',
        reporterName: 'Engineer B',
        submittedAt: '2024-01-15T09:00:20Z',
        challenges: ['Database connection timeout issues']
      },
      {
        reporterId: 'engineer-003',
        reporterName: 'Engineer C',
        submittedAt: '2024-01-15T09:00:30Z',
        challenges: ['API response delay']
      },
      {
        reporterId: 'engineer-004',
        reporterName: 'Engineer D',
        submittedAt: '2024-01-15T09:01:00Z',
        challenges: ['Memory leak detected']
      },
      {
        reporterId: 'engineer-005',
        reporterName: 'Engineer E',
        submittedAt: '2024-01-15T09:01:10Z',
        challenges: []
      },
      {
        reporterId: 'engineer-006',
        reporterName: 'Engineer F',
        submittedAt: '2024-01-15T09:01:20Z',
        challenges: ['Database connection timeout issues']
      },
      {
        reporterId: 'engineer-007',
        reporterName: 'Engineer G',
        submittedAt: '2024-01-15T09:01:30Z',
        challenges: ['API response delay']
      },
      {
        reporterId: 'engineer-008',
        reporterName: 'Engineer H',
        submittedAt: '2024-01-15T09:01:40Z',
        challenges: []
      },
      {
        reporterId: 'engineer-009',
        reporterName: 'Engineer I',
        submittedAt: '2024-01-15T09:01:50Z',
        challenges: ['Network timeout']
      },
      {
        reporterId: 'engineer-010',
        reporterName: 'Engineer J',
        submittedAt: '2024-01-15T09:02:00Z',
        challenges: []
      }
    ];

    const unsubmittedMemberIds: string[] = [];

    const input: GenerateAndSendSummaryEmailInput = {
      teamId,
      reportDate,
      managerUserId,
      submittedReports,
      unsubmittedMemberIds,
      reportDeadlineTime
    };

    // 外部サービスのモック設定
    // TextAnalysisServiceAdapter の extractKeywords と assessImpactScore をモック化
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'Database connection timeout issues', frequency: 3 },
        { keyword: 'API response delay', frequency: 2 },
        { keyword: 'Memory leak detected', frequency: 1 },
        { keyword: 'Network timeout', frequency: 1 }
      ]),
      assessImpactScore: jest.fn()
        .mockResolvedValueOnce(75) // Database connection timeout issues
        .mockResolvedValueOnce(75) // API response delay
        .mockResolvedValueOnce(75) // Memory leak detected
        .mockResolvedValueOnce(50) // Network timeout
    };

    // 関数を実行
    const output = await generateAndSendSummaryEmail(input, mockTextAnalysisService);

    // 検証: emailId が生成されていること
    expect(output.emailId).toBeDefined();
    expect(typeof output.emailId).toBe('string');
    expect(output.emailId.length).toBeGreaterThan(0);

    // 検証: sentAt が ISO 8601 形式であること
    expect(output.sentAt).toBeDefined();
    const sentDateTime = new Date(output.sentAt);
    expect(sentDateTime.toISOString()).toBeDefined();

    // 検証: recipientEmail が存在すること
    expect(output.recipientEmail).toBeDefined();
    expect(typeof output.recipientEmail).toBe('string');

    // 検証: 優先度付き課題が含まれていること
    expect(output.includedIssueCount).toBeGreaterThan(0);
    expect(output.includedIssueCount).toBe(4);

    // 検証: 提出状況サマリーが正確であること
    // 10名全員が報告提出済み
    expect(output.submissionSummary.submittedCount).toBe(10);
    expect(output.submissionSummary.unsubmittedCount).toBe(0);
    expect(output.submissionSummary.submissionRate).toBe(1.0);

    // 検証: 同一優先度スコア（75）の課題が提出時刻順で安定ソートされていることを確認
    // メール本文内の課題の順序を検証する
    // ここでは、課題リストの並び順が以下の順序であることを確認：
    // 1. Database connection timeout issues（スコア75、最初の提出時刻 09:00:10）
    // 2. API response delay（スコア75、最初の提出時刻 09:00:20）
    // 3. Memory leak detected（スコア75、最初の提出時刻 09:01:00）
    // 4. Network timeout（スコア50、提出時刻 09:01:50）

    // prioritizedIssuesList が存在し、順序が正しいことを検証
    expect(output.prioritizedIssuesList).toBeDefined();
    expect(Array.isArray(output.prioritizedIssuesList)).toBe(true);
    expect(output.prioritizedIssuesList.length).toBe(4);

    // 同一優先度（75）の課題が提出順序で安定ソートされていることを確認
    const score75Issues = output.prioritizedIssuesList.filter(
      issue => issue.priorityScore === 75
    );
    expect(score75Issues.length).toBe(3);

    // 最初の同一優先度課題は「Database connection timeout issues」であることを確認
    expect(score75Issues[0].challengeContent).toBe('Database connection timeout issues');
    
    // 2番目の同一優先度課題は「API response delay」であることを確認
    expect(score75Issues[1].challengeContent).toBe('API response delay');
    
    // 3番目の同一優先度課題は「Memory leak detected」であることを確認
    expect(score75Issues[2].challengeContent).toBe('Memory leak detected');

    // 低い優先度スコア（50）の課題が最後に配置されていることを確認
    expect(output.prioritizedIssuesList[3].challengeContent).toBe('Network timeout');
    expect(output.prioritizedIssuesList[3].priorityScore).toBe(50);

    // TextAnalysisServiceAdapter が正しく呼ばれたことを確認
    expect(mockTextAnalysisService.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisService.assessImpactScore).toHaveBeenCalledTimes(4);
  });
});