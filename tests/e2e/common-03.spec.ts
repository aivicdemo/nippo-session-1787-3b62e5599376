import { test, expect } from '@playwright/test';

test.describe("リマインド通知管理画面", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/panels/scr-1787119211243.html");
  });

  // SCEN-021
  test("[error] 対象チームを選択せずに保存するとエラー表示になる", async ({ page }) => {
    // 保存ボタンを検出して、対象チーム選択なしで保存実行
    const saveButton = page.locator('button').filter({ hasText: /保存|Save/ }).first();
    
    // チーム選択が空のまま保存をクリック
    await saveButton.click();
    
    // エラーメッセージが表示される
    const errorMessage = page.locator('text=対象チームを選択してください');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // 画面がリマインド通知管理画面に留まっている
    await expect(page).toHaveURL("/panels/scr-1787119211243.html");
  });

  // SCEN-022
  test("[error] 対象メンバーを選択せずに保存するとエラー表示になる", async ({ page }) => {
    // 対象チームは選択されているが、対象メンバーが選択されていない状態を想定
    const saveButton = page.locator('button').filter({ hasText: /保存|Save/ }).first();
    
    // メンバー選択が空のまま保存をクリック
    await saveButton.click();
    
    // エラーメッセージが表示される
    const errorMessage = page.locator('text=対象メンバーを選択してください');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // 画面がリマインド通知管理画面に留まっている
    await expect(page).toHaveURL("/panels/scr-1787119211243.html");
  });
});