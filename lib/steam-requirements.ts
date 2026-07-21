function cleanHtmlToSpecs(html: string): string {
  if (!html) return "";
  
  // Replace line breaks and list items with newline bullet points
  let text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<strong>/gi, "")
    .replace(/<\/strong>/gi, "")
    .replace(/<b>/gi, "")
    .replace(/<\/b>/gi, "")
    .replace(/<p>/gi, "")
    .replace(/<\/p>/gi, "\n")
    .replace(/<ul[^>]*>/gi, "")
    .replace(/<\/ul>/gi, "")
    .replace(/<div[^>]*>/gi, "")
    .replace(/<\/div>/gi, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Remove "Minimum:" or "Recommended:" headers if present inside HTML content
  text = text.replace(/^Minimum:\s*/i, "").replace(/^Recommended:\s*/i, "");

  // Clean up lines
  const rawLines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !/^minimum:?$/i.test(line) && !/^recommended:?$/i.test(line));

  const processedLines: string[] = [];

  for (const line of rawLines) {
    const cleanLine = line.startsWith("•") ? line : `• ${line}`;
    const lower = cleanLine.toLowerCase();

    // Skip heavy legal disclaimers / launcher requirements text
    if (
      lower.includes("over time downloadable content") ||
      lower.includes("log-in to rockstar") ||
      lower.includes("software installations required") ||
      lower.includes("periodic entitlement verification")
    ) {
      if (lower.includes("ssd required")) {
        processedLines.push("• Additional Notes: SSD Required");
      }
      continue;
    }

    // If it's an "Additional Notes:" line with legal text, extract just the main note
    if (lower.includes("additional notes")) {
      const parts = cleanLine.split(/[\.\|]/);
      const shortNote = parts[0].trim();
      if (shortNote.length > 5) {
        processedLines.push(shortNote);
      }
    } else if (cleanLine.length <= 150) {
      processedLines.push(cleanLine);
    } else {
      // Truncate excessively long single lines
      processedLines.push(cleanLine.substring(0, 130) + "...");
    }
  }

  return processedLines.join("\n");
}

export async function fetchOfficialSteamRequirements(gameTitle: string): Promise<{ minimum: string; recommended: string } | null> {
  try {
    const query = gameTitle
      .replace(/[\(\)\[\]]/g, "")
      .replace(/offline|online|steam|epic|edition|activation/gi, "")
      .trim();

    if (!query) return null;

    const searchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`;
    const searchRes = await fetch(searchUrl, { next: { revalidate: 86400 } });
    if (!searchRes.ok) return null;

    const searchData = (await searchRes.json()) as { items?: Array<{ id: number; name: string }> };
    if (!searchData.items || searchData.items.length === 0) return null;

    const appId = searchData.items[0].id;
    const detailsUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`;
    const detailsRes = await fetch(detailsUrl, { next: { revalidate: 86400 } });
    if (!detailsRes.ok) return null;

    const detailsData = (await detailsRes.json()) as Record<string, { success?: boolean; data?: { pc_requirements?: { minimum?: string; recommended?: string } } }>;
    const appInfo = detailsData[String(appId)];
    
    if (!appInfo || !appInfo.success || !appInfo.data || !appInfo.data.pc_requirements) {
      return null;
    }

    const reqs = appInfo.data.pc_requirements;
    const minClean = cleanHtmlToSpecs(reqs.minimum || "");
    const recClean = cleanHtmlToSpecs(reqs.recommended || "");

    if (!minClean && !recClean) return null;

    return {
      minimum: minClean || "• OS: Windows 10 64-bit\n• Storage: Available space required",
      recommended: recClean || minClean || "• OS: Windows 10/11 64-bit\n• Storage: Available space required",
    };
  } catch (error) {
    console.error("Failed to fetch official Steam requirements for", gameTitle, error);
    return null;
  }
}
