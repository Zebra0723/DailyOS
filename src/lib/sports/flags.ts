// Country name -> emoji flag, for turning a live API's team names into the
// flag-vs-flag scoreline. Works by mapping a name to its ISO-3166 alpha-2 code
// and converting that to regional-indicator emoji; the home nations use their
// special tag-sequence flags. Unknown names fall back to a white flag.

function iso2ToFlag(cc: string): string {
  return cc
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

// Home nations don't have alpha-2 flags — use the emoji tag sequences.
const SPECIAL: Record<string, string> = {
  england: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  "northern ireland": "🇬🇧",
};

// Footballing-nation name -> alpha-2. Aliases included for how feeds name them.
const CODES: Record<string, string> = {
  argentina: "ar", australia: "au", austria: "at", belgium: "be",
  brazil: "br", cameroon: "cm", canada: "ca", chile: "cl", china: "cn",
  colombia: "co", "costa rica": "cr", croatia: "hr", "czech republic": "cz",
  czechia: "cz", denmark: "dk", ecuador: "ec", egypt: "eg", finland: "fi",
  france: "fr", germany: "de", ghana: "gh", greece: "gr", hungary: "hu",
  iceland: "is", india: "in", indonesia: "id", iran: "ir", "ir iran": "ir",
  iraq: "iq", ireland: "ie", "republic of ireland": "ie", israel: "il",
  italy: "it", "ivory coast": "ci", "côte d'ivoire": "ci", "cote d'ivoire": "ci",
  jamaica: "jm", japan: "jp", jordan: "jo", kenya: "ke", "south korea": "kr",
  "korea republic": "kr", "north korea": "kp", "korea dpr": "kp", mexico: "mx",
  morocco: "ma", netherlands: "nl", "new zealand": "nz", nigeria: "ng",
  norway: "no", panama: "pa", paraguay: "py", peru: "pe", palestine: "ps",
  poland: "pl", portugal: "pt", qatar: "qa", romania: "ro", russia: "ru",
  "saudi arabia": "sa", senegal: "sn", serbia: "rs", slovakia: "sk",
  slovenia: "si", "south africa": "za", spain: "es", sweden: "se",
  switzerland: "ch", tunisia: "tn", turkey: "tr", "türkiye": "tr", turkiye: "tr",
  uganda: "ug", ukraine: "ua", "united states": "us", usa: "us", uruguay: "uy",
  venezuela: "ve", wales: "gb", fiji: "fj", zambia: "zm", zimbabwe: "zw",
};

/** Emoji flag for a country name (case/accents/aliases tolerant), or 🏳️. */
export function countryFlag(name: string): string {
  const key = (name || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // strip combining accents
  if (SPECIAL[key]) return SPECIAL[key];
  const cc = CODES[key];
  return cc ? iso2ToFlag(cc) : "🏳️";
}
