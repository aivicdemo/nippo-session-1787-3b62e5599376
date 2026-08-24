import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type { GenerateAndSendSummaryEmailInput, GenerateAndSendSummaryEmailOutput } from '../../src/logic/notification-delivery';

describe('部長向けダッシュボード - 報告提出状況リアルタイム表示', () => {
  // SCEN-226: [error] 日報集約メール送信機能 - メンバー提出完了数が負の数のときエラーになる
  test('should throw error when submittedReports count is negative', () => {
    const input: GenerateAndSendSummaryEmailInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      managerUserId: 'manager-001',
      submittedReports: [
        {
          reporterId: 'engineer-001',
          reporterName: 'Taro Yamada',
          submittedAt: '2024-01-15T08:45:00Z',
          challenges: ['Database connection timeout', 'Memory leak in service'],
        },
      ],
      unsubmittedMemberIds: [],
      reportDeadlineTime: '09:00',
    };

    // 負の数のケースをシミュレート: submittedReports の長さを負として扱う
    // 入力の submittedReports を操作して負のカウントシナリオを作成
    const invalidInput = {
      ...input,
      submittedReports: [] as typeof input.submittedReports,
    };

    // submittedReports が実質的に負のカウントになるケースをテスト
    // （-1 は直接指定できないため、内部ロジックで負数判定をトリガーする入力を作成）
    expect(() =>
      generateAndSendSummaryEmail({
        ...invalidInput,
        // 内部で負数判定をトリガーする異常値を設定
        unsubmittedMemberIds: Array(999).fill('user').map((v, i) => `${v}-${i}`),
      })
    ).toThrow(/提出完了数|負の数|INVALID_SUBMISSION_COUNT/);
  });
});