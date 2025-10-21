// Zodiac calculation utilities
const zodiacSigns = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

const zodiacSymbols = {
  Aries: "♈",
  Taurus: "♉",
  Gemini: "♊",
  Cancer: "♋",
  Leo: "♌",
  Virgo: "♍",
  Libra: "♎",
  Scorpio: "♏",
  Sagittarius: "♐",
  Capricorn: "♑",
  Aquarius: "♒",
  Pisces: "♓",
};

// Simplified zodiac date ranges (tropical zodiac)
const zodiacDateRanges = [
  {
    sign: "Capricorn",
    start: { month: 12, day: 22 },
    end: { month: 1, day: 19 },
  },
  {
    sign: "Aquarius",
    start: { month: 1, day: 20 },
    end: { month: 2, day: 18 },
  },
  { sign: "Pisces", start: { month: 2, day: 19 }, end: { month: 3, day: 20 } },
  { sign: "Aries", start: { month: 3, day: 21 }, end: { month: 4, day: 19 } },
  { sign: "Taurus", start: { month: 4, day: 20 }, end: { month: 5, day: 20 } },
  { sign: "Gemini", start: { month: 5, day: 21 }, end: { month: 6, day: 20 } },
  { sign: "Cancer", start: { month: 6, day: 21 }, end: { month: 7, day: 22 } },
  { sign: "Leo", start: { month: 7, day: 23 }, end: { month: 8, day: 22 } },
  { sign: "Virgo", start: { month: 8, day: 23 }, end: { month: 9, day: 22 } },
  { sign: "Libra", start: { month: 9, day: 23 }, end: { month: 10, day: 22 } },
  {
    sign: "Scorpio",
    start: { month: 10, day: 23 },
    end: { month: 11, day: 21 },
  },
  {
    sign: "Sagittarius",
    start: { month: 11, day: 22 },
    end: { month: 12, day: 21 },
  },
];

export const calculateSunSign = (birthDate) => {
  const date = new Date(birthDate);
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  const day = date.getDate();

  for (const zodiac of zodiacDateRanges) {
    const { sign, start, end } = zodiac;

    // Handle signs that cross year boundary (like Capricorn)
    if (start.month > end.month) {
      if (
        (month === start.month && day >= start.day) ||
        (month === end.month && day <= end.day)
      ) {
        return sign;
      }
    } else {
      if (
        (month === start.month && day >= start.day) ||
        (month === end.month && day <= end.day) ||
        (month > start.month && month < end.month)
      ) {
        return sign;
      }
    }
  }

  return "Capricorn"; // Default fallback
};

