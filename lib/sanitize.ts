import sanitizeHtml from 'sanitize-html';

export function cleanHtml(html: string) {
  return sanitizeHtml(html || '', {
    allowedTags: ['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'u', 'a', 'blockquote',
      'img', 'figure', 'figcaption', 'br', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'iframe'],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      p: ['class'],
      iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder', 'loading'],
    },
    allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com', 'www.tiktok.com', 'www.facebook.com'],
    transformTags: {
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy' } }),
      a: (tagName, attribs) => {
        const external = /^https?:\/\//.test(attribs.href || '') && !(attribs.href || '').includes(process.env.NEXT_PUBLIC_SITE_URL || '###');
        return { tagName, attribs: external ? { ...attribs, target: '_blank', rel: 'nofollow noopener' } : attribs };
      },
    },
  });
}
