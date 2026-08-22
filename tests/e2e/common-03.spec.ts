import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('リマインド通知管理画面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/panels/scr-1787119211243.html`);
  });

  // SCEN-021: [error] リマインド通知管理画面 - 対象チームを選択せずに保存するとエラー表示になる
  test('SCEN-021: 対象チームを選択せずに保存するとエラー表示になる', async ({ page }) => {
    // 新規スケジュール作成ボタンをクリック
    await page.click('button[data-testid="create-schedule-button"]');

    // 作成フォームが表示されるまで待機
    await page.waitForSelector('#create-form', { state: 'visible' });

    // 送信時刻を入力
    await page.fill('input[name="send_time"]', '09:00');

    // 対象チームを選択しない（空のまま）

    // 報告期限を入力
    await page.fill('input[name="deadline_hours"]', '24');

    // 有効フラグをチェック
    await page.check('input[name="is_active"]');

    // 保存ボタンをクリック
    await page.click('button[data-testid="save-schedule-button"]');

    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=対象チームを選択してください')).toBeVisible({ timeout: 5000 });

    // ページがリマインド通知管理画面に留まっていることを確認
    await expect(page).toHaveURL(`${BASE_URL}/panels/scr-1787119211243.html`);

    // 作成フォームがまだ表示されていることを確認（画面遷移していない）
    await expect(page.locator('#create-form')).toBeVisible();
  });

  // SCEN-022: [error] リマインド通知管理画面 - 対象メンバーを選択せずに保存するとエラー表示になる
  test('SCEN-022: 対象メンバーを選択せずに保存するとエラー表示になる', async ({ page }) => {
    // 新規スケジュール作成ボタンをクリック
    await page.click('button[data-testid="create-schedule-button"]');

    // 作成フォームが表示されるまで待機
    await page.waitForSelector('#create-form', { state: 'visible' });

    // 送信時刻を入力
    await page.fill('input[name="send_time"]', '10:30');

    // 対象チームを選択
    await page.selectOption('select[name="team_id"]', '営業チーム');

    // 対象メンバーを選択しない（空のまま）

    // 報告期限を入力
    await page.fill('input[name="deadline_hours"]', '12');

    // 有効フラグをチェック
    await page.check('input[name="is_active"]');

    // 保存ボタンをクリック
    await page.click('button[data-testid="save-schedule-button"]');

    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=対象メンバーを選択してください')).toBeVisible({ timeout: 5000 });

    // ページがリマインド通知管理画面に留まっていることを確認
    await expect(page).toHaveURL(`${BASE_URL}/panels/scr-1787119211243.html`);

    // 作成フォームがまだ表示されていることを確認（保存処理が実行されず、画面遷移していない）
    await expect(page.locator('#create-form')).toBeVisible();
  });
});