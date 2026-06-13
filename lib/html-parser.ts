export interface ParsedHtml {
  bodyClass: string;
  bodyStyle: string;
  bodyContent: string;
  headContent: string;
}

export function parseHtmlDocument(html: string): ParsedHtml {
  if (!html) {
    return { bodyClass: "", bodyStyle: "", bodyContent: "", headContent: "" };
  }

  // Clean markdown code blocks if present
  let cleanHtml = html.trim();
  cleanHtml = cleanHtml.replace(/^```html\s*/i, "");
  cleanHtml = cleanHtml.replace(/^```\s*/i, "");
  cleanHtml = cleanHtml.replace(/\s*```$/, "");
  const targetHtml = cleanHtml.trim();

  // Extract head content, supporting missing </head> during streaming
  const headRegex = /<head[^>]*>([\s\S]*?)(?:<\/head>|$)/i;
  const headMatch = targetHtml.match(headRegex);
  const headContent = headMatch ? headMatch[1] : "";

  // Extract body attributes and content, supporting missing </body> during streaming
  // We want to match everything after <body...> up to </body> or end of string.
  // However, we need to be careful not to match the end of string if <body> hasn't started.
  const bodyStartRegex = /<body([^>]*)>([\s\S]*)$/i;
  const bodyStartMatch = targetHtml.match(bodyStartRegex);

  if (bodyStartMatch) {
    const bodyAttrs = bodyStartMatch[1];
    let bodyContent = bodyStartMatch[2];

    // If </body> is present, trim anything after it
    const bodyCloseIndex = bodyContent.indexOf("</body>");
    if (bodyCloseIndex !== -1) {
      bodyContent = bodyContent.substring(0, bodyCloseIndex);
    }

    // Extract class
    const classMatch = bodyAttrs.match(/class=["']([^"']*)["']/i);
    const bodyClass = classMatch ? classMatch[1] : "";

    // Extract style
    const styleMatch = bodyAttrs.match(/style=["']([^"']*)["']/i);
    const bodyStyle = styleMatch ? styleMatch[1] : "";

    return {
      bodyClass,
      bodyStyle,
      bodyContent,
      headContent,
    };
  }

  // Fallback: if no body is found, treat the whole HTML as body content
  return {
    bodyClass: "",
    bodyStyle: "",
    bodyContent: targetHtml,
    headContent: "",
  };
}

export function cleanBodyClass(bodyClass: string): string {
  return bodyClass
    .replace(/\bmin-h-screen\b/g, "")
    .replace(/\bh-screen\b/g, "")
    .replace(/\bmin-h-\[[^\]]+\]/g, "")
    .replace(/\bh-\[[^\]]+\]/g, "")
    .trim();
}
