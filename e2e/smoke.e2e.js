import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // 初回ガイドツアーが操作を遮らないよう、表示済み扱いにしておく
  await page.addInitScript(() => {
    localStorage.setItem('nanyo_prompts_v5_intro_done', '1');
    localStorage.setItem('nanyo_prompts_v5_modal_intro_done', '1');
  });
  await page.goto('/');
  await expect(page.locator('.grid .card').first()).toBeVisible();
});

test('一覧が表示され、件数がヘッダーに出る', async ({ page }) => {
  await expect(page.locator('.grid .card')).toHaveCount(32);
  await expect(page.locator('.logo p')).toContainText(/生成AI活用実例集 \d+件/);
});

test('意図検索では本文にしか無い語でも見つかる', async ({ page }) => {
  // 「ロールプレイ」はタイトル・カテゴリには無く、本文にだけ出てくる語
  await page.locator('.search-box input').fill('ロールプレイ');
  await expect(page.locator('.search-no-result').first()).toBeVisible();
  await page.locator('.search-mode-btn', { hasText: '意図検索' }).click();
  await expect(page.locator('.search-result-count').first()).toHaveText(/^[1-9]\d*件$/);
  await expect(page.locator('.grid .card').first()).toBeVisible();
});

test('プロンプトを開き、変数を入力してコピーできる', async ({ page }) => {
  await page.locator('.search-box input').fill('言い換え表現');
  const card = page.locator('.grid .card', { hasText: '多様な言い換え表現' }).first();
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'AIで実行' }).click();

  const modal = page.locator('.run-modal');
  await expect(modal.locator('.run-modal-title')).toContainText('多様な言い換え表現');

  const firstField = modal.locator('.prompt-form textarea').first();
  await firstField.fill('スモークテスト入力');
  const preview = modal.locator('.prompt-preview textarea');
  await expect(preview).toHaveValue(/スモークテスト入力/);

  await modal.getByRole('button', { name: 'コピー' }).click();
  await expect(modal.locator('.run-modal-copy-btn')).toHaveText('Copied!');
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toContain('スモークテスト入力');

  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);
});

test('カテゴリとお気に入りで絞り込める', async ({ page }) => {
  await page.locator('.filters .chip', { hasText: 'プログラミング' }).click();
  const tags = page.locator('.grid .card .card-tags .tag:first-child');
  await expect(tags.first()).toContainText('プログラミング');

  const firstCard = page.locator('.grid .card').first();
  const title = await firstCard.locator('.card-title').innerText();
  await firstCard.locator('.fav-btn').click();
  await page.locator('.filters .chip', { hasText: 'お気に入り' }).click();
  await expect(page.locator('.grid .card')).toHaveCount(1);
  await expect(page.locator('.grid .card .card-title')).toHaveText(title);
});

test('自分のプロンプトを追加できる', async ({ page }) => {
  await page.getByRole('button', { name: '追加' }).click();
  const modal = page.locator('.crud-modal');
  await modal.locator('input').first().fill('スモークテストの自作プロンプト');
  await modal.getByRole('button', { name: /保存|追加/ }).last().click();
  await expect(page.locator('.grid .card').first().locator('.card-title')).toHaveText('スモークテストの自作プロンプト');
  await expect(page.locator('.filters .chip-user')).toContainText('1');
});
