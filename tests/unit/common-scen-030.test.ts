import { getDeadlineInfo } from '../../src/logic/report-deadline-management';

describe('共通', () => {
  // SCEN-030
  test('報告期限までの残り時間と期限情報を計算して返す - 期限設定が存在しないか無効な場合', () => {
    expect(() => {
      getDeadlineInfo(null as any);
    }).toThrow(/報告期限の設定が見つかりません/);

    expect(() => {
      getDeadlineInfo(undefined as any);
    }).toThrow(/報告期限の設定が見つかりません/);

    expect(() => {
      getDeadlineInfo({} as any);
    }).toThrow(/報告期限の設定が見つかりません/);
  });
});