import { generateAndSendConfirmationEmail } from '../../src/logic/notification-delivery';
import { type ConfirmationEmailInput, type ConfirmationEmailOutput } from '../../src/logic/notification-delivery';

describe('generateAndSendConfirmationEmail - 課題キーワード抽出と確認メール生成配信', () => {
  // SCEN-436: [normal] TextAnalysisServiceAdapterが課題キーワード抽出を正常応答した場合、抽出結果が確認メールに反映される
  test('should generate confirmation email with extracted keywords ranked by frequency when TextAnalysisServiceAdapter returns successfully', async () => {
    // Arrange: TextAnalysisServiceAdapterのスタブを初期化
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'DB接続エラー', frequency: 2 },
        { keyword: 'デプロイ遅延', frequency: 1 }
      ]),
      assessImpactScore: jest.fn().mockResolvedValue([
        { keyword: 'DB接続エラー', impactScore: 85 },
        { keyword: 'デプロイ遅延', impactScore: 60 }
      ]),
      classifyIssueSeverity: jest.fn().mockResolvedValue([
        { keyword: 'DB接続エラー', severity: 'high' },
        { keyword: 'デプロイ遅延', severity: 'medium' }
      ])
    };

    // 日報データを準備
    const aggregatedReports = [
      {
        reportId: 'report-001',
        reporterUserId: 'user-001',
        reporterName: 'Engineer A',
        yesterdayAccomplishment: 'Database optimization completed',
        todayPlan: 'Deployment preparation',
        challenges: 'DB接続エラーが発生している。デプロイ遅延の可能性あり。',
        submissionDateTime: new Date('2024-01-15T08:30:00Z')
      },
      {
        reportId: 'report-002',
        reporterUserId: 'user-002',
        reporterName: 'Engineer B',
        yesterdayAccomplishment: 'API review completed',
        todayPlan: 'Testing phase',
        challenges: 'DB接続エラーが再度発生。対応が急務。',
        submissionDateTime: new Date('2024-01-15T08:45:00Z')
      }
    ];

    const confirmationEmailInput: ConfirmationEmailInput = {
      reportDeadlineDateTime: new Date('2024-01-15T09:00:00Z'),
      aggregatedReports: aggregatedReports,
      managerUserId: 'manager-001',
      teamId: 'team-001',
      analysisDate: new Date('2024-01-15')
    };

    // Act: generateAndSendConfirmationEmailを呼び出し
    const result: ConfirmationEmailOutput = await generateAndSendConfirmationEmail(
      confirmationEmailInput,
      mockTextAnalysisServiceAdapter
    );

    // Assert: メール送信の成功を検証
    expect(result).toBeDefined();
    expect(result.emailId).toBeTruthy();
    expect(result.sentDateTime).toEqual(new Date('2024-01-15T09:00:00Z'));
    
    // メール内容に抽出された課題キーワードが含まれていることを検証
    expect(result.extractedIssuesCount).toBe(2);
    expect(result.prioritizedIssuesList).toHaveLength(2);
    
    // 課題が出現頻度の高い順に並んでいることを検証
    expect(result.prioritizedIssuesList[0].keyword).toBe('DB接続エラー');
    expect(result.prioritizedIssuesList[0].frequency).toBe(2);
    expect(result.prioritizedIssuesList[0].impactScore).toBe(85);
    expect(result.prioritizedIssuesList[0].severity).toBe('high');
    
    expect(result.prioritizedIssuesList[1].keyword).toBe('デプロイ遅延');
    expect(result.prioritizedIssuesList[1].frequency).toBe(1);
    expect(result.prioritizedIssuesList[1].impactScore).toBe(60);
    expect(result.prioritizedIssuesList[1].severity).toBe('medium');
    
    // 提出状況サマリーを検証
    expect(result.submissionStatus.submittedCount).toBe(2);
    expect(result.submissionStatus.unsubmittedMembers).toEqual([]);
    
    // TextAnalysisServiceAdapterが正しく呼ばれたことを検証
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.classifyIssueSeverity).toHaveBeenCalled();
  });
});