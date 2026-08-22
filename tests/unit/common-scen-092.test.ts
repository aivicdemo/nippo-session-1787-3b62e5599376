import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmitted } from '../../src/logic/submission-status-management';

describe('submission-status-management', () => {
  // SCEN-092: [normal] 課題抽出から既存ツール連携・確認までの自律実行 AIエージェント
  // - 「課題抽出から既存ツール連携・確認までの自律実行」が自律処理
  //   「優先度・カテゴリを自動判定する」を契約どおり実行する
  test('should auto-judge priority and category for extracted issues with confidence score >= 0.85 and include judgment info in confirmation email', async () => {
    const test_timestamp = new Date('2024-01-15T09:00:00Z');
    const unsubmitted_members = [
      {
        user_id: 'user_001',
        email: 'member_a@example.com',
        name: 'Member A',
      },
      {
        user_id: 'user_002',
        email: 'member_b@example.com',
        name: 'Member B',
      },
    ];

    const submitted_issues = [
      {
        issue_id: 'issue_001',
        issue_text: 'サーバー応答遅延が発生',
        submitted_by: 'user_003',
        submitted_at: test_timestamp,
      },
    ];

    const extraction_result = {
      extracted_issue_text: 'サーバー応答遅延が発生',
      confidence_score: 0.88,
      priority_judgment: 'High',
      category_judgment: 'インフラ',
    };

    const expected_unsubmitted_count = 2;
    const expected_priority = 'High';
    const expected_category = 'インフラ';
    const expected_confidence = 0.88;
    const expected_email_contains_priority = '【優先度】High';
    const expected_email_contains_category = '【カテゴリ】インフラ';

    const result = await detectAndNotifyUnsubmitted(
      unsubmitted_members,
      submitted_issues,
      extraction_result
    );

    expect(result.unsubmitted_count).toBe(expected_unsubmitted_count);
    expect(result.issue_judgment.priority).toBe(expected_priority);
    expect(result.issue_judgment.category).toBe(expected_category);
    expect(result.issue_judgment.confidence_score).toBe(expected_confidence);
    expect(result.issue_judgment.confidence_score).toBeGreaterThanOrEqual(0.85);
    expect(result.confirmation_email_content).toContain(
      expected_email_contains_priority
    );
    expect(result.confirmation_email_content).toContain(
      expected_email_contains_category
    );
  });
});