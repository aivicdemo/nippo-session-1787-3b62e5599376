import { evaluateInitialReportSubmission } from '../../src/logic/adoption-training-management';

describe('朝会報告管理システム', () => {
  // SCEN-587: エンジニアの初回テスト報告データを検証し、必須項目・形式・品質基準を満たしているか判定して、合格なら受理、不合格なら修正指示を返す。報告が朝会開始予定時刻の30分後以降に送信されたときという明示された境界条件で定時報告期限を超過しています
  test('朝会開始予定時刻の30分後以降に送信された初回テスト報告は、定時報告期限超過を修正指示として含める', () => {
    // 朝会開始予定時刻を9:30に設定
    const morningMeetingStartTime = new Date('2024-01-15T09:30:00Z');
    
    // 送信時刻を朝会開始予定時刻の30分後（10:00）より後の10:05に設定
    const submissionTimestamp = new Date('2024-01-15T10:05:00Z');

    const reportInput = {
      reportId: 'report-001',
      engineerId: 'engineer-001',
      yesterdayAccomplishment: 'システムのバグ修正とテストコードの作成を実施しました。',
      todayPlan: '新機能のAPIドキュメント作成とコードレビューを予定しています。',
      issuesAndConcerns: 'データベース接続のタイムアウト問題が発生しており、インフラチームと調整が必要です。',
      submissionTimestamp: submissionTimestamp,
      trainingPhaseId: 'phase-001',
    };

    const result = evaluateInitialReportSubmission(reportInput, morningMeetingStartTime);

    // evaluationStatusが'PASSED'であることを確認
    expect(result.evaluationStatus).toBe('PASSED');

    // qualityScoreが85であることを確認
    expect(result.qualityScore).toBe(85);

    // formatUnificationDegreeが90であることを確認
    expect(result.formatUnificationDegree).toBe(90);

    // feedbackItemsに定時報告期限を超過しているという修正指示が含まれていることを確認
    const deadlineExceededFeedback = result.feedbackItems.find(
      (item) => item.fieldName === 'submissionTiming' || item.improvementInstruction.includes('定時報告期限')
    );
    expect(deadlineExceededFeedback).toBeDefined();
    expect(deadlineExceededFeedback?.improvementInstruction).toContain('定時報告期限を超過しています');

    // evaluationTimestampが現在日時で設定されていることを確認
    expect(result.evaluationTimestamp).toEqual(expect.any(Date));
    expect(result.evaluationTimestamp.getTime()).toBeLessThanOrEqual(new Date().getTime());
  });
});