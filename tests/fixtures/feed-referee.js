// Reduced, anonymized structure from an operator-supplied X Home snapshot.
// No account state, scripts, images, real post text, or real identifiers.
export function tweet({ id = "10000", text = "Synthetic post for extension behavior checks.", quote = false, quoteOnly = false, more = false } = {}) {
  const header = (quoted = false) => `<div data-testid="User-Name" class="row shrink header">
    <div class="row shrink"><div class="shrink"><a href="/example" class="shrink"><div class="row shrink"><span class="ellipsis name">Example writer with a long name</span><span class="verified">✓</span></div></a></div></div>
    <div class="row shrink handle-group"><div class="row shrink"><div class="shrink"><a href="/example" tabindex="-1" class="shrink"><span class="ellipsis handle">@example_handle</span></a></div><span class="dot" aria-hidden="true">·</span><div class="row"><a href="/example/status/${quoted ? "99999" : id}"><time datetime="2026-01-01">3h</time></a></div></div></div>
  </div>`;
  return `<article data-testid="tweet" tabindex="0" class="row tweet"><div class="contents">
    <div class="row"><div class="avatar"></div><div class="body shrink">
      <div class="row top"><div class="row shrink"><div class="shrink">${header()}</div></div><div class="row actions"><button aria-label="Grok actions">G</button><button data-testid="caret" aria-label="More">···</button></div></div>
      ${quoteOnly ? "" : `<div><div data-testid="tweetText">${text}</div>${more ? '<button data-testid="tweet-text-show-more-link">Show more</button>' : ""}</div>`}
      ${quote || quoteOnly ? `<div class="quote"><div role="link" tabindex="0">${header(true)}<div><div data-testid="tweetText">Synthetic quoted words, not the author’s own assertion.</div></div></div></div>` : ""}
      <div class="row footer"><button data-testid="reply">Reply</button><button data-testid="like">Like</button></div>
    </div></div></div></article>`;
}
export function fixture(posts = tweet({ quote: true })) {
  return `<!doctype html><html><head><style>
    *{box-sizing:border-box}body{margin:0;background:#000;color:#e7e9ea;font:15px/20px Arial,sans-serif}main{width:600px;max-width:100%;margin:auto}
    div{display:flex;flex-direction:column;min-width:0;flex-shrink:0}a{color:inherit;text-decoration:none;display:flex}button{background:transparent;color:inherit;border:0;cursor:pointer}
    .row{flex-direction:row;display:flex;align-items:center}.shrink{min-width:0;flex-shrink:1}.header{align-items:center}.handle-group{margin-left:4px}.handle,time,.dot{color:#71767b}.name{font-weight:700}.verified{flex-shrink:0;padding-left:4px;color:#1d9bf0}.ellipsis{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}.dot{padding:0 4px}.tweet{padding:12px 16px;border-bottom:1px solid #2f3336;overflow:hidden;align-items:stretch}.contents{flex:1;min-width:0}.avatar{width:40px;height:40px;margin-right:8px;align-self:flex-start;background:#333;border-radius:50%}.body{flex:1}.top{justify-content:space-between;align-items:flex-start;margin-bottom:4px}.actions{flex-shrink:0}.actions button{width:24px;height:24px;padding:0}.quote{border:1px solid #333;border-radius:12px;padding:10px;margin-top:10px}.footer{justify-content:space-between;margin-top:14px}[data-testid=tweetText]{white-space:pre-wrap}
  </style></head><body><main data-testid="primaryColumn">${posts}</main></body></html>`;
}
