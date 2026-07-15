const test = require("node:test");
const assert = require("node:assert/strict");

const { isSupportedZhihuUrl, normalizeSourceUrl, isExcludedImage } = require("../src/domain.cjs");

test("only supported HTTPS Zhihu targets are accepted", () => {
  assert.equal(isSupportedZhihuUrl("https://www.zhihu.com/question/1/answer/2"), true);
  assert.equal(isSupportedZhihuUrl("https://zhuanlan.zhihu.com/p/3"), true);
  assert.equal(isSupportedZhihuUrl("http://www.zhihu.com/question/1"), false);
  assert.equal(isSupportedZhihuUrl("https://evil.example/?next=www.zhihu.com"), false);
});

test("source URL normalization removes fragments and Zhihu resize query noise", () => {
  assert.equal(
    normalizeSourceUrl("https://pic1.zhimg.com/v2-abc_r.jpg?source=1940ef5c#x"),
    "https://pic1.zhimg.com/v2-abc.jpg"
  );
});

test("Zhihu sticker and emoji assets are excluded", () => {
  assert.equal(isExcludedImage({ originalUrl: "https://pic.zhimg.com/sticker/party.png", alt: "" }), true);
  assert.equal(isExcludedImage({ originalUrl: "https://pic.zhimg.com/v2-photo.jpg", alt: "photo" }), false);
});
