import OpenAI from "openai";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "text/plain" },
      body: "Method Not Allowed",
    };
  }

  try {
    const { tab, keyword, max, maxChars } = JSON.parse(event.body || "{}");

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const n = Math.min(Number(max || 3), 3);

    const kind =
      tab === "kerze" ? "Gedenkkerze" :
      tab === "kondolenzbuch" ? "Kondolenzbuch-Eintrag" :
      "persönliche Worte";

    const limitLine =
      tab === "kerze"
        ? `Jeder Vorschlag MUSS maximal ${Number(maxChars || 120)} Zeichen (inkl. Leerzeichen) haben.`
        : `Würdevoll, warm, nicht kitschig, neutral formuliert (keine Religion erzwingen).`;

    const response = await client.responses.create({
      model: "gpt-5",
      instructions:
`Du schreibst würdige, einfühlsame Trauertexte auf Deutsch (Österreich passt).
Gib GENAU ${n} Vorschläge als JSON zurück.
Keine Emojis. Keine Nummerierung im Text.
${limitLine}

Antwortformat (nur JSON):
{ "texts": ["...", "...", "..."] }`,
      input:
`Erstelle ${n} Vorschläge für: ${kind}.
Name/Stichwort: "${(keyword || "").trim() || "—"}"`
    });

    const out = response.output_text || "";
    let parsed;
    try { parsed = JSON.parse(out); }
    catch { parsed = { texts: [out].filter(Boolean) }; }

    const texts = Array.isArray(parsed.texts) ? parsed.texts.slice(0, 3) : [];

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Server error", details: String(err?.message || err) }),
    };
  }
};
