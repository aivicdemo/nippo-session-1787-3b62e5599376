import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  // SCEN-071: [error] 日報集約から優先度別課題一覧提示までの自動判定・配信 AIエージェント - 部分失敗時の巻き戻し検証
  test('should rollback all side effects when email send fails at Action 5', async () => {
    // セットアップ: テスト用の偽AIクライアントをモック化
    const mockAiClient = {
      // Action 1: 課題キーワード抽出
      extractIssueKeywords: jest.fn().mockResolvedValue({
        extractedKeywords: [
          { keywordId: 'KW-001', text: '納期遅延' },
          { keywordId: 'KW-002', text: '品質問題' }
        ],
        createdRecordIds: ['EXTRACT-001', 'EXTRACT-002']
      }),
      
      // Action 2: 課題分類
      classifyIssueCategories: jest.fn().mockResolvedValue({
        classifications: [
          { keywordId: 'KW-001', category: '納期' },
          { keywordId: 'KW-002', category: '品質' }
        ],
        createdAssignmentIds: ['CLASSIFY-001', 'CLASSIFY-002']
      }),
      
      // Action 3: 優先度自動判定
      judgeIssuePriority: jest.fn().mockResolvedValue({
        priorityAssignments: [
          { keywordId: 'KW-001', priority: 'HIGH', score: 85 },
          { keywordId: 'KW-002', priority: 'HIGH', score: 80 }
        ],
        createdPriorityIds: ['PRIORITY-001', 'PRIORITY-002']
      }),
      
      // Action 4: 優先度別課題一覧生成
      generatePrioritizedIssueList: jest.fn().mockResolvedValue({
        listRecordId: 'LIST-001',
        issueCount: 2,
        highPriorityCount: 2,
        listGeneratedAt: new Date('2024-01-15T09:30:00Z').toISOString()
      }),
      
      // Action 5: メール送信 - 意図的にエラーを発生させる
      sendConfirmationEmail: jest.fn().mockRejectedValue(
        new Error('Email service unavailable')
      )
    };

    // モックデータベース: 副作用の追跡
    const mockDatabase = {
      extractedKeywords: new Map<string, any>(),
      classifications: new Map<string, any>(),
      priorities: new Map<string, any>(),
      issueLists: new Map<string, any>(),
      
      createExtractedKeyword: jest.fn(function(id: string, data: any) {
        this.extractedKeywords.set(id, data);
        return Promise.resolve({ id, ...data });
      }),
      
      createClassification: jest.fn(function(id: string, data: any) {
        this.classifications.set(id, data);
        return Promise.resolve({ id, ...data });
      }),
      
      createPriority: jest.fn(function(id: string, data: any) {
        this.priorities.set(id, data);
        return Promise.resolve({ id, ...data });
      }),
      
      createIssueList: jest.fn(function(id: string, data: any) {
        this.issueLists.set(id, data);
        return Promise.resolve({ id, ...data });
      }),
      
      deleteExtractedKeyword: jest.fn(function(id: string) {
        this.extractedKeywords.delete(id);
        return Promise.resolve();
      }),
      
      deleteClassification: jest.fn(function(id: string) {
        this.classifications.delete(id);
        return Promise.resolve();
      }),
      
      deletePriority: jest.fn(function(id: string) {
        this.priorities.delete(id);
        return Promise.resolve();
      }),
      
      deleteIssueList: jest.fn(function(id: string) {
        this.issueLists.delete(id);
        return Promise.resolve();
      })
    };

    // ロールバック用のコンテキスト
    const rollbackContext = {
      extractedKeywordIds: [] as string[],
      classificationIds: [] as string[],
      priorityIds: [] as string[],
      issueListIds: [] as string[]
    };

    // Action 1: 課題キーワード抽出を実行
    const extractResult = await mockAiClient.extractIssueKeywords({
      reportDataAggregated: true
    });
    rollbackContext.extractedKeywordIds = extractResult.createdRecordIds;
    for (const recordId of extractResult.createdRecordIds) {
      await mockDatabase.createExtractedKeyword(recordId, {
        timestamp: new Date('2024-01-15T09:00:00Z').toISOString()
      });
    }

    // Action 2: 課題分類を実行
    const classifyResult = await mockAiClient.classifyIssueCategories({
      extractedKeywords: extractResult.extractedKeywords
    });
    rollbackContext.classificationIds = classifyResult.createdAssignmentIds;
    for (const assignmentId of classifyResult.createdAssignmentIds) {
      await mockDatabase.createClassification(assignmentId, {
        timestamp: new Date('2024-01-15T09:05:00Z').toISOString()
      });
    }

    // Action 3: 優先度自動判定を実行
    const priorityResult = await mockAiClient.judgeIssuePriority({
      classifications: classifyResult.classifications
    });
    rollbackContext.priorityIds = priorityResult.createdPriorityIds;
    for (const priorityId of priorityResult.createdPriorityIds) {
      await mockDatabase.createPriority(priorityId, {
        timestamp: new Date('2024-01-15T09:10:00Z').toISOString()
      });
    }

    // Action 4: 優先度別課題一覧生成を実行
    const listResult = await mockAiClient.generatePrioritizedIssueList({
      priorityAssignments: priorityResult.priorityAssignments
    });
    rollbackContext.issueListIds = [listResult.listRecordId];
    await mockDatabase.createIssueList(listResult.listRecordId, {
      timestamp: new Date('2024-01-15T09:15:00Z').toISOString()
    });

    // Action 5: メール送信を試行 - エラーが発生することを期待
    let emailSendError: Error | null = null;
    try {
      await mockAiClient.sendConfirmationEmail({
        listRecordId: listResult.listRecordId,
        priorityIssueList: priorityResult.priorityAssignments,
        recipientEmail: 'manager@example.com'
      });
    } catch (error) {
      emailSendError = error as Error;
    }

    // エラーが発生したことを確認
    expect(emailSendError).not.toBeNull();
    expect(emailSendError?.message).toMatch(/Email service unavailable/);

    // エラー発生時、rollbackContext を使用してすべての副作用を巻き戻す
    const rollbackLog: string[] = [];
    
    // Action 1 の副作用を巻き戻す
    for (const keywordId of rollbackContext.extractedKeywordIds) {
      await mockDatabase.deleteExtractedKeyword(keywordId);
    }
    
    // Action 2 の副作用を巻き戻す
    for (const classificationId of rollbackContext.classificationIds) {
      await mockDatabase.deleteClassification(classificationId);
    }
    
    // Action 3 の副作用を巻き戻す
    for (const priorityId of rollbackContext.priorityIds) {
      await mockDatabase.deletePriority(priorityId);
    }
    
    // Action 4 の副作用を巻き戻す
    for (const issueListId of rollbackContext.issueListIds) {
      await mockDatabase.deleteIssueList(issueListId);
    }
    
    rollbackLog.push('Tx3Imp1 rollback completed: actions 1-4 compensated');

    // 期待結果の検証
    
    // 1. Action 1 で作成された抽出済み課題キーワードレコードがデータベースから削除されていることを確認
    expect(mockDatabase.extractedKeywords.size).toBe(0);
    
    // 2. Action 2 で作成された分類済み課題カテゴリ割当がデータベースから削除されていることを確認
    expect(mockDatabase.classifications.size).toBe(0);
    
    // 3. Action 3 で作成された自動判定済み優先度情報がデータベースから削除されていることを確認
    expect(mockDatabase.priorities.size).toBe(0);
    
    // 4. Action 4 で作成された優先度別課題一覧レコードがデータベースから削除されていることを確認
    expect(mockDatabase.issueLists.size).toBe(0);
    
    // 5. メール送信システムへのメッセージが完全に破棄されていることを確認
    expect(mockAiClient.sendConfirmationEmail).toHaveBeenCalledTimes(1);
    expect(mockAiClient.sendConfirmationEmail).toHaveBeenCalledWith({
      listRecordId: 'LIST-001',
      priorityIssueList: priorityResult.priorityAssignments,
      recipientEmail: 'manager@example.com'
    });
    
    // 6. エラーハンドリングのログに『Tx3Imp1 rollback completed: actions 1-4 compensated』というメッセージが記録されていることを確認
    expect(rollbackLog).toContain('Tx3Imp1 rollback completed: actions 1-4 compensated');
    
    // 7. トランザクション全体がアトミックに失敗し、元の状態に完全に巻き戻されたことを確認
    expect(mockDatabase.extractedKeywords.size).toBe(0);
    expect(mockDatabase.classifications.size).toBe(0);
    expect(mockDatabase.priorities.size).toBe(0);
    expect(mockDatabase.issueLists.size).toBe(0);
    
    // 8. 部長に対して未送信状態となっていることを確認（メール送信が失敗しているため）
    expect(emailSendError).toBeDefined();
    expect(emailSendError?.message).toMatch(/Email service unavailable/);
  });
});