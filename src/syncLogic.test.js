import { describe, it, expect } from "vitest";
import { mergePrompts, cleanFavs } from "./syncLogic";

// ヘルパー: ソースプロンプトを作成
const makeSource = (id, title = `Prompt ${id}`) => ({
  id, title, isUser: false,
});

// ヘルパー: ユーザー追加プロンプトを作成
const makeUser = (id, title = `User Prompt ${id}`) => ({
  id, title, isUser: true,
});

describe("mergePrompts", () => {
  describe("ユーザー追加プロンプトの保持", () => {
    it("ソースデータ変更時にユーザー追加プロンプトが保持される", () => {
      const local = [
        makeUser(9001, "自作プロンプトA"),
        makeUser(9002, "自作プロンプトB"),
        makeSource(1), makeSource(2), makeSource(3),
      ];
      // ソースが変更: id=3 削除、id=4 追加
      const newSource = [makeSource(1), makeSource(2), makeSource(4)];

      const result = mergePrompts(local, newSource);

      expect(result.hasChanged).toBe(true);
      // ユーザープロンプトが先頭に保持
      expect(result.prompts[0]).toEqual(makeUser(9001, "自作プロンプトA"));
      expect(result.prompts[1]).toEqual(makeUser(9002, "自作プロンプトB"));
      // ユーザープロンプトの数が変わらない
      const userPrompts = result.prompts.filter(p => p.isUser);
      expect(userPrompts).toHaveLength(2);
    });

    it("ソースデータが大幅に削減されてもユーザー追加プロンプトが残る", () => {
      const local = [
        makeUser(9001, "自作プロンプト"),
        makeSource(1), makeSource(2), makeSource(3),
        makeSource(4), makeSource(5),
      ];
      // ソースが1件のみに
      const newSource = [makeSource(1)];

      const result = mergePrompts(local, newSource);

      expect(result.hasChanged).toBe(true);
      expect(result.prompts).toHaveLength(2); // ユーザー1 + ソース1
      expect(result.prompts[0]).toEqual(makeUser(9001, "自作プロンプト"));
      expect(result.prompts[1]).toEqual(makeSource(1));
    });

    it("ソースが完全に入れ替わってもユーザープロンプトが残る", () => {
      const local = [
        makeUser(9001, "自作"), makeSource(1), makeSource(2),
      ];
      // 全く別のソースに入れ替わり
      const newSource = [makeSource(10), makeSource(20)];

      const result = mergePrompts(local, newSource);

      expect(result.hasChanged).toBe(true);
      const userPrompts = result.prompts.filter(p => p.isUser);
      expect(userPrompts).toHaveLength(1);
      expect(userPrompts[0].title).toBe("自作");
    });
  });

  describe("変更検知", () => {
    it("ソースデータに変更がない場合はローカルデータをそのまま返す", () => {
      const local = [
        makeUser(9001, "自作"),
        makeSource(1), makeSource(2),
      ];
      const newSource = [makeSource(1), makeSource(2)];

      const result = mergePrompts(local, newSource);

      expect(result.hasChanged).toBe(false);
      expect(result.prompts).toBe(local); // 同一参照
    });

    it("ソースが増えた場合は変更を検知する", () => {
      const local = [makeSource(1), makeSource(2)];
      const newSource = [makeSource(1), makeSource(2), makeSource(3)];

      const result = mergePrompts(local, newSource);

      expect(result.hasChanged).toBe(true);
      expect(result.prompts).toHaveLength(3);
    });

    it("ソースが減った場合は変更を検知する", () => {
      const local = [makeSource(1), makeSource(2), makeSource(3)];
      const newSource = [makeSource(1), makeSource(2)];

      const result = mergePrompts(local, newSource);

      expect(result.hasChanged).toBe(true);
      expect(result.prompts).toHaveLength(2);
    });

    it("件数が同じでも内容が変わった場合は検知する", () => {
      const local = [makeSource(1), makeSource(2), makeSource(3)];
      // id=3→id=4 に入れ替え（件数は同じ）
      const newSource = [makeSource(1), makeSource(2), makeSource(4)];

      const result = mergePrompts(local, newSource);

      expect(result.hasChanged).toBe(true);
      expect(result.prompts.map(p => p.id)).toEqual([1, 2, 4]);
    });
  });

  describe("エッジケース", () => {
    it("ローカルにユーザープロンプトのみの場合も正しくマージする", () => {
      const local = [makeUser(9001, "自作のみ")];
      const newSource = [makeSource(1), makeSource(2)];

      const result = mergePrompts(local, newSource);

      expect(result.hasChanged).toBe(true);
      expect(result.prompts).toHaveLength(3);
      expect(result.prompts[0].isUser).toBe(true);
    });

    it("ローカルが空の場合", () => {
      const local = [];
      const newSource = [makeSource(1)];

      const result = mergePrompts(local, newSource);

      expect(result.hasChanged).toBe(true);
      expect(result.prompts).toEqual([makeSource(1)]);
    });

    it("新ソースが空の場合でもユーザープロンプトは保持", () => {
      const local = [makeUser(9001, "自作"), makeSource(1)];
      const newSource = [];

      const result = mergePrompts(local, newSource);

      expect(result.hasChanged).toBe(true);
      expect(result.prompts).toHaveLength(1);
      expect(result.prompts[0].isUser).toBe(true);
    });
  });

  describe("removedIds", () => {
    it("削除されたソースIDがremovedIdsに含まれる", () => {
      const local = [makeSource(1), makeSource(2), makeSource(3)];
      const newSource = [makeSource(1)];

      const result = mergePrompts(local, newSource);

      expect(result.removedIds).toContain(2);
      expect(result.removedIds).toContain(3);
      expect(result.removedIds).not.toContain(1);
    });

    it("変更がない場合はremovedIdsが空", () => {
      const local = [makeSource(1), makeSource(2)];
      const newSource = [makeSource(1), makeSource(2)];

      const result = mergePrompts(local, newSource);

      expect(result.removedIds).toEqual([]);
    });
  });
});

describe("cleanFavs", () => {
  it("削除されたプロンプトのお気に入りを除去する", () => {
    const favs = new Set([1, 2, 3, 4]);
    const removedIds = [2, 4];

    const result = cleanFavs(favs, removedIds);

    expect(result.cleaned).toBe(2);
    expect(result.favs.has(1)).toBe(true);
    expect(result.favs.has(3)).toBe(true);
    expect(result.favs.has(2)).toBe(false);
    expect(result.favs.has(4)).toBe(false);
  });

  it("該当するお気に入りがない場合は元のセットを返す", () => {
    const favs = new Set([1, 3]);
    const removedIds = [2, 4];

    const result = cleanFavs(favs, removedIds);

    expect(result.cleaned).toBe(0);
    expect(result.favs).toBe(favs); // 同一参照
  });

  it("removedIdsが空なら何もしない", () => {
    const favs = new Set([1, 2]);
    const result = cleanFavs(favs, []);

    expect(result.cleaned).toBe(0);
    expect(result.favs).toBe(favs);
  });
});
