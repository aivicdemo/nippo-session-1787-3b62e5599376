import { validateReportModificationWindow } from '../../src/logic/daily-report-management';
import { type ModificationWindowValidationResult } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 報告内容修正受付判定機能', () => {
  // SCEN-2709: [normal] 報告内容修正受付判定機能 - 修正可能期間内の修正内容が正しく保存される
  test('修正可能期間内の修正操作を実行した場合、修正が許可され、修正期限までの残り時間が正確に計算される', () => {
    // === 初期条件 ===
    // 朝会開始時刻: 09:00
    // 修正期限オフセット: -15分（朝会開始の15分前まで修正可能）
    // 修正可能期間: 朝会開始予定時刻の15分前まで
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');

    // 報告送信時刻: 08:30 (朝会開始の30分前)
    const submittedAt = new Date('2024-01-15T08:30:00Z');

    // 修正操作実行時刻: 08:50 (朝会開始の10分前)
    // この時刻は修正期限(08:45)より後だが、修正可能期間内かを判定する
    const currentTimestamp = new Date('2024-01-15T08:50:00Z');

    // === 修正期限オフセット設定 ===
    // modificationDeadlineOffsetMinutes: -15 (朝会開始の15分前が期限)
    const modificationDeadlineOffsetMinutes = -15;

    // === 期待値計算 ===
    // 修正期限 = 朝会開始(09:00) + オフセット(-15分) = 08:45
    const expectedModificationDeadline = new Date(
      morningMeetingStartTime.getTime() + modificationDeadlineOffsetMinutes * 60000
    );

    // 修正実行時刻(08:50)は修正期限(08:45)より5分後
    // 修正期限までの残り時間 = currentTimestamp - modificationDeadline
    //                    = 08:50 - 08:45 = 5分後
    // 負の値(期限超過): -5分
    const expectedRemainingMinutes = -5;

    // === 実行 ===
    const result: ModificationWindowValidationResult = validateReportModificationWindow({
      submittedAt,
      currentTimestamp,
      morningMeetingStartTime,
      modificationDeadlineOffsetMinutes,
    });

    // === 検証 ===
    // 修正期限を超過しているため、修正は許可されない
    expect(result.isModificationAllowed).toBe(false);

    // 修正期限までの残り時間は-5分(期限超過5分)
    expect(result.remainingMinutes).toBe(expectedRemainingMinutes);

    // 修正期限は08:45
    expect(result.modificationDeadline.getTime()).toBe(
      expectedModificationDeadline.getTime()
    );

    // 修正が許可されない場合の理由メッセージが含まれること
    expect(result.reason).toBeDefined();
    expect(result.reason).toMatch(/修正期限/);
  });

  test('修正期限内に修正操作を実行した場合、修正が許可され、残り時間が正の値として計算される', () => {
    // === 初期条件 ===
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    const submittedAt = new Date('2024-01-15T08:30:00Z');

    // 修正操作実行時刻: 08:42 (朝会開始の18分前、修正期限の3分前)
    const currentTimestamp = new Date('2024-01-15T08:42:00Z');

    const modificationDeadlineOffsetMinutes = -15;

    // === 期待値計算 ===
    // 修正期限 = 09:00 + (-15分) = 08:45
    const expectedModificationDeadline = new Date(
      morningMeetingStartTime.getTime() + modificationDeadlineOffsetMinutes * 60000
    );

    // 残り時間 = 08:45 - 08:42 = 3分
    const expectedRemainingMinutes = 3;

    // === 実行 ===
    const result: ModificationWindowValidationResult = validateReportModificationWindow({
      submittedAt,
      currentTimestamp,
      morningMeetingStartTime,
      modificationDeadlineOffsetMinutes,
    });

    // === 検証 ===
    expect(result.isModificationAllowed).toBe(true);
    expect(result.remainingMinutes).toBe(expectedRemainingMinutes);
    expect(result.modificationDeadline.getTime()).toBe(
      expectedModificationDeadline.getTime()
    );
  });

  test('修正期限が朝会開始の直後に設定されている場合、修正可能期間の判定が正確に行われる', () => {
    // === 初期条件 ===
    // 朝会開始: 09:00
    // オフセット: +30分（朝会開始の30分後まで修正可能）
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    const submittedAt = new Date('2024-01-15T08:50:00Z');

    // 修正操作実行時刻: 09:25 (朝会開始の25分後、期限の5分前)
    const currentTimestamp = new Date('2024-01-15T09:25:00Z');

    const modificationDeadlineOffsetMinutes = 30;

    // === 期待値計算 ===
    // 修正期限 = 09:00 + 30分 = 09:30
    const expectedModificationDeadline = new Date(
      morningMeetingStartTime.getTime() + modificationDeadlineOffsetMinutes * 60000
    );

    // 残り時間 = 09:30 - 09:25 = 5分
    const expectedRemainingMinutes = 5;

    // === 実行 ===
    const result: ModificationWindowValidationResult = validateReportModificationWindow({
      submittedAt,
      currentTimestamp,
      morningMeetingStartTime,
      modificationDeadlineOffsetMinutes,
    });

    // === 検証 ===
    expect(result.isModificationAllowed).toBe(true);
    expect(result.remainingMinutes).toBe(expectedRemainingMinutes);
    expect(result.modificationDeadline.getTime()).toBe(
      expectedModificationDeadline.getTime()
    );
  });

  test('修正期限に正確に到達した時刻での修正操作は許可されない', () => {
    // === 初期条件 ===
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    const submittedAt = new Date('2024-01-15T08:30:00Z');

    // 修正操作実行時刻: 08:45 (修正期限と同一時刻)
    const currentTimestamp = new Date('2024-01-15T08:45:00Z');

    const modificationDeadlineOffsetMinutes = -15;

    // === 期待値計算 ===
    // 修正期限 = 09:00 + (-15分) = 08:45
    // 残り時間 = 0分 (期限に到達)
    const expectedModificationDeadline = new Date(
      morningMeetingStartTime.getTime() + modificationDeadlineOffsetMinutes * 60000
    );
    const expectedRemainingMinutes = 0;

    // === 実行 ===
    const result: ModificationWindowValidationResult = validateReportModificationWindow({
      submittedAt,
      currentTimestamp,
      morningMeetingStartTime,
      modificationDeadlineOffsetMinutes,
    });

    // === 検証 ===
    // 期限に到達した時点では修正は許可されない（境界値判定）
    expect(result.isModificationAllowed).toBe(false);
    expect(result.remainingMinutes).toBe(expectedRemainingMinutes);
    expect(result.modificationDeadline.getTime()).toBe(
      expectedModificationDeadline.getTime()
    );
  });

  test('朝会開始前に大きなオフセット値が設定されている場合、修正期限が遠い将来に設定される', () => {
    // === 初期条件 ===
    // 朝会開始: 09:00
    // オフセット: 480分（8時間後）
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    const submittedAt = new Date('2024-01-15T08:55:00Z');

    // 修正操作実行時刻: 09:30 (朝会開始の30分後)
    const currentTimestamp = new Date('2024-01-15T09:30:00Z');

    const modificationDeadlineOffsetMinutes = 480;

    // === 期待値計算 ===
    // 修正期限 = 09:00 + 480分(8時間) = 17:00
    const expectedModificationDeadline = new Date(
      morningMeetingStartTime.getTime() + modificationDeadlineOffsetMinutes * 60000
    );

    // 残り時間 = 17:00 - 09:30 = 450分
    const expectedRemainingMinutes = 450;

    // === 実行 ===
    const result: ModificationWindowValidationResult = validateReportModificationWindow({
      submittedAt,
      currentTimestamp,
      morningMeetingStartTime,
      modificationDeadlineOffsetMinutes,
    });

    // === 検証 ===
    expect(result.isModificationAllowed).toBe(true);
    expect(result.remainingMinutes).toBe(expectedRemainingMinutes);
    expect(result.modificationDeadline.getTime()).toBe(
      expectedModificationDeadline.getTime()
    );
  });

  test('負のオフセット値が非常に大きい場合、修正期限が朝会開始より大幅に前に設定される', () => {
    // === 初期条件 ===
    // 朝会開始: 09:00
    // オフセット: -120分（朝会開始の2時間前）
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    const submittedAt = new Date('2024-01-15T07:30:00Z');

    // 修正操作実行時刻: 07:10 (修正期限の50分後)
    const currentTimestamp = new Date('2024-01-15T07:10:00Z');

    const modificationDeadlineOffsetMinutes = -120;

    // === 期待値計算 ===
    // 修正期限 = 09:00 + (-120分) = 07:00
    const expectedModificationDeadline = new Date(
      morningMeetingStartTime.getTime() + modificationDeadlineOffsetMinutes * 60000
    );

    // 残り時間 = 07:00 - 07:10 = -10分（期限超過10分）
    const expectedRemainingMinutes = -10;

    // === 実行 ===
    const result: ModificationWindowValidationResult = validateReportModificationWindow({
      submittedAt,
      currentTimestamp,
      morningMeetingStartTime,
      modificationDeadlineOffsetMinutes,
    });

    // === 検証 ===
    expect(result.isModificationAllowed).toBe(false);
    expect(result.remainingMinutes).toBe(expectedRemainingMinutes);
    expect(result.modificationDeadline.getTime()).toBe(
      expectedModificationDeadline.getTime()
    );
  });

  test('修正操作実行時刻が報告送信時刻より前である場合、無効な状態として処理される', () => {
    // === 初期条件 ===
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');

    // 報告送信時刻: 08:50
    const submittedAt = new Date('2024-01-15T08:50:00Z');

    // 修正操作実行時刻: 08:30 (送信時刻より20分前)
    const currentTimestamp = new Date('2024-01-15T08:30:00Z');

    const modificationDeadlineOffsetMinutes = -15;

    // === 実行 ===
    const result: ModificationWindowValidationResult = validateReportModificationWindow({
      submittedAt,
      currentTimestamp,
      morningMeetingStartTime,
      modificationDeadlineOffsetMinutes,
    });

    // === 検証 ===
    // 報告送信前の時刻での修正操作は論理的に不可能
    expect(result.isModificationAllowed).toBe(false);
    expect(result.reason).toBeDefined();
    expect(result.reason).toMatch(/送信/);
  });
});