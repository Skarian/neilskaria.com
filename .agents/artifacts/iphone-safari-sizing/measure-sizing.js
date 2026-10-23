// Read-only expression for real Safari DOM inspection if supported. NOT EXECUTED.
(() => {
  const selectors = ['html', 'body', '.room-layer', '.loading', '.start button', '.corner', '.pill', '.panel', '.panel h2', '.ribbon', '.hint', '.actions', '.back', '.alone', '.crt-content', '#boot-page', '#boot-page h1'];
  return {
    timestamp: new Date().toISOString(), url: location.href, userAgent: navigator.userAgent,
    viewportMeta: document.querySelector('meta[name="viewport"]')?.content,
    textScaleMeta: document.querySelector('meta[name="text-scale"]')?.content,
    inner: { width: innerWidth, height: innerHeight },
    screen: { width: screen.width, height: screen.height }, devicePixelRatio,
    visualViewport: visualViewport && { width: visualViewport.width, height: visualViewport.height, scale: visualViewport.scale, offsetTop: visualViewport.offsetTop },
    document: { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth },
    desktopZoomMatches: matchMedia('(min-width: 1200px) and (min-height: 700px)').matches,
    mobilePanelMatches: matchMedia('(max-width: 640px), (max-aspect-ratio: 1/1)').matches,
    intro: document.documentElement.dataset.intro ?? null,
    elements: selectors.flatMap(selector => [...document.querySelectorAll(selector)].map(node => {
      const s = getComputedStyle(node), r = node.getBoundingClientRect();
      return { selector, text: node.textContent?.trim().slice(0, 120), rect: { x: r.x, y: r.y, width: r.width, height: r.height }, fontSize: s.fontSize, lineHeight: s.lineHeight, fontFamily: s.fontFamily, textSizeAdjust: s.getPropertyValue('-webkit-text-size-adjust') || s.getPropertyValue('text-size-adjust'), zoom: s.getPropertyValue('zoom'), transform: s.transform, display: s.display, width: s.width, maxWidth: s.maxWidth };
    }))
  };
})()
