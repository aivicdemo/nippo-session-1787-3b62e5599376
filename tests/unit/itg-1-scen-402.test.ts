import { syncExtractedIssuesToExternalTool } from '../../src/logic/existing-tool-integration';

describe('朝会報告管理システム - 既存ツール連携', () => {
  // SCEN-402: [normal] 抽出済み課題データを既存ツール（JiraまたはAsana）に連携し、API通信、重複排除、データ整合性検証、リトライ処理を実行して連携完了ステータスを記録する。
  test('validateIntegrationCompletion関数が設計された計算式の代表値を返す', () => {
    const integrationResult = {
      sentRecordCount: 5,
      statusCode: 200,
      sentRecords: [
        { id: 'ISSUE-1', title: '課題1', priority: 'high', assignee: 'user1' },
        { id: 'ISSUE-2', title: '課題2', priority: 'medium', assignee: 'user2' },
        { id: 'ISSUE-3', title: '課題3', priority: 'low', assignee: 'user3' },
        { id: 'ISSUE-4', title: '課題4', priority: 'high', assignee: 'user4' },
        { id: 'ISSUE-5', title: '課題5', priority: 'medium', assignee: 'user5' }
      ],
      retryable: false
    };

    const expectedRecordCount = 5;
    const requiredFields = ['id', 'title', 'priority', 'assignee'];

    const result = syncExtractedIssuesToExternalTool(
      integrationResult,
      expectedRecordCount,
      requiredFields
    );

    expect(result.isValid).toBe(true);
    expect(result.sentRecordCount).toBe(5);
    expect(result.discrepancies).toEqual([]);
    expect(result.requiresRetry).toBe(false);
    expect(result.notificationMessage).toBe('本日の課題データ連携が完了しました');
  });
});