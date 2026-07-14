(() => {
  const MIN_USEFUL_SIDE = 80;
  const MAX_ICON_AREA = 120 * 120;
  const MIN_SCROLL_RANGE = 240;
  const LAZY_ATTRS = ["data-original", "data-actualsrc", "data-src", "data-lazy-src", "data-url", "data-rawsrc"];
  const COMMENT_SELECTORS = [
    "div[data-id] .CommentContent",
    "div[data-id] [class*='CommentContent']",
    ".Comments-container",
    ".CommentsV2",
    ".CommentItem",
    ".CommentList-item",
    ".CommentContent",
    ".CommentList",
    ".CommentListV2",
    ".CommentTopbar",
    "[class*='CommentList']",
    "[class*='Comments-container']",
    "[class*='CommentsContainer']",
    "[class*='CommentsV2']",
    "[class*='CommentItem']",
    "[class*='CommentContent']",
    "[class*='commentItem']",
    "[class*='comment-content']",
    "[aria-label*='评论']"
  ];
  const COMMENT_DIALOG_SELECTORS = [
    "[role='dialog']",
    ".Modal",
    "[class*='Modal']"
  ];
  const EXCLUDE_ANCESTOR_RE = /(avatar|author|userlink|badge|icon|toolbar|button|vote|reaction|popover|header|footer|commentauthor)/i;
  let activeCommentView = "auto";
  let activeSecondaryReplyRoot = null;
  let activeContentRoot = null;
  const secondaryReplyImages = [];
  const processedSecondaryReplyButtons = new Set();

  window.masakiClawPreparePage = async function masakiClawPreparePage(options = {}) {
    const scrollUntilBottom = options.scrollUntilBottom === true || options.maxScrolls === null;
    const maxScrolls = scrollUntilBottom ? 500 : Math.max(0, Math.min(Number(options.maxScrolls) || 24, 80));
    const delayMs = Math.max(250, Math.min(Number(options.delayMs) || 900, 3000));
    const allowSecondaryReplies = options.allowSecondaryReplies === true;
    activeCommentView = "auto";
    activeSecondaryReplyRoot = null;
    activeContentRoot = findTargetContentRoot(options);
    const targetAnswerId = getAnswerIdFromUrl(options.targetUrl || location.href);
    const initialY = window.scrollY;
    const stats = {
      scriptVersion: "2026-06-28-secondary-reply-persistent-root",
      commentView: "auto",
      allowSecondaryReplies,
      scrollUntilBottom,
      maxScrolls,
      delayMs,
      scrolls: 0,
      clicks: 0,
      initialY,
      finalY: initialY,
      finalHeight: document.scrollingElement?.scrollHeight || document.body.scrollHeight || 0,
      targetAnswerId,
      targetContentRoot: activeContentRoot ? getElementSignature(activeContentRoot) : ""
    };
    const expectedBeforeOpen = getExpectedCommentCount();
    const commentScope = activeContentRoot || document;
    const loadedBeforeOpen = activeContentRoot ? getLoadedCommentContentNodes(commentScope).length : getLoadedCommentContentNodes(document).length;
    const alreadyHasModal = findCommentDialog();
    const hasRequiredAnswerRoot = !targetAnswerId || Boolean(activeContentRoot);
    const shouldOpenFullComments = hasRequiredAnswerRoot && !alreadyHasModal && (loadedBeforeOpen === 0 || (expectedBeforeOpen > 0 && loadedBeforeOpen < expectedBeforeOpen));
    stats.expectedCommentCountBeforeOpen = expectedBeforeOpen;
    stats.loadedCommentContentBeforeOpen = loadedBeforeOpen;
    stats.targetContentRootMissing = Boolean(targetAnswerId && !activeContentRoot);
    stats.openFullCommentsReason = shouldOpenFullComments
      ? loadedBeforeOpen === 0
        ? "no_loaded_comments"
        : "embedded_comments_incomplete"
      : "";
    if (shouldOpenFullComments) {
      const openerClickResult = await clickCommentOpeners();
      stats.clicks += openerClickResult.clicks;
      stats.commentOpener = openerClickResult;
    }
    stats.dialogFound = false;
    stats.dialogSelector = "";

    const initialDialog = await waitForCommentDialog(delayMs * 4);
    if (initialDialog) {
      stats.dialogFound = true;
      stats.dialogSelector = getElementSignature(initialDialog);
      activeCommentView = "modal";
    } else {
      activeCommentView = "embedded";
    }
    stats.commentView = activeCommentView;

    stats.commentLocatorBeforeScroll = locateComments();

    const commentAnchor = findCommentAnchor();
    if (commentAnchor) {
      scrollToCommentTop(commentAnchor);
      stats.commentAnchorSelector = getElementSignature(commentAnchor);
      await wait(delayMs);
    }
    stats.scanStartY = window.scrollY;
    const scanBottomY = getWindowScanBottom(commentAnchor);
    stats.scanBottomY = scanBottomY;

    let stableRounds = 0;
    let bottomRounds = 0;
    let scrollTarget = normalizeScrollTarget(getBestScrollTarget());
    let lastHeight = getScrollTargetHeight(scrollTarget);
    let lastImageCount = countPotentialCommentImages();
    let lastCommentCount = countLoadedCommentContents();
    const earlyStopMinScrolls = scrollUntilBottom
      ? activeCommentView === "modal" ? Math.min(maxScrolls, 12) : Math.min(maxScrolls, 8)
      : activeCommentView === "modal" ? Math.min(maxScrolls, 6) : Math.min(maxScrolls, 4);
    const bottomStopRounds = scrollUntilBottom
      ? activeCommentView === "modal" ? 8 : 4
      : activeCommentView === "modal" ? 4 : 2;
    const stableStopRounds = scrollUntilBottom
      ? activeCommentView === "modal" ? 12 : 8
      : activeCommentView === "modal" ? 5 : 3;
    stats.earlyStopMinScrolls = earlyStopMinScrolls;
    stats.bottomStopRounds = bottomStopRounds;
    stats.stableStopRounds = stableStopRounds;

    for (let index = 0; index < maxScrolls; index += 1) {
      if (isSecondaryReplyView()) {
        const returnStats = await ensureSecondaryReplyReturned(delayMs);
        stats.secondaryReplies = mergeSecondaryReplyStats(stats.secondaryReplies, returnStats);
        if (!returnStats.returned) {
          stats.stoppedInSecondaryReplyView = true;
          break;
        }
      }

      const beforeLoadMore = await clickLoadMoreButtons();
      stats.clicks += beforeLoadMore.clicks;

      scrollTarget = normalizeScrollTarget(getBestScrollTarget());
      if (scrollTarget !== window) {
        stats.dialogFound = true;
        stats.dialogSelector = getElementSignature(scrollTarget);
      }
      const beforeY = getScrollTargetTop(scrollTarget);
      const actualScrollTarget = scrollElementBy(scrollTarget, Math.max(760, window.innerHeight * 1.25), { restrictToDialog: activeCommentView === "modal" });
      const statsTarget = actualScrollTarget || scrollTarget;
      const settled = await waitForLazyContentSettled(statsTarget, delayMs);
      const afterLoadMore = await clickLoadMoreButtons();
      if (afterLoadMore.clicks) {
        stats.clicks += afterLoadMore.clicks;
        await waitForLazyContentSettled(statsTarget, delayMs);
      }
      if (allowSecondaryReplies) {
        const secondaryStats = await processSecondaryReplyButtons(delayMs);
        if (secondaryStats.visits || secondaryStats.skipped || secondaryStats.returnFailed) {
          stats.secondaryReplies = mergeSecondaryReplyStats(stats.secondaryReplies, secondaryStats);
        }
        if (secondaryStats.returnFailed) {
          stats.stoppedInSecondaryReplyView = true;
          break;
        }
      }

      const height = getScrollTargetHeight(statsTarget);
      const imageCount = countPotentialCommentImages();
      const commentCount = countLoadedCommentContents();
      const currentY = getScrollTargetTop(statsTarget);
      const viewportHeight = getScrollTargetViewportHeight(statsTarget);
      const scrollRange = statsTarget === window ? height - viewportHeight : getScrollableRange(statsTarget);
      const nearBottom = scrollRange > 32 && currentY + viewportHeight >= height - 32;
      const outsideEmbeddedScan = statsTarget === window && Number.isFinite(scanBottomY) && currentY >= scanBottomY;
      const didMove = statsTarget !== scrollTarget || Math.abs(currentY - beforeY) > 8;
      const didGrow = height > lastHeight + 8 || imageCount > lastImageCount || commentCount > lastCommentCount;

      stats.scrolls += 1;
      stats.finalY = currentY;
      stats.finalHeight = height;
      stats.finalViewportHeight = viewportHeight;
      stats.lastDeltaY = Math.round(currentY - beforeY);
      stats.lastImageCount = imageCount;
      stats.lastCommentCount = commentCount;
      stats.lastSettleRounds = settled.rounds;
      stats.lastLoadMoreClicks = beforeLoadMore.clicks + afterLoadMore.clicks;
      stats.scrollRange = scrollRange;
      stats.scrollTarget = statsTarget === window ? "window" : getElementSignature(statsTarget);
      stats.scrollTargetScrollable = statsTarget === window || isActuallyScrollable(statsTarget);
      stats.requestedScrollTarget = scrollTarget === statsTarget ? "" : getElementSignature(scrollTarget);
      stats.outsideEmbeddedScan = outsideEmbeddedScan;

      if (!didGrow && !afterLoadMore.clicks && (!didMove || nearBottom)) {
        stableRounds += 1;
      } else {
        stableRounds = 0;
      }
      if (nearBottom && !didGrow && !beforeLoadMore.clicks && !afterLoadMore.clicks) {
        bottomRounds += 1;
      } else {
        bottomRounds = 0;
      }
      stats.bottomRounds = bottomRounds;

      lastHeight = height;
      lastImageCount = imageCount;
      lastCommentCount = commentCount;

      if (stats.scrolls >= earlyStopMinScrolls && bottomRounds >= bottomStopRounds) {
        stats.stopReason = "reached_scroll_bottom";
        break;
      }
      if (!scrollUntilBottom && stats.scrolls >= earlyStopMinScrolls && stableRounds >= stableStopRounds) {
        stats.stopReason = "stable_no_growth";
        break;
      }
      if (activeCommentView !== "modal" && outsideEmbeddedScan && !didGrow && !afterLoadMore.clicks) {
        stats.stopReason = "outside_embedded_scan";
        break;
      }
    }

    stats.commentLocatorAfterScroll = locateComments();

    return stats;
  };

  window.masakiClawCollectCommentImages = function masakiClawCollectCommentImages(options = {}) {
    if (!activeContentRoot) {
      activeContentRoot = findTargetContentRoot(options);
    }
    const maxImages = normalizeImageLimit(options.maxImages);
    const roots = findCommentRoots();
    const seen = new Set();
    const images = [];
    const debug = createCollectDebug(roots);

    if (!activeContentRoot) {
      collectZhihuStateCommentImages(seen, images, debug);
    }
    secondaryReplyImages.forEach((image) => {
      if (image.originalUrl && !seen.has(image.originalUrl)) {
        seen.add(image.originalUrl);
        images.push(image);
      }
    });

    roots.forEach((root) => {
      collectImgElements(root, seen, images, debug);
      collectBackgroundImages(root, seen, images, debug);
    });

    debug.collected = images.length;
    debug.commentLocator = locateComments();

    return {
      pageTitle: document.title,
      pageUrl: location.href,
      capturedAt: new Date().toISOString(),
      publishedAt: findPagePublishedAt(),
      scope: activeContentRoot ? "target_answer_comments" : roots.length ? "comments" : "comments_state_or_empty",
      prepareStats: options.prepareStats || null,
      captureDebug: debug,
      images: maxImages === null ? images : images.slice(0, maxImages)
    };
  };

  function normalizeImageLimit(value) {
    if (value === null || value === "" || value === undefined) {
      return null;
    }
    return Math.max(1, Number(value) || 80);
  }

  function findPagePublishedAt() {
    const scopedDate = findScopedPublishedAt(activeContentRoot);
    if (scopedDate) {
      return scopedDate;
    }

    const metaSelectors = [
      "meta[property='article:published_time']",
      "meta[name='pubdate']",
      "meta[name='publishdate']",
      "meta[name='publish_date']",
      "meta[itemprop='datePublished']"
    ];
    for (const selector of metaSelectors) {
      const value = document.querySelector(selector)?.getAttribute("content");
      const normalized = normalizeDateLikeValue(value);
      if (normalized) {
        return normalized;
      }
    }

    const jsonLdDate = findJsonLdPublishedAt();
    if (jsonLdDate) {
      return jsonLdDate;
    }

    const timeDate = Array.from(document.querySelectorAll("time[datetime], [itemprop='datePublished'][content], [datetime]"))
      .map((element) => element.getAttribute("datetime") || element.getAttribute("content"))
      .map(normalizeDateLikeValue)
      .find(Boolean);
    if (timeDate) {
      return timeDate;
    }

    return "";
  }

  function findScopedPublishedAt(scope) {
    if (!scope) {
      return "";
    }

    const metaDate = Array.from(scope.querySelectorAll("meta[itemprop='datePublished'], meta[itemprop='dateCreated'], [itemprop='datePublished'][content], [itemprop='dateCreated'][content]"))
      .map((element) => element.getAttribute("content"))
      .map(normalizeDateLikeValue)
      .find(Boolean);
    if (metaDate) {
      return metaDate;
    }

    const textDate = Array.from(scope.querySelectorAll(".ContentItem-time, [class*='ContentItem-time'], time[datetime], [datetime], a, span"))
      .flatMap((element) => [
        element.getAttribute("datetime"),
        element.getAttribute("content"),
        element.getAttribute("data-tooltip"),
        element.getAttribute("aria-label"),
        element.textContent
      ])
      .map(extractPublishedDateFromText)
      .find(Boolean);
    return textDate || "";
  }

  function extractPublishedDateFromText(value) {
    const text = normalizeText(value);
    if (!text) {
      return "";
    }
    const publishedMatch = text.match(/发布于\s*(\d{4}[/-]\d{1,2}[/-]\d{1,2}(?:\s+\d{1,2}:\d{1,2})?)/);
    if (publishedMatch) {
      return normalizeDateLikeValue(publishedMatch[1]);
    }
    const genericMatch = text.match(/(\d{4}[/-]\d{1,2}[/-]\d{1,2}(?:\s+\d{1,2}:\d{1,2})?)/);
    return genericMatch ? normalizeDateLikeValue(genericMatch[1]) : "";
  }

  function findJsonLdPublishedAt() {
    const scripts = Array.from(document.querySelectorAll("script[type='application/ld+json']"));
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent || "null");
        const date = findPublishedDateInObject(data);
        if (date) {
          return date;
        }
      } catch {
        // Ignore invalid structured data from the host page.
      }
    }
    return "";
  }

  function findPublishedDateInObject(value) {
    if (!value || typeof value !== "object") {
      return "";
    }
    if (Array.isArray(value)) {
      return value.map(findPublishedDateInObject).find(Boolean) || "";
    }
    const direct = normalizeDateLikeValue(value.datePublished || value.dateCreated || value.uploadDate);
    if (direct) {
      return direct;
    }
    return Object.values(value).map(findPublishedDateInObject).find(Boolean) || "";
  }

  function normalizeDateLikeValue(value) {
    if (!value) {
      return "";
    }
    const date = new Date(String(value));
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
    const match = String(value).match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    if (!match) {
      return "";
    }
    const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function locateComments() {
    const expectedCount = getExpectedCommentCount();
    const root = findCommentRootContainer();
    const scope = root || document;
    const dataIdItems = getLoadedCommentItems(scope);
    const commentContentNodes = getLoadedCommentContentNodes(scope);
    const selectorCounts = getCommentCandidateSelectors().map((selector) => {
      const elements = Array.from(scope.querySelectorAll(selector)).filter(isVisibleElement);
      return {
        selector,
        count: elements.length,
        samples: elements.slice(0, 3).map((element) => normalizeText(element.innerText).slice(0, 120))
      };
    });
    const best = selectorCounts.slice().sort((a, b) => b.count - a.count)[0] || { selector: "", count: 0 };

    return {
      expectedCount,
      rootSelector: root ? getElementSignature(root) : "",
      rootTextSample: root ? normalizeText(root.innerText).slice(0, 160) : "",
      dataIdCommentItems: dataIdItems.length,
      commentContentNodes: commentContentNodes.length,
      dataIdSamples: dataIdItems.slice(0, 5).map((element) => ({
        id: element.getAttribute("data-id") || "",
        text: normalizeText(element.innerText).slice(0, 120),
        images: element.querySelectorAll("img").length
      })),
      bestSelector: best.selector,
      locatedCount: best.count,
      complete: expectedCount > 0 && best.count >= expectedCount,
      selectorCounts
    };
  }

  function getExpectedCommentCount() {
    const meta = (activeContentRoot || document).querySelector('meta[itemprop="commentCount"]');
    const metaCount = Number(meta?.getAttribute("content"));
    if (Number.isFinite(metaCount) && metaCount > 0) {
      return metaCount;
    }

    const data = parseZhihuInitialData();
    const articleId = getArticleIdFromUrl();
    const articleCount = Number(data?.initialState?.entities?.articles?.[articleId]?.commentCount);
    if (Number.isFinite(articleCount) && articleCount > 0) {
      return articleCount;
    }
    return 0;
  }

  function getArticleIdFromUrl() {
    const match = location.pathname.match(/\/p\/(\d+)/);
    return match?.[1] || "";
  }

  function getAnswerIdFromUrl(value = location.href) {
    try {
      const url = new URL(value, location.href);
      return url.pathname.match(/\/answer\/(\d+)/)?.[1] || "";
    } catch {
      return String(value || "").match(/\/answer\/(\d+)/)?.[1] || "";
    }
  }

  function findTargetContentRoot(options = {}) {
    const answerId = getAnswerIdFromUrl(options.targetUrl || location.href);
    if (!answerId) {
      return null;
    }

    const selectors = [
      `.AnswerItem[name="${cssEscape(answerId)}"]`,
      `.ContentItem[name="${cssEscape(answerId)}"]`,
      `[data-zop*='"itemId":"${answerId}"']`,
      `[data-za-extra-module*='"token":"${answerId}"']`
    ];
    return selectors
      .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
      .map((element) => element.closest(".AnswerItem, .ContentItem") || element)
      .filter(isVisibleElement)[0] || null;
  }

  function cssEscape(value) {
    if (window.CSS?.escape) {
      return CSS.escape(String(value));
    }
    return String(value).replace(/["\\]/g, "\\$&");
  }

  function findCommentRootContainer() {
    const dialog = findCommentDialog();
    if (dialog) {
      return dialog;
    }

    const selectors = [
      ".Comments-container",
      ".CommentsV2",
      "[class*='Comments-container']",
      "[class*='CommentsContainer']",
      "[class*='CommentsV2']",
      ".CommentList",
      "[class*='CommentList']"
    ];

    return selectors
      .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
      .filter(isVisibleElement)
      .sort((a, b) => normalizeText(b.innerText).length - normalizeText(a.innerText).length)[0] || null;
  }

  function getCommentCandidateSelectors() {
    return [
      "div[data-id]",
      "div[data-id] .CommentContent",
      "div[data-id] [class*='CommentContent']",
      ".CommentItem",
      "[class*='CommentItem']",
      ".CommentList-item",
      "[class*='CommentList-item']",
      "[class*='CommentItemV2']",
      "[class*='Comments-item']",
      "[class*='commentItem']",
      "[class*='comment-item']",
      "[data-testid*='comment']",
      "[itemprop='comment']",
      ".CommentContent",
      "[class*='CommentContent']"
    ];
  }

  function normalizeText(text) {
    return String(text || "").replace(/[\u200B-\u200F\uFEFF]/g, "").replace(/\s+/g, " ").trim();
  }

  function mergeSecondaryReplyStats(current, next) {
    const base = current || { visits: 0, clicks: 0, collected: 0, returned: 0, skipped: 0, scrolls: 0, returnAttempts: 0, returnFailed: 0 };
    return {
      visits: base.visits + next.visits,
      clicks: base.clicks + next.clicks,
      collected: base.collected + next.collected,
      returned: base.returned + next.returned,
      skipped: base.skipped + next.skipped,
      scrolls: base.scrolls + (next.scrolls || 0),
      returnAttempts: base.returnAttempts + (next.returnAttempts || 0),
      returnFailed: base.returnFailed + (next.returnFailed || 0),
      lastScrollTarget: next.lastScrollTarget || base.lastScrollTarget || "",
      lastScrollRange: next.lastScrollRange ?? base.lastScrollRange ?? 0,
      lastFinalY: next.lastFinalY ?? base.lastFinalY ?? 0
    };
  }

  function getLoadedCommentItems(scope = document) {
    return Array.from(scope.querySelectorAll("div[data-id]"))
      .filter(isVisibleElement)
      .filter((element) => element.querySelector(".CommentContent, [class*='CommentContent']"));
  }

  function getLoadedCommentContentNodes(scope = document) {
    const fromDataId = getLoadedCommentItems(scope).flatMap((item) =>
      Array.from(item.querySelectorAll(".CommentContent, [class*='CommentContent']"))
    );
    if (fromDataId.length) {
      return uniqueElements(fromDataId).filter(isVisibleElement);
    }

    return Array.from(scope.querySelectorAll(".CommentContent, [class*='CommentContent']")).filter(isVisibleElement);
  }

  function scrollToCommentTop(commentAnchor) {
    const top = Math.max(0, window.scrollY + commentAnchor.getBoundingClientRect().top - 16);
    window.scrollTo({ top, behavior: "auto" });
  }

  function getWindowScanBottom(commentAnchor) {
    if (!commentAnchor || findCommentDialog()) {
      return Infinity;
    }
    const root = findCommentRootContainer() || commentAnchor;
    const rect = root.getBoundingClientRect();
    const bottom = window.scrollY + rect.bottom + Math.max(240, window.innerHeight * 0.5);
    const maxScrollTop = Math.max(0, getScrollHeight() - window.innerHeight);
    return Math.min(maxScrollTop, Math.max(window.scrollY, bottom));
  }

  async function waitForLazyContentSettled(scrollTarget, delayMs) {
    let lastHeight = getScrollTargetHeight(scrollTarget);
    let lastImageCount = countPotentialCommentImages();
    let stableRounds = 0;
    let rounds = 0;

    while (rounds < 3 && stableRounds < 2) {
      await wait(delayMs);
      rounds += 1;

      const height = getScrollTargetHeight(scrollTarget);
      const imageCount = countPotentialCommentImages();
      if (height === lastHeight && imageCount === lastImageCount) {
        stableRounds += 1;
      } else {
        stableRounds = 0;
      }
      lastHeight = height;
      lastImageCount = imageCount;
    }

    return { rounds };
  }

  function getScrollHeight() {
    return Math.max(
      document.scrollingElement?.scrollHeight || 0,
      document.documentElement?.scrollHeight || 0,
      document.body?.scrollHeight || 0
    );
  }

  function getBestScrollTarget() {
    const dialog = findCommentDialog();
    const dialogCandidates = dialog ? getDialogScrollCandidates(dialog) : [];
    const scrollableDialogCandidate = dialogCandidates.find(isActuallyScrollable);
    if (scrollableDialogCandidate) {
      return scrollableDialogCandidate;
    }
    if (dialogCandidates.length) {
      return dialogCandidates[0];
    }

    const scope = dialog || document;
    const candidates = uniqueElements([
      ...(dialog ? [dialog] : []),
      ...Array.from(scope.querySelectorAll("[role='dialog'], .Modal, [class*='Modal'], .CommentList, [class*='CommentList'], [class*='Comment'], [class*='Scroller'], [class*='scroll']"))
    ])
      .filter(isVisibleElement)
      .filter((element) => !dialog || isInsideDialogScope(dialog, element));

    const actuallyScrollable = candidates
      .filter(isActuallyScrollable)
      .map((element) => ({ element, score: scoreScrollTarget(element) + 100 }))
      .sort((a, b) => b.score - a.score);
    if (actuallyScrollable.length) {
      return actuallyScrollable[0].element;
    }

    if (dialog) {
      return window;
    }

    const scrollables = candidates
      .map((element) => ({ element, score: scoreScrollTarget(element) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scrollables[0]?.element || window;
  }

  function normalizeScrollTarget(target) {
    if (target === window || target instanceof Element) {
      return target;
    }
    return window;
  }

  function getDialogScrollCandidates(dialog) {
    if (!dialog) {
      return [];
    }

    return uniqueElements([
      ...Array.from(dialog.querySelectorAll(".Comments-container, [class*='Comments-container'], [class*='CommentsContainer'], [class*='CommentList'], [class*='Modal-content'], [class*='Scroller'], [class*='scroll']")),
      ...Array.from(dialog.querySelectorAll("*")).filter((element) => getScrollableRange(element) > 8),
      dialog
    ])
      .filter(isVisibleElement)
      .filter((element) => isInsideDialogScope(dialog, element))
      .map((element) => ({ element, score: scoreDialogScrollCandidate(element) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.element);
  }

  function scoreDialogScrollCandidate(element) {
    const className = String(element.className || "");
    const text = `${className} ${element.getAttribute("role") || ""} ${element.getAttribute("aria-label") || ""}`;
    const range = getScrollableRange(element);
    const canScroll = range > 8 ? 120 : 0;
    const commentsContainer = /Comments-container|CommentsContainer/i.test(className) ? 90 : 0;
    const commentList = /CommentList/i.test(className) ? 70 : 0;
    const modalContent = /Modal-content|modal/i.test(text) ? 50 : 0;
    const hasComments = element.querySelector("div[data-id] .CommentContent, div[data-id] [class*='CommentContent']") ? 40 : 0;
    const visibleSize = element.clientHeight > 0 ? 10 : -100;
    return canScroll + commentsContainer + commentList + modalContent + hasComments + visibleSize;
  }

  function scoreScrollTarget(element) {
    const style = getComputedStyle(element);
    const canScroll = element.scrollHeight > element.clientHeight + 20;
    const overflowScroll = /(auto|scroll)/i.test(`${style.overflow} ${style.overflowY}`);
    const text = `${element.className || ""} ${element.getAttribute("role") || ""} ${element.innerText || ""}`;
    const commentScore = /comment|评论/i.test(text) ? 50 : 0;
    const dialogScore = /dialog|modal/i.test(text) ? 20 : 0;
    const imageScore = element.querySelector("img, source, [style*='background-image']") ? 20 : 0;
    const sizePenalty = element.scrollHeight === 0 || element.clientHeight === 0 ? -100 : 0;
    return (canScroll || overflowScroll ? 40 : 0) + commentScore + dialogScore + imageScore + sizePenalty;
  }

  function findScrollableRelative(element) {
    const relatives = uniqueElements([
      ...getVisibleAncestors(element),
      element,
      ...Array.from(element.querySelectorAll("*"))
    ]).filter(isVisibleElement);

    return relatives
      .filter(isActuallyScrollable)
      .map((candidate) => ({ element: candidate, score: scoreScrollTarget(candidate) }))
      .sort((a, b) => b.score - a.score)[0]?.element || null;
  }

  function getVisibleAncestors(element) {
    const ancestors = [];
    let current = element.parentElement;
    for (let depth = 0; current && depth < 8; depth += 1) {
      if (isVisibleElement(current)) {
        ancestors.push(current);
      }
      current = current.parentElement;
    }
    return ancestors;
  }

  function isActuallyScrollable(element) {
    if (!element || element === window) {
      return false;
    }
    return element.clientHeight > 0 && getScrollableRange(element) >= MIN_SCROLL_RANGE;
  }

  function getScrollableRange(element) {
    return Math.max(0, element.scrollHeight - element.clientHeight);
  }

  function getScrollTargetHeight(target) {
    return target === window ? getScrollHeight() : target.scrollHeight;
  }

  function getScrollTargetTop(target) {
    return target === window ? window.scrollY : target.scrollTop;
  }

  function getScrollTargetViewportHeight(target) {
    return target === window ? window.innerHeight : target.clientHeight;
  }

  function scrollElementBy(target, top, options = {}) {
    if (target === window) {
      if (options.restrictToDialog && findCommentDialog()) {
        return target;
      }
      window.scrollBy({ top, behavior: "auto" });
      dispatchWheel(document.scrollingElement || document.documentElement, top);
      return window;
    }
    const before = target.scrollTop;
    target.scrollTop += top;
    target.dispatchEvent(new Event("scroll", { bubbles: true }));
    dispatchWheel(target, top);
    if (Math.abs(target.scrollTop - before) > 2) {
      return target;
    }

    const dialog = findCommentDialog();
    const dialogFallback = scrollDialogFallbacks(dialog, target, top);
    if (dialogFallback) {
      return dialogFallback;
    }
    if (options.restrictToDialog && dialog) {
      return target;
    }
    const fallback = findScrollableRelative(target);
    if (fallback && fallback !== target) {
      const fallbackBefore = fallback.scrollTop;
      fallback.scrollTop += top;
      fallback.dispatchEvent(new Event("scroll", { bubbles: true }));
      dispatchWheel(fallback, top);
      if (Math.abs(fallback.scrollTop - fallbackBefore) > 2) {
        return fallback;
      }
    }
    return target;
  }

  function scrollDialogFallbacks(dialog, originalTarget, top) {
    const candidates = getDialogScrollCandidates(dialog)
      .filter((candidate) => candidate !== originalTarget)
      .filter((candidate) => isInsideDialogScope(dialog, candidate));
    for (const candidate of candidates) {
      const before = candidate.scrollTop;
      candidate.scrollTop += top;
      candidate.dispatchEvent(new Event("scroll", { bubbles: true }));
      dispatchWheel(candidate, top);
      if (Math.abs(candidate.scrollTop - before) > 2) {
        return candidate;
      }
    }
    return null;
  }

  function isInsideDialogScope(dialog, element) {
    if (!dialog || !element) {
      return false;
    }
    if (element === document.body || element === document.documentElement || element === document.scrollingElement) {
      return false;
    }
    return element === dialog || dialog.contains(element);
  }

  function dispatchWheel(target, deltaY) {
    target.dispatchEvent(
      new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        deltaY,
        deltaMode: 0
      })
    );
  }

  function getElementSignature(element) {
    return [element.tagName?.toLowerCase(), element.id ? `#${element.id}` : "", element.className ? `.${String(element.className).trim().split(/\s+/).slice(0, 3).join(".")}` : ""]
      .filter(Boolean)
      .join("");
  }

  function findCommentAnchor() {
    const dialog = findCommentDialog();
    if (dialog) {
      return dialog;
    }

    const root = findCommentRootContainer();
    if (root) {
      return root;
    }

    const scope = activeContentRoot || document;
    const roots = uniqueElements(COMMENT_SELECTORS.flatMap((selector) => Array.from(scope.querySelectorAll(selector))));
    if (roots.length) {
      return roots[0];
    }

    const candidates = Array.from(scope.querySelectorAll("button, a, div, span, [role='button'], [class*='Comment']"));
    return candidates.find((element) => /评论|comment/i.test(element.innerText || element.getAttribute("aria-label") || ""));
  }

  async function clickCommentOpeners() {
    const clicked = [];
    let lastCandidates = [];

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const candidates = findCommentOpenerCandidates().filter((candidate) => !clicked.includes(candidate.signature));
      lastCandidates = candidates;
      for (const item of candidates) {
        const clickable = getClickableTarget(item.element);
        if (clickable.closest?.("a[href]")) {
          continue;
        }
        clickable.click();
        clicked.push(item.signature);
        await wait(900);
        if (findCommentDialog()) {
          return {
            clicks: clicked.length,
            clicked: item.signature,
            candidates: candidates.slice(0, 5).map((candidate) => candidate.signature)
          };
        }
        break;
      }
    }

    return {
      clicks: clicked.length,
      clicked: clicked[clicked.length - 1] || "",
      candidates: lastCandidates.slice(0, 5).map((candidate) => candidate.signature)
    };
  }

  function findCommentOpenerCandidates() {
    const scope = activeContentRoot || document;
    return uniqueElements(Array.from(scope.querySelectorAll("button, div, span, [role='button'], .BottomActions-CommentBtn, [class*='CommentBtn']")))
      .filter(isVisibleElement)
      .filter(isAllowedCommentOpenerScope)
      .map((element) => {
        const labelText = normalizeText(`${element.innerText || ""} ${element.getAttribute("aria-label") || ""} ${element.title || ""}`);
        return {
          element,
          labelText,
          score: scoreCommentOpenerLabel(element, labelText),
          signature: `${getElementSignature(element)}:${labelText.slice(0, 80)}`
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  function isAllowedCommentOpenerScope(element) {
    if (element.closest(".QuestionHeader, .QuestionHeader-Comment, [class*='QuestionHeader']")) {
      return false;
    }
    if (!activeContentRoot) {
      return true;
    }
    if (!activeContentRoot.contains(element)) {
      return false;
    }
    const owner = element.closest(".AnswerItem, .ContentItem");
    return !owner || owner === activeContentRoot || activeContentRoot.contains(owner);
  }

  async function clickLoadMoreButtons() {
    const commentPatterns = [
      /加载更多/,
      /查看更多/,
      /展开更多/,
      /显示更多/,
      /更多评论/,
      /下一页/,
      /Load more/i,
      /Show more/i
    ];
    return clickMatchingElements(commentPatterns, 12, { markOnce: false, loadMoreOnly: true });
  }

  async function processSecondaryReplyButtons(delayMs) {
    const stats = { visits: 0, clicks: 0, collected: 0, returned: 0, skipped: 0, scrolls: 0, returnAttempts: 0, returnFailed: 0 };
    const candidates = findSecondaryReplyButtons().filter((item) => !processedSecondaryReplyButtons.has(item.signature));

    for (const item of candidates.slice(0, 2)) {
      processedSecondaryReplyButtons.add(item.signature);
      const clickable = getClickableTarget(item.element);
      if (hasNavigatingHref(clickable)) {
        stats.skipped += 1;
        continue;
      }

      clickable.click();
      stats.clicks += 1;
      await wait(Math.max(500, delayMs * 2));
      if (!isSecondaryReplyView()) {
        stats.skipped += 1;
        continue;
      }

      stats.visits += 1;
      const scrollStats = await scrollSecondaryReplyView(delayMs);
      stats.scrolls += scrollStats.scrolls;
      stats.lastScrollTarget = scrollStats.target;
      stats.lastScrollRange = scrollStats.scrollRange;
      stats.lastFinalY = scrollStats.finalY;
      const beforeCount = secondaryReplyImages.length;
      collectSecondaryReplyImages();
      stats.collected += secondaryReplyImages.length - beforeCount;

      const returnStats = await ensureSecondaryReplyReturned(delayMs);
      stats.returnAttempts += returnStats.returnAttempts;
      if (returnStats.returned) {
        stats.returned += 1;
      } else {
        stats.returnFailed += 1;
        break;
      }
    }

    return stats;
  }

  function findSecondaryReplyButtons() {
    return Array.from(document.querySelectorAll("button, [role='button']"))
      .filter(isVisibleElement)
      .map((element) => {
        const text = normalizeText(`${element.innerText || ""} ${element.getAttribute("aria-label") || ""} ${element.title || ""}`);
        return {
          element,
          text,
          score: scoreSecondaryReplyButton(text),
          signature: `${getClosestCommentId(element)}:${text}`
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  function scoreSecondaryReplyButton(text) {
    if (/查看全部\s*\d+\s*条回复/.test(text)) {
      return 100;
    }
    if (/展开其他\s*\d+\s*条回复/.test(text)) {
      return 80;
    }
    return 0;
  }

  function getClosestCommentId(element) {
    return element.closest?.("div[data-id]")?.getAttribute("data-id") || "";
  }

  function isSecondaryReplyView() {
    return Boolean(findSecondaryReplyRoot());
  }

  async function scrollSecondaryReplyView(delayMs) {
    const root = findSecondaryReplyRoot();
    const target = findSecondaryReplyScrollTarget(root);
    if (!root || !target) {
      return { scrolls: 0, target: "", finalY: 0, scrollRange: 0 };
    }

    let stableRounds = 0;
    let scrolls = 0;
    let lastHeight = target.scrollHeight;
    let lastImageCount = countSecondaryReplyPotentialImages(root);
    const step = Math.max(680, window.innerHeight);

    for (let index = 0; index < 10; index += 1) {
      const before = target.scrollTop;
      scrollSecondaryElementBy(target, root, step);
      await wait(delayMs);
      scrolls += 1;

      const after = target.scrollTop;
      const height = target.scrollHeight;
      const imageCount = countSecondaryReplyPotentialImages(root);
      const scrollRange = getScrollableRange(target);
      const nearBottom = scrollRange > 8 && after + target.clientHeight >= height - 32;
      const didMove = Math.abs(after - before) > 8;
      const didGrow = height > lastHeight + 8 || imageCount > lastImageCount;

      if (!didMove && !didGrow) {
        stableRounds += 1;
      } else {
        stableRounds = 0;
      }
      if ((nearBottom && !didGrow) || stableRounds >= 2) {
        break;
      }

      lastHeight = height;
      lastImageCount = imageCount;
    }

    return {
      scrolls,
      target: getElementSignature(target),
      finalY: target.scrollTop,
      scrollRange: getScrollableRange(target)
    };
  }

  function collectSecondaryReplyImages() {
    const scope = findSecondaryReplyRoot() || document;
    const roots = getLoadedCommentContentNodes(scope).filter((root) => root.querySelector("img, source, [style*='background-image']"));
    const seen = new Set(secondaryReplyImages.map((image) => image.originalUrl).filter(Boolean));
    const images = [];
    const debug = createCollectDebug(roots);

    roots.forEach((root) => {
      collectImgElements(root, seen, images, debug);
      collectBackgroundImages(root, seen, images, debug);
    });

    images.forEach((image) => {
      secondaryReplyImages.push({
        ...image,
        source: "secondary_reply"
      });
    });
  }

  async function ensureSecondaryReplyReturned(delayMs) {
    const stats = { visits: 0, clicks: 0, collected: 0, returned: 0, skipped: 0, scrolls: 0, returnAttempts: 0, returnFailed: 0 };
    if (!isSecondaryReplyView()) {
      stats.returned = 1;
      return stats;
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      revealSecondaryReplyReturnArea();
      const candidates = findSecondaryReplyReturnCandidates();
      if (!candidates.length) {
        await wait(Math.max(250, delayMs));
        break;
      }

      for (const element of candidates.slice(0, 4)) {
        if (hasNavigatingHref(element)) {
          continue;
        }
        clickElementLikeUser(element);
        stats.returnAttempts += 1;
        await wait(Math.max(350, delayMs));
        if (!isSecondaryReplyView()) {
          activeSecondaryReplyRoot = null;
          stats.returned = 1;
          return stats;
        }
      }
    }

    stats.returnFailed = 1;
    return stats;
  }

  function findSecondaryReplyReturnButton() {
    return findSecondaryReplyReturnCandidates({ requireVisible: false })[0] || null;
  }

  function findSecondaryReplyReturnCandidates(options = {}) {
    const requireVisible = options.requireVisible !== false;
    const textMatches = Array.from(document.querySelectorAll("button, div, span, [role='button']"))
      .filter((element) => !requireVisible || isVisibleElement(element))
      .filter((element) => normalizeText(element.innerText || element.getAttribute("aria-label") || element.title || "") === "评论回复");
    const arrowMatches = Array.from(document.querySelectorAll(".ZDI--ArrowLeftSmall24, svg[class*='ArrowLeft']"))
      .filter((element) => !requireVisible || isVisibleElement(element))
      .map((element) => findCompactTextAncestor(element, "评论回复"))
      .filter(Boolean);
    const exact = uniqueElements([...textMatches, ...arrowMatches]);

    const candidates = [];
    exact.forEach((element) => {
      candidates.push(getClickableTarget(element));
      let current = element;
      for (let depth = 0; current && depth < 5; depth += 1) {
        if (current === document.body || current === document.documentElement) {
          break;
        }
        const text = normalizeText(current.innerText || current.getAttribute?.("aria-label") || current.title || "");
        if (text === "评论回复" || (text.includes("评论回复") && text.length <= 40)) {
          candidates.push(current);
        }
        current = current.parentElement;
      }
    });

    return uniqueElements(candidates).filter((element) => !requireVisible || isVisibleElement(element));
  }

  function findCompactTextAncestor(element, expectedText) {
    let current = element;
    for (let depth = 0; current && depth < 6; depth += 1) {
      if (current === document.body || current === document.documentElement) {
        return null;
      }
      const text = normalizeText(current.innerText || current.getAttribute?.("aria-label") || current.title || "");
      if (text === expectedText || (text.includes(expectedText) && text.length <= 40)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  function clickElementLikeUser(element) {
    const rect = element.getBoundingClientRect();
    const clientX = Math.max(1, rect.left + Math.min(rect.width / 2, 24));
    const clientY = Math.max(1, rect.top + rect.height / 2);
    const PointerCtor = window.PointerEvent || MouseEvent;
    ["pointerdown", "pointerup"].forEach((type) => {
      element.dispatchEvent(new PointerCtor(type, { bubbles: true, cancelable: true, view: window, pointerId: 1, pointerType: "mouse", clientX, clientY }));
    });
    ["mousedown", "mouseup", "click"].forEach((type) => {
      element.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window, clientX, clientY }));
    });
    element.click?.();
  }

  function findSecondaryReplyRoot() {
    if (activeSecondaryReplyRoot?.isConnected && looksLikeSecondaryReplyRoot(activeSecondaryReplyRoot)) {
      return activeSecondaryReplyRoot;
    }

    const returnButton = findSecondaryReplyReturnButton();
    if (!returnButton) {
      return null;
    }

    let current = returnButton.parentElement;
    for (let depth = 0; current && depth < 14; depth += 1) {
      if (current === document.body || current === document.documentElement) {
        break;
      }
      if (looksLikeSecondaryReplyRoot(current)) {
        activeSecondaryReplyRoot = current;
        return current;
      }
      current = current.parentElement;
    }

    return returnButton.parentElement || null;
  }

  function looksLikeSecondaryReplyRoot(element) {
    if (!element || element === document.body || element === document.documentElement) {
      return false;
    }
    const text = normalizeText(element.innerText);
    const hasReturn = text.includes("评论回复") || element.querySelector(".ZDI--ArrowLeftSmall24, svg[class*='ArrowLeft']");
    const hasReplyHeader = /\d+\s*条回复/.test(text);
    const hasCommentContent = element.querySelector("div[data-id] .CommentContent, div[data-id] [class*='CommentContent']");
    return Boolean(hasReturn && hasReplyHeader && hasCommentContent);
  }

  function findSecondaryReplyScrollTarget(root) {
    if (!root) {
      return null;
    }

    const descendants = Array.from(root.querySelectorAll("*"));
    const ancestors = getVisibleAncestors(root).filter((element) => element !== document.body && element !== document.documentElement);
    const candidates = uniqueElements([root, ...descendants, ...ancestors])
      .filter(isVisibleElement)
      .map((element) => ({ element, score: scoreSecondaryReplyScrollTarget(element, root) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return candidates[0]?.element || root;
  }

  function scoreSecondaryReplyScrollTarget(element, root) {
    if (!element || element === document.body || element === document.documentElement) {
      return 0;
    }
    if (element !== root && !element.contains(root) && !root.contains(element)) {
      return 0;
    }

    const className = String(element.className || "");
    const role = element.getAttribute("role") || "";
    const label = element.getAttribute("aria-label") || "";
    const text = `${className} ${role} ${label} ${normalizeText(element.innerText).slice(0, 300)}`;
    const range = getScrollableRange(element);
    const canScroll = range > 8 ? 140 : 0;
    const replyHeader = /\d+\s*条回复/.test(text) ? 60 : 0;
    const replyItems = Math.min(80, element.querySelectorAll("div[data-id] .CommentContent, div[data-id] [class*='CommentContent']").length * 8);
    const modalScore = /modal|dialog|content/i.test(text) ? 30 : 0;
    const commentScore = /comment|评论|reply|回复/i.test(text) ? 30 : 0;
    const rootScore = element === root ? 20 : 0;
    const contentChildScore = element.parentElement === root && replyItems > 0 ? 100 : 0;
    const returnHeaderPenalty = element.querySelector(".ZDI--ArrowLeftSmall24, svg[class*='ArrowLeft']") ? -90 : 0;
    const sizePenalty = element.clientHeight <= 0 ? -100 : 0;

    return canScroll + replyHeader + replyItems + modalScore + commentScore + rootScore + contentChildScore + returnHeaderPenalty + sizePenalty;
  }

  function revealSecondaryReplyReturnArea() {
    const root = findSecondaryReplyRoot();
    if (!root) {
      return;
    }
    const target = findSecondaryReplyScrollTarget(root) || root;
    [target, root].forEach((element) => {
      if (!element || element === document.body || element === document.documentElement) {
        return;
      }
      element.scrollTop = 0;
      element.dispatchEvent(new Event("scroll", { bubbles: true }));
    });
  }

  function scrollSecondaryElementBy(target, root, top) {
    const before = target.scrollTop;
    target.scrollTop += top;
    target.dispatchEvent(new Event("scroll", { bubbles: true }));
    dispatchWheel(target, top);
    if (root && root !== target) {
      dispatchWheel(root, top);
    }
    return Math.abs(target.scrollTop - before) > 2;
  }

  function countSecondaryReplyPotentialImages(root) {
    if (!root) {
      return 0;
    }
    return Array.from(root.querySelectorAll("img, source, [style*='background-image']"))
      .filter((element) => !shouldSkipElement(element))
      .length;
  }

  async function clickMatchingElements(patterns, limit, options = {}) {
    const markOnce = options.markOnce !== false;
    const openerOnly = options.openerOnly === true;
    const loadMoreOnly = options.loadMoreOnly === true;
    let clicks = 0;
    const selector = openerOnly
      ? "button, div, span, [role='button'], .BottomActions-CommentBtn, [class*='CommentBtn']"
      : loadMoreOnly
        ? "button, [role='button']"
        : "button, a, div, span, [role='button']";
    const elements = Array.from(document.querySelectorAll(selector)).sort((a, b) => {
      if (openerOnly) return scoreCommentOpenerCandidate(b) - scoreCommentOpenerCandidate(a);
      if (loadMoreOnly) return scoreLoadMoreCandidate(b) - scoreLoadMoreCandidate(a);
      return scoreCommentOpenerCandidate(b) - scoreCommentOpenerCandidate(a);
    });

    for (const element of elements) {
      if (clicks >= limit) break;
      if (!isVisibleElement(element) || element.disabled || (markOnce && element.dataset.masakiClawClicked === "true")) {
        continue;
      }

      const labelText = `${element.innerText || ""} ${element.getAttribute("aria-label") || ""} ${element.title || ""}`.trim();
      const text = `${labelText} ${element.className || ""}`.trim();
      const isKnownCommentButton = /\bBottomActions-CommentBtn\b|CommentBtn/i.test(String(element.className || ""));
      const matchesText = patterns.some((pattern) => pattern.test(labelText));
      if (loadMoreOnly && isReplyExpansionText(text)) {
        continue;
      }
      if (openerOnly && !matchesText) {
        continue;
      }
      if (loadMoreOnly && isKnownCommentButton) {
        continue;
      }
      if (!openerOnly && (!text || !patterns.some((pattern) => pattern.test(text)))) {
        continue;
      }

      const clickable = getClickableTarget(element);
      if (hasNavigatingHref(clickable)) {
        continue;
      }
      if (markOnce && clickable.dataset.masakiClawClicked === "true") {
        continue;
      }
      if (markOnce) {
        clickable.dataset.masakiClawClicked = "true";
      }
      clickable.click();
      clicks += 1;
    }

    return { clicks };
  }

  function getClickableTarget(element) {
    return element.closest("button, a, [role='button']") || element;
  }

  function hasNavigatingHref(element) {
    const anchor = element.closest?.("a[href]");
    if (!anchor) {
      return false;
    }
    const href = anchor.getAttribute("href") || "";
    return Boolean(href && !href.startsWith("#") && !href.startsWith("javascript:"));
  }

  function scoreCommentOpenerCandidate(element) {
    const text = `${element.innerText || ""} ${element.getAttribute("aria-label") || ""} ${element.title || ""}`.trim();
    return scoreCommentOpenerLabel(element, text);
  }

  function scoreCommentOpenerLabel(element, text) {
    const className = String(element.className || "");
    const normalized = normalizeText(text);
    if (normalized.length > 140) {
      return 0;
    }
    const hasCommentText = /点击查看全部评论|查看全部评论|\d+\s*条评论|\d+\s*评论|View.*comment|Show.*comment/i.test(normalized);
    const knownCommentButton = hasCommentText && /\bBottomActions-CommentBtn\b|CommentBtn/i.test(className) ? 100 : 0;
    const exactAllComments = /点击查看全部评论|查看全部评论/.test(normalized) ? 80 : 0;
    const countText = /\d+\s*条评论|\d+\s*评论/.test(normalized) ? 40 : 0;
    const nativeControl = /^(BUTTON|A)$/.test(element.tagName || "") || element.getAttribute("role") === "button" ? 20 : 0;
    return knownCommentButton + exactAllComments + countText + nativeControl;
  }

  function scoreLoadMoreCandidate(element) {
    const text = `${element.innerText || ""} ${element.getAttribute("aria-label") || ""} ${element.title || ""}`.trim();
    const moreComments = /加载更多|查看更多|显示更多|更多评论/.test(text) ? 40 : 0;
    const nativeControl = /^(BUTTON|A)$/.test(element.tagName || "") || element.getAttribute("role") === "button" ? 20 : 0;
    return moreComments + nativeControl;
  }

  function isReplyExpansionText(text) {
    return /回复|展开其他\s*\d+\s*条回复|展开.*其他.*回复|其他\s*\d+\s*条回复/i.test(String(text || ""));
  }

  async function waitForCommentDialog(timeoutMs) {
    const startedAt = Date.now();
    let dialog = findCommentDialog();
    while (!dialog && Date.now() - startedAt < timeoutMs) {
      await wait(250);
      dialog = findCommentDialog();
    }
    return dialog;
  }

  function findCommentDialog() {
    if (activeCommentView === "embedded") {
      return null;
    }
    const candidates = uniqueElements(COMMENT_DIALOG_SELECTORS.flatMap((selector) => Array.from(document.querySelectorAll(selector)))).filter(isVisibleElement);
    return candidates
      .map((element) => ({ element, score: scoreCommentDialog(element) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)[0]?.element || null;
  }

  function scoreCommentDialog(element) {
    const text = `${element.className || ""} ${element.getAttribute("role") || ""} ${element.getAttribute("aria-label") || ""} ${element.innerText || ""}`;
    const isDialogShell = element.getAttribute("role") === "dialog" || /(^|\s)Modal(\s|$)|Modal-content|modal/i.test(String(element.className || ""));
    if (!isDialogShell) {
      return 0;
    }
    const hasCommentSignal = /comment|评论/i.test(text) || element.querySelector("div[data-id] .CommentContent, div[data-id] [class*='CommentContent'], .Comments-container, [class*='Comments-container']");
    if (!hasCommentSignal) {
      return 0;
    }
    const commentScore = /comment|评论/i.test(text) ? 60 : 0;
    const dialogScore = element.getAttribute("role") === "dialog" || /modal/i.test(String(element.className || "")) ? 30 : 0;
    const listScore = /CommentList/i.test(String(element.className || "")) ? 40 : 0;
    const hasCommentImage = element.querySelector("img, source, [style*='background-image']") ? 10 : 0;
    const scrollScore = element.scrollHeight > element.clientHeight + 20 ? 10 : 0;
    return commentScore + dialogScore + listScore + hasCommentImage + scrollScore;
  }

  function isVisibleElement(element) {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  }

  function countPotentialCommentImages() {
    return findCommentRoots().reduce((count, root) => count + root.querySelectorAll("img, source, [style*='background-image']").length, 0);
  }

  function countLoadedCommentContents() {
    const dialog = findCommentDialog();
    const root = dialog || findCommentRootContainer() || document;
    return getLoadedCommentContentNodes(root).length;
  }

  function findCommentRoots() {
    const dialog = findCommentDialog();
    const scope = dialog || activeContentRoot || document;
    const commentContentRoots = getLoadedCommentContentNodes(scope).filter((root) => root.querySelector("img, source, [style*='background-image']"));
    if (commentContentRoots.length) {
      return commentContentRoots;
    }

    const roots = uniqueElements(COMMENT_SELECTORS.flatMap((selector) => Array.from(scope.querySelectorAll(selector))));
    if (dialog && dialog.querySelector("img, source, [style*='background-image']")) {
      roots.unshift(dialog);
    }
    const usefulRoots = roots.filter((root) => root.querySelector("img, source, [style*='background-image']"));
    if (usefulRoots.length) {
      return usefulRoots;
    }
    return [];
  }

  function createCollectDebug(roots) {
    return {
      roots: roots.length,
      potentialNodes: roots.reduce((count, root) => count + root.querySelectorAll("img, source, [style*='background-image']").length, 0),
      stateCandidates: 0,
      domImgNodes: 0,
      backgroundNodes: 0,
      skippedByElement: 0,
      skippedNoUrl: 0,
      skippedDuplicate: 0,
      skippedUnhelpfulUrl: 0,
      skippedSmallIcon: 0,
      collected: 0,
      samples: []
    };
  }

  function addDebugSample(debug, reason, value) {
    if (debug.samples.length >= 20) {
      return;
    }
    debug.samples.push({ reason, value: String(value || "").slice(0, 220) });
  }

  function collectZhihuStateCommentImages(seen, images, debug) {
    const data = parseZhihuInitialData();
    if (!data) {
      return;
    }

    walkState(data, [], (value, path) => {
      if (!value || typeof value !== "object" || !isCommentStateObject(value, path)) {
        return;
      }

      const urls = [];
      if (value.imageUrl) {
        urls.push({ url: value.imageUrl, source: "comment.imageUrl" });
      }
      if (value.content) {
        urls.push(...extractImageUrlsFromHtml(value.content).map((url) => ({ url, source: "comment.content" })));
      }

      urls.forEach((item) => {
        debug.stateCandidates += 1;
        const candidates = buildDownloadCandidates(item.url, 120);
        const best = candidates[0];
        if (!best?.downloadUrl || seen.has(best.downloadUrl) || looksLikeUnhelpfulUrl(best.downloadUrl)) {
          if (!best?.downloadUrl) debug.skippedNoUrl += 1;
          else if (seen.has(best.downloadUrl)) debug.skippedDuplicate += 1;
          else debug.skippedUnhelpfulUrl += 1;
          addDebugSample(debug, "state-skip", item.url);
          return;
        }
        seen.add(best.downloadUrl);
        images.push(buildStateImageRecord(best.downloadUrl, best.pageImageUrl, candidates, value, item.source));
      });
    });
  }

  function parseZhihuInitialData() {
    const script = document.querySelector("#js-initialData[type='text/json'], #js-initialData");
    if (!script?.textContent) {
      return null;
    }
    try {
      return JSON.parse(script.textContent);
    } catch {
      return null;
    }
  }

  function walkState(value, path, visitor) {
    visitor(value, path);
    if (!value || typeof value !== "object") {
      return;
    }
    Object.entries(value).forEach(([key, child]) => walkState(child, path.concat(key), visitor));
  }

  function isCommentStateObject(value, path) {
    const pathText = path.join(".");
    return value.type === "comment" || /\.comments(V2)?\./i.test(pathText) || /\.comments(V2)?$/i.test(pathText);
  }

  function extractImageUrlsFromHtml(html) {
    try {
      const doc = new DOMParser().parseFromString(String(html), "text/html");
      return Array.from(doc.querySelectorAll("img"))
        .map((img) => img.getAttribute("src"))
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  function collectImgElements(root, seen, images, debug) {
    root.querySelectorAll("img, source").forEach((element) => {
      debug.domImgNodes += 1;
      if (shouldSkipElement(element)) {
        debug.skippedByElement += 1;
        addDebugSample(debug, "element", element.outerHTML);
        return;
      }

      const candidates = getPreferredImageCandidates(element);
      if (!candidates.length) {
        debug.skippedNoUrl += 1;
        addDebugSample(debug, "no-url", element.outerHTML);
      }
      candidates.forEach((candidate) => {
        if (!candidate.downloadUrl || seen.has(candidate.downloadUrl)) {
          if (!candidate.downloadUrl) debug.skippedNoUrl += 1;
          else debug.skippedDuplicate += 1;
          return;
        }

        if (looksLikeUnhelpfulUrl(candidate.downloadUrl) || isStickerLikeUrl(candidate.downloadUrl) || looksLikeSmallIcon(element)) {
          if (looksLikeUnhelpfulUrl(candidate.downloadUrl) || isStickerLikeUrl(candidate.downloadUrl)) debug.skippedUnhelpfulUrl += 1;
          else debug.skippedSmallIcon += 1;
          addDebugSample(debug, "filtered", candidate.downloadUrl);
          return;
        }

        seen.add(candidate.downloadUrl);
        images.push(buildImageRecord(candidate.downloadUrl, element, candidate.pageImageUrl, candidate.fallbackUrls));
      });
    });
  }

  function collectBackgroundImages(root, seen, images, debug) {
    root.querySelectorAll("*").forEach((element) => {
      debug.backgroundNodes += 1;
      if (shouldSkipElement(element) || isStickerLikeElement(element) || looksLikeSmallIcon(element)) {
        if (shouldSkipElement(element)) debug.skippedByElement += 1;
        else if (isStickerLikeElement(element)) debug.skippedUnhelpfulUrl += 1;
        else debug.skippedSmallIcon += 1;
        return;
      }

      const style = getComputedStyle(element);
      const candidates = parseCssImageUrls(style.backgroundImage).flatMap((url) => buildDownloadCandidates(url));
      candidates.forEach((candidate) => {
        if (!candidate.downloadUrl || seen.has(candidate.downloadUrl) || looksLikeUnhelpfulUrl(candidate.downloadUrl) || isStickerLikeUrl(candidate.downloadUrl)) {
          if (!candidate.downloadUrl) debug.skippedNoUrl += 1;
          else if (seen.has(candidate.downloadUrl)) debug.skippedDuplicate += 1;
          else debug.skippedUnhelpfulUrl += 1;
          return;
        }

        seen.add(candidate.downloadUrl);
        images.push(buildImageRecord(candidate.downloadUrl, element, candidate.pageImageUrl, candidate.fallbackUrls));
      });
    });
  }

  function getPreferredImageCandidates(element) {
    const urls = [];
    const linkedImage = getClosestLinkedImage(element);
    if (linkedImage) urls.push({ value: linkedImage, priority: 100 });

    LAZY_ATTRS.forEach((attr) => {
      const value = element.getAttribute(attr);
      if (!value) return;
      if (value.includes(",")) {
        urls.push(...parseSrcset(value).map((item) => ({ value: item.url, priority: 90 + item.score })));
      } else {
        urls.push({ value, priority: 90 });
      }
    });

    if (element.srcset) {
      urls.push(...parseSrcset(element.srcset).map((item) => ({ value: item.url, priority: 70 + item.score })));
    }
    if (element.currentSrc) urls.push({ value: element.currentSrc, priority: 50 });
    if (element.src) urls.push({ value: element.src, priority: 40 });

    const sortedCandidates = urls
      .flatMap((item) => buildDownloadCandidates(item.value, item.priority))
      .sort((a, b) => b.score - a.score)
      .filter((candidate, index, candidates) => candidates.findIndex((item) => item.downloadUrl === candidate.downloadUrl) === index);

    if (!sortedCandidates.length) {
      return [];
    }

    return [
      {
        ...sortedCandidates[0],
        fallbackUrls: sortedCandidates.map((candidate) => candidate.downloadUrl)
      }
    ];
  }

  function parseSrcset(srcset) {
    return String(srcset)
      .split(",")
      .map((item) => {
        const [url, descriptor = ""] = item.trim().split(/\s+/);
        return {
          url,
          score: descriptor.endsWith("w") ? Number.parseInt(descriptor, 10) / 100 : 0
        };
      })
      .filter((item) => item.url);
  }

  function parseCssImageUrls(value) {
    const urls = [];
    const re = /url\((['"]?)(.*?)\1\)/g;
    let match;
    while ((match = re.exec(value || ""))) {
      urls.push(match[2]);
    }
    return urls;
  }

  function normalizeUrl(value) {
    if (!value || value.startsWith("data:") || value.startsWith("blob:")) {
      return "";
    }
    try {
      const url = new URL(value, location.href);
      url.hash = "";
      return url.href;
    } catch {
      return "";
    }
  }

  function buildDownloadCandidates(value, baseScore = 0) {
    const pageImageUrl = normalizeUrl(value);
    if (!pageImageUrl) {
      return [];
    }

    const urls = [pageImageUrl, ...getZhihuOriginalCandidates(pageImageUrl)];
    return Array.from(new Set(urls))
      .map((downloadUrl) => ({
        downloadUrl,
        pageImageUrl,
        score: baseScore + scoreImageUrl(downloadUrl, pageImageUrl),
        fallbackUrls: []
      }))
      .sort((a, b) => b.score - a.score);
  }

  function getClosestLinkedImage(element) {
    const anchor = element.closest("a[href]");
    if (!anchor) {
      return "";
    }

    const href = anchor.getAttribute("href") || "";
    if (!/\.(jpe?g|png|webp|gif)(?:$|[?#])/i.test(href) && !/zhimg\.com/i.test(href)) {
      return "";
    }
    return href;
  }

  function getZhihuOriginalCandidates(value) {
    let url;
    try {
      url = new URL(value);
    } catch {
      return [];
    }

    if (!/(^|\.)zhimg\.com$/i.test(url.hostname)) {
      return [];
    }

    const candidates = [];
    const clean = new URL(url.href);
    clean.search = "";
    clean.hash = "";

    const withoutQualityPath = new URL(clean.href);
    withoutQualityPath.pathname = withoutQualityPath.pathname.replace(/\/(?:50|70|80)\//, "/");
    candidates.push(withoutQualityPath.href);

    const sizeSuffixRe = /_(?:\d+w|hd|b|r|l|xl)(\.(?:jpe?g|png|webp|gif|image))$/i;
    ["_r", "_b", "_xl"].forEach((suffix) => {
      const candidate = new URL(withoutQualityPath.href);
      candidate.pathname = candidate.pathname.replace(sizeSuffixRe, `${suffix}$1`);
      candidates.push(candidate.href);
    });

    return candidates;
  }

  function scoreImageUrl(downloadUrl, pageImageUrl) {
    let score = 0;
    if (downloadUrl !== pageImageUrl) score += 25;
    if (/zhimg\.com/i.test(downloadUrl)) score += 10;
    if (/_r\.(?:jpe?g|png|webp|gif|image)$/i.test(downloadUrl)) score += 40;
    if (/_b\.(?:jpe?g|png|webp|gif|image)$/i.test(downloadUrl)) score += 30;
    if (/_xl\.(?:jpe?g|png|webp|gif|image)$/i.test(downloadUrl)) score += 20;
    if (/\/(?:50|70|80)\//.test(downloadUrl)) score -= 20;
    if (/_(?:\d{2,4}w|hd)\./i.test(downloadUrl)) score -= 10;
    return score;
  }

  function shouldSkipElement(element) {
    if (isEditorOrPickerImage(element)) {
      return true;
    }

    if (isStickerLikeElement(element)) {
      return true;
    }

    const classText = getAncestryText(element);
    if (EXCLUDE_ANCESTOR_RE.test(classText) && isAvatarLikeElement(element)) {
      return true;
    }

    const alt = element.getAttribute("alt") || "";
    return /avatar|头像|用户头像|icon|logo|徽章/i.test(alt);
  }

  function getAncestryText(element) {
    const parts = [];
    let current = element;
    for (let depth = 0; current && depth < 5; depth += 1) {
      parts.push(current.className || "", current.id || "", current.getAttribute?.("aria-label") || "");
      current = current.parentElement;
    }
    return parts.join(" ");
  }

  function looksLikeSmallIcon(element) {
    const rect = element.getBoundingClientRect();
    const naturalWidth = Number(element.naturalWidth) || 0;
    const naturalHeight = Number(element.naturalHeight) || 0;
    const width = Math.max(rect.width || 0, naturalWidth);
    const height = Math.max(rect.height || 0, naturalHeight);

    if (!width || !height) {
      return false;
    }

    if (isAvatarLikeElement(element) && width < MIN_USEFUL_SIDE && height < MIN_USEFUL_SIDE) {
      return true;
    }

    const isSquareish = Math.abs(width - height) <= 16;
    return isAvatarLikeElement(element) && isSquareish && width * height <= MAX_ICON_AREA;
  }

  function isAvatarLikeElement(element) {
    const text = getAncestryText(element);
    const alt = element.getAttribute?.("alt") || "";
    return /avatar|头像|用户头像|author|badge|icon|logo|commentauthor/i.test(`${text} ${alt}`);
  }

  function isEditorOrPickerImage(element) {
    const text = getAncestryText(element);
    return /Editable|DraftEditor|Dropzone|InputLike|EmoHappy|emotion|emoji|sticker|popover|picker|css-pcc2vs|css-dza3t2/i.test(text);
  }

  function looksLikeUnhelpfulUrl(url) {
    return /avatar|icon|logo|badge|sprite|loading|placeholder|grey\.gif|blank\.gif|\/equation\?/i.test(url);
  }

  function isStickerLikeElement(element) {
    const text = `${getAncestryText(element)} ${element.getAttribute?.("alt") || ""} ${element.getAttribute?.("title") || ""}`;
    if (/sticker|emoji|emoticon|emotion|reaction|表情|贴纸/i.test(text)) {
      return true;
    }
    return isZhihuBuiltinReactionImage(element);
  }

  function isStickerLikeUrl(url) {
    return /sticker|emoji|emoticon|emotion|reaction|表情|贴纸/i.test(String(url || ""));
  }

  function isZhihuBuiltinReactionImage(element) {
    const alt = normalizeText(element.getAttribute?.("alt") || "");
    if (!/^(爱|害羞|酷|大笑|发呆|捂脸|机智|赞|怒|惊讶|流泪|偷笑|尴尬|可怜|思考|笑哭|飙泪|鄙视|疑问)$/.test(alt)) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    const naturalWidth = Number(element.naturalWidth) || 0;
    const naturalHeight = Number(element.naturalHeight) || 0;
    const width = Math.max(rect.width || 0, naturalWidth);
    const height = Math.max(rect.height || 0, naturalHeight);
    return width > 0 && height > 0 && width <= 72 && height <= 72;
  }

  function buildStateImageRecord(url, pageImageUrl, candidates, comment, source) {
    const stateCreatedTime = getStateCommentCreatedTime(comment);
    const commentTime = formatStateCommentTime(stateCreatedTime);
    return {
      originalUrl: url,
      thumbnailUrl: pageImageUrl && pageImageUrl !== url ? pageImageUrl : "",
      fallbackUrls: candidates.map((candidate) => candidate.downloadUrl).filter((item) => item && item !== url),
      originalName: getOriginalName(url),
      alt: "",
      title: "",
      weakDescription: getCommentText(comment),
      width: 0,
      height: 0,
      source,
      commentId: comment.id || "",
      authorName: comment.author?.name || comment.author?.member?.name || "",
      createdTime: stateCreatedTime,
      commentTime
    };
  }

  function getStateCommentCreatedTime(comment) {
    return comment.createdTime || comment.created_time || comment.createdAt || comment.createTime || comment.created || comment.time || "";
  }

  function formatStateCommentTime(value) {
    if (!value) {
      return "";
    }
    if (typeof value === "number" || /^\d{10,13}$/.test(String(value))) {
      const timestamp = Number(value) < 100000000000 ? Number(value) * 1000 : Number(value);
      const date = new Date(timestamp);
      if (!Number.isNaN(date.getTime())) {
        return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      }
    }
    return extractCommentTimeText(value);
  }

  function getCommentText(comment) {
    const text = comment.content || comment.excerpt || comment.text || "";
    return String(text).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
  }

  function buildImageRecord(url, element, pageImageUrl, fallbackUrls) {
    const rect = element.getBoundingClientRect();
    return {
      originalUrl: url,
      thumbnailUrl: pageImageUrl && pageImageUrl !== url ? pageImageUrl : "",
      fallbackUrls: Array.from(new Set(fallbackUrls || [url])).filter((item) => item && item !== url),
      originalName: getOriginalName(url),
      alt: element.getAttribute("alt") || "",
      title: element.getAttribute("title") || "",
      weakDescription: getNearbyText(element),
      width: Math.round(Math.max(rect.width || 0, Number(element.naturalWidth) || 0)),
      height: Math.round(Math.max(rect.height || 0, Number(element.naturalHeight) || 0)),
      commentTime: getCommentTime(element)
    };
  }

  function getOriginalName(url) {
    try {
      const pathname = new URL(url).pathname;
      const name = decodeURIComponent(pathname.split("/").filter(Boolean).pop() || "");
      return name || "image";
    } catch {
      return "image";
    }
  }

  function getNearbyText(element) {
    const holder = element.closest(".CommentItem, .CommentContent, [class*='Comment']") || element.parentElement;
    return (holder?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 180);
  }

  function getCommentTime(element) {
    const item = element.closest("div[data-id]") || element.closest(".CommentItem, [class*='CommentItem']") || element.closest(".CommentContent, [class*='CommentContent']");
    if (!item) {
      return "";
    }

    const candidates = Array.from(item.querySelectorAll("time, [datetime], [data-tooltip], [aria-label], span, a, div"))
      .flatMap((node) => [
        node.getAttribute?.("datetime"),
        node.getAttribute?.("content"),
        node.getAttribute?.("data-tooltip"),
        node.getAttribute?.("aria-label"),
        node.getAttribute?.("title"),
        node.textContent
      ])
      .map(extractCommentTimeText)
      .filter(Boolean);
    if (candidates.length) {
      return candidates[0];
    }

    return extractCommentTimeText(item.innerText || "");
  }

  function extractCommentTimeText(value) {
    const text = normalizeText(value);
    if (!text) {
      return "";
    }

    const iso = text.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2}))?/);
    if (iso) {
      const datePart = `${String(Number(iso[2])).padStart(2, "0")}-${String(Number(iso[3])).padStart(2, "0")}`;
      return iso[4] ? `${datePart} ${String(Number(iso[4])).padStart(2, "0")}:${iso[5]}` : datePart;
    }

    const monthDay = text.match(/(?:^|[\s·])(\d{1,2}[-/]\d{1,2}(?:\s+\d{1,2}:\d{2})?)(?:[\s·]|$)/);
    if (monthDay) {
      return monthDay[1].replace("/", "-");
    }

    const dayTime = text.match(/(今天|昨天|前天)\s*\d{1,2}:\d{2}/);
    if (dayTime) {
      return dayTime[0];
    }

    const relative = text.match(/(?:刚刚|\d+\s*(?:秒|分钟|小时|天)前)/);
    return relative?.[0] || "";
  }

  function uniqueElements(elements) {
    return Array.from(new Set(elements)).filter(Boolean);
  }
})();
