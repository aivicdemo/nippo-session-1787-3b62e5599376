import { validateReportModificationWindow } from '../../src/logic/daily-report-management';
import { type ModificationWindowValidationResult } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 報告内容修正受付判定機能', () => {
  // SCEN-2712: [normal] 報告内容修正受付判定機能 - 修正期限内での複数回の修正操作が全て受け付けられる
  test('修正期限内に行われた複数回の修正操作（1回目から4回目まで）がすべて受け付けられること', () => {
    // 前提: テストユーザーAが日報を送信済みで、修正期限内のシナリオ
    // 朝会開始予定時刻: 09:00
    // 修正期限オフセット: -30分（朝会開始30分前まで修正可能）
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    const modificationDeadlineOffsetMinutes = -30;

    // 1回目の修正: 朝会開始時刻の60分前に実施（修正期限内）
    const firstModificationTimestamp = new Date('2024-01-15T08:00:00Z');
    const firstResult = validateReportModificationWindow({
      submittedAt: firstModificationTimestamp.toISOString(),
      morningMeetingStartTime: morningMeetingStartTime.toISOString(),
    });

    // 1回目の修正が期限内で許可されることを検証
    expect(firstResult.isModificationAllowed).toBe(true);
    expect(firstResult.remainingMinutes).toBe(60); // 期限までの残り時間: 60分
    expect(new Date(firstResult.modificationDeadline).toISOString()).toBe(
      new Date('2024-01-15T08:30:00Z').toISOString()
    );
    expect(firstResult.reason).toBeUndefined();

    // 2回目の修正: 朝会開始時刻の45分前に実施（修正期限内）
    const secondModificationTimestamp = new Date('2024-01-15T08:15:00Z');
    const secondResult = validateReportModificationWindow({
      submittedAt: secondModificationTimestamp.toISOString(),
      morningMeetingStartTime: morningMeetingStartTime.toISOString(),
    });

    // 2回目の修正が期限内で許可されることを検証
    expect(secondResult.isModificationAllowed).toBe(true);
    expect(secondResult.remainingMinutes).toBe(45); // 期限までの残り時間: 45分
    expect(new Date(secondResult.modificationDeadline).toISOString()).toBe(
      new Date('2024-01-15T08:30:00Z').toISOString()
    );
    expect(secondResult.reason).toBeUndefined();

    // 3回目の修正: 朝会開始時刻の35分前に実施（修正期限内）
    const thirdModificationTimestamp = new Date('2024-01-15T08:25:00Z');
    const thirdResult = validateReportModificationWindow({
      submittedAt: thirdModificationTimestamp.toISOString(),
      morningMeetingStartTime: morningMeetingStartTime.toISOString(),
    });

    // 3回目の修正が期限内で許可されることを検証
    expect(thirdResult.isModificationAllowed).toBe(true);
    expect(thirdResult.remainingMinutes).toBe(35); // 期限までの残り時間: 35分
    expect(new Date(thirdResult.modificationDeadline).toISOString()).toBe(
      new Date('2024-01-15T08:30:00Z').toISOString()
    );
    expect(thirdResult.reason).toBeUndefined();

    // 4回目の修正: 朝会開始時刻の31分前に実施（修正期限内、ぎりぎり）
    const fourthModificationTimestamp = new Date('2024-01-15T08:29:00Z');
    const fourthResult = validateReportModificationWindow({
      submittedAt: fourthModificationTimestamp.toISOString(),
      morningMeetingStartTime: morningMeetingStartTime.toISOString(),
    });

    // 4回目の修正が期限内で許可されることを検証
    expect(fourthResult.isModificationAllowed).toBe(true);
    expect(fourthResult.remainingMinutes).toBe(1); // 期限までの残り時間: 1分
    expect(new Date(fourthResult.modificationDeadline).toISOString()).toBe(
      new Date('2024-01-15T08:30:00Z').toISOString()
    );
    expect(fourthResult.reason).toBeUndefined();

    // 期待結果の検証:
    // - 1回目から4回目までの全ての修正操作が受け付けられた
    // - 各修正操作の結果が isModificationAllowed = true を返している
    // - 修正期限は全て同じ値（朝会開始30分前）
    // - 理由メッセージが undefined（許可されている）
    expect(firstResult.isModificationAllowed && 
            secondResult.isModificationAllowed && 
            thirdResult.isModificationAllowed && 
            fourthResult.isModificationAllowed).toBe(true);
  });
});