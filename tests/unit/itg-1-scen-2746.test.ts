import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractDashboardReportData } from '../../src/logic/manager-dashboard';
import type {
  ExtractDashboardReportDataInput,
  DashboardReportDataOutput,
  PrioritizedIssue,
} from '../../src/logic/manager-dashboard';

describe('ダッシュボード表示機能 - 影響度スコア別色分け', () => {
  // SCEN-2746: [normal] ダッシュボード表示機能 - 影響度スコア1～49の課題に低優先度の色分け（緑）が適用される
  test('影響度スコア25の課題に緑色（low）の優先度色が適用される', () => {
    // Arrange: テスト用課題データ（影響度スコア=25）
    const mockIssueContent = 'バグ対応';
    const mockImpactScore = 25;
    const mockReporterId = 'engineer-001';
    const mockReporterName = 'Taro Yamada';
    const mockTeamId = 'team-001';
    const mockReportDate = '2024-01-15';

    // TextAnalysisServiceAdapter のスタブ化
    // assessImpactScore が影響度スコア=25を返すように固定
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['バグ対応'],
        frequencies: [1],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(mockImpactScore),
      classifyIssueSeverity: jest.fn().mockResolvedValue('low'),
    };

    // NotificationServiceAdapter のスタブ化（ダッシュボード表示に不要だが必須パラメータ）
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduled: true,
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
      }),
    };

    // テスト入力パラメータ
    const input: ExtractDashboardReportDataInput = {
      userId: 'manager-001',
      teamId: mockTeamId,
      reportDate: mockReportDate,
      includeUnsubmitted: true,
    };

    // Act: ダッシュボードデータを抽出
    const result: DashboardReportDataOutput = extractDashboardReportData(
      input,
      mockTextAnalysisServiceAdapter,
      mockNotificationServiceAdapter
    );

    // Assert: 影響度スコア=25の課題に緑色（green）の優先度色が適用されていることを確認
    expect(result).toBeDefined();
    expect(result.reportDate).toBe(mockReportDate);
    expect(result.prioritizedIssues).toBeDefined();
    expect(Array.isArray(result.prioritizedIssues)).toBe(true);

    // 緑色（low）優先度の課題を検証
    const greenIssue: PrioritizedIssue | undefined =
      result.prioritizedIssues.find(
        (issue: PrioritizedIssue) =>
          issue.priorityScore === mockImpactScore &&
          issue.issueContent === mockIssueContent
      );

    expect(greenIssue).toBeDefined();
    expect(greenIssue?.priorityScore).toBe(25);
    expect(greenIssue?.priorityColor).toBe('green');
    expect(greenIssue?.impactLevel).toBe('low');
    expect(greenIssue?.issueContent).toBe(mockIssueContent);
    expect(greenIssue?.reporterName).toBe(mockReporterName);
    expect(result.lastUpdatedAt).toBeDefined();
  });
});