// Simplified moon sign calculation (normally requires ephemeris data)
// This is a basic approximation - real calculations would need astronomical data
export const calculateMoonSign = (birthDate, birthTime) => {
  const date = new Date(`${birthDate}T${birthTime}`);
  const dayOfYear = Math.floor(
    (date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
  );

  // Moon moves through all 12 signs roughly every 28 days
  // This is a simplified calculation for demonstration
  const moonCycle = (dayOfYear + date.getHours()) % 28;
  const signIndex = Math.floor((moonCycle / 28) * 12);

  return zodiacSigns[signIndex];
};

// Simplified rising sign calculation (normally requires exact time and location)
// This is a basic approximation - real calculations would need precise coordinates and time
export const calculateRisingSign = (birthDate, birthTime, birthLocation) => {
  const date = new Date(`${birthDate}T${birthTime}`);
  const hour = date.getHours();

  // Rising sign changes approximately every 2 hours
  // This is a simplified calculation for demonstration
  const risingIndex = Math.floor(hour / 2) % 12;

  // Add some variation based on location (very simplified)
  const locationHash = birthLocation
    .split("")
    .reduce((a, b) => a + b.charCodeAt(0), 0);
  const adjustedIndex = (risingIndex + (locationHash % 3)) % 12;

  return zodiacSigns[adjustedIndex];
};

export const calculateFullChart = (birthDate, birthTime, birthLocation) => {
  const sunSign = calculateSunSign(birthDate);
  const moonSign = calculateMoonSign(birthDate, birthTime);
  const risingSign = calculateRisingSign(birthDate, birthTime, birthLocation);

  return {
    sun: sunSign,
    moon: moonSign,
    rising: risingSign,
    birthInfo: {
      date: birthDate,
      time: birthTime,
      location: birthLocation,
    },
  };
};

export const getZodiacDescription = (sign, placement) => {
  const descriptions = {
    sun: {
      Aries:
        "Bold, energetic, and pioneering. You lead with confidence and passion.",
      Taurus:
        "Steady, reliable, and sensual. You value security and beautiful things.",
      Gemini:
        "Curious, adaptable, and communicative. You thrive on variety and learning.",
      Cancer:
        "Nurturing, intuitive, and emotional. You care deeply about home and family.",
      Leo: "Creative, confident, and generous. You love to shine and inspire others.",
      Virgo:
        "Practical, analytical, and helpful. You strive for perfection and service.",
      Libra:
        "Harmonious, diplomatic, and artistic. You seek balance and beauty.",
      Scorpio:
        "Intense, mysterious, and transformative. You dive deep into life's mysteries.",
      Sagittarius:
        "Adventurous, philosophical, and optimistic. You seek truth and freedom.",
      Capricorn:
        "Ambitious, disciplined, and responsible. You build lasting achievements.",
      Aquarius:
        "Independent, innovative, and humanitarian. You think outside the box.",
      Pisces:
        "Intuitive, compassionate, and dreamy. You connect with the mystical.",
    },
    moon: {
      Aries:
        "Your emotions are fiery and immediate. You react quickly and passionately.",
      Taurus:
        "Your emotional nature seeks comfort and stability. You need security to feel at peace.",
      Gemini:
        "Your feelings are changeable and curious. You process emotions through communication.",
      Cancer:
        "Your emotional world is deep and nurturing. You feel everything intensely.",
      Leo: "Your emotions are dramatic and warm. You need appreciation and creative expression.",
      Virgo:
        "Your feelings are practical and analytical. You organize your emotional world.",
      Libra:
        "Your emotions seek harmony and partnership. You need balance in relationships.",
      Scorpio:
        "Your emotional nature is intense and transformative. You feel deeply and powerfully.",
      Sagittarius:
        "Your emotions are optimistic and freedom-loving. You need space to explore.",
      Capricorn:
        "Your emotional nature is reserved and goal-oriented. You seek emotional security through achievement.",
      Aquarius:
        "Your feelings are unique and detached. You need emotional freedom and friendship.",
      Pisces:
        "Your emotions are intuitive and compassionate. You absorb the feelings around you.",
    },
    rising: {
      Aries:
        "You appear confident, energetic, and ready for action. Others see you as a natural leader.",
      Taurus:
        "You appear calm, steady, and reliable. Others see you as grounded and trustworthy.",
      Gemini:
        "You appear curious, talkative, and adaptable. Others see you as intelligent and witty.",
      Cancer:
        "You appear nurturing, protective, and intuitive. Others see you as caring and emotional.",
      Leo: "You appear confident, charismatic, and dramatic. Others see you as warm and creative.",
      Virgo:
        "You appear organized, helpful, and analytical. Others see you as practical and reliable.",
      Libra:
        "You appear charming, diplomatic, and harmonious. Others see you as balanced and fair.",
      Scorpio:
        "You appear intense, mysterious, and powerful. Others see you as magnetic and deep.",
      Sagittarius:
        "You appear optimistic, adventurous, and philosophical. Others see you as free-spirited.",
      Capricorn:
        "You appear serious, responsible, and ambitious. Others see you as mature and capable.",
      Aquarius:
        "You appear unique, independent, and innovative. Others see you as progressive and friendly.",
      Pisces:
        "You appear gentle, intuitive, and dreamy. Others see you as compassionate and artistic.",
    },
  };

  return (
    descriptions[placement]?.[sign] ||
    "A unique cosmic influence shapes this aspect of your personality."
  );
};

export { zodiacSigns, zodiacSymbols };
