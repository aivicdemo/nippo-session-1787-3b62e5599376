import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { saveExtractedIssueData } from '../../src/logic/issue-data-persistence';
import type {
  SaveExtractedIssueDataInput,
  SaveExtractedIssueDataOutput,
  AnalysisResultData,
} from '../../src/logic/issue-data-persistence';

describe('issue-data-persistence', () => {
  // SCEN-162: [normal] 抽出済み課題データ、優先度スコア、分析結果を受け取り、暗号化して永続化し、保存完了を返す
  test('should save extracted issue data with encryption and audit logging', async () => {
    const analysisResult: AnalysisResultData = {
      rootCause: 'コネクションプール枯渇',
      proposedCountermeasure: 'プール上限を100から200に増加',
      estimatedResolutionDays: 3,
    };

    const input: SaveExtractedIssueDataInput = {
      reportId: 'RPT-20240115-001',
      issueContent: 'データベース接続タイムアウトが頻発している',
      issueType: '技術的課題',
      priorityScore: 75,
      impactLevel: '高',
      extractedKeywords: [
        'データベース',
        '接続タイムアウト',
        'パフォーマンス',
      ],
      analysisResult,
      executorId: 'USR-00001',
    };

    const result: SaveExtractedIssueDataOutput = await saveExtractedIssueData(input);

    // (1) issueDataId は一意識別子形式の文字列であることを確認
    expect(result.issueDataId).toBeDefined();
    expect(typeof result.issueDataId).toBe('string');
    expect(result.issueDataId.length).toBeGreaterThan(0);

    // (2) savedTimestamp は ISO 8601形式であることを確認
    expect(result.savedTimestamp).toBeDefined();
    expect(typeof result.savedTimestamp).toBe('string');
    expect(result.savedTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );

    // (3) encryptionStatus は文字列 'encrypted' であることを確認
    expect(result.encryptionStatus).toBe('encrypted');
  });
});