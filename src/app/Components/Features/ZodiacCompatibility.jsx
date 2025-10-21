import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "../../hooks/useSocket";

const signs = [
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

// Zodiac symbols mapping
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

// Comprehensive compatibility scoring system (0-100)
const compatibilityScores = {
  Aries: {
    Taurus: 45,
    Gemini: 85,
    Cancer: 35,
    Leo: 95,
    Virgo: 55,
    Libra: 75,
    Scorpio: 80,
    Sagittarius: 90,
    Capricorn: 50,
    Aquarius: 70,
    Pisces: 40,
  },
  Taurus: {
    Aries: 45,
    Gemini: 50,
    Cancer: 85,
    Leo: 35,
    Virgo: 90,
    Libra: 75,
    Scorpio: 80,
    Sagittarius: 30,
    Capricorn: 95,
    Aquarius: 25,
    Pisces: 85,
  },
  Gemini: {
    Aries: 85,
    Taurus: 50,
    Cancer: 45,
    Leo: 75,
    Virgo: 40,
    Libra: 95,
    Scorpio: 35,
    Sagittarius: 85,
    Capricorn: 55,
    Aquarius: 90,
    Pisces: 45,
  },
  Cancer: {
    Aries: 35,
    Taurus: 85,
    Gemini: 45,
    Leo: 65,
    Virgo: 80,
    Libra: 55,
    Scorpio: 95,
    Sagittarius: 30,
    Capricorn: 75,
    Aquarius: 40,
    Pisces: 90,
  },
  Leo: {
    Aries: 95,
    Taurus: 35,
    Gemini: 75,
    Cancer: 65,
    Virgo: 45,
    Libra: 85,
    Scorpio: 50,
    Sagittarius: 90,
    Capricorn: 40,
    Aquarius: 70,
    Pisces: 55,
  },
  Virgo: {
    Aries: 55,
    Taurus: 90,
    Gemini: 40,
    Cancer: 80,
    Leo: 45,
    Libra: 60,
    Scorpio: 85,
    Sagittarius: 35,
    Capricorn: 95,
    Aquarius: 50,
    Pisces: 75,
  },
  Libra: {
    Aries: 75,
    Taurus: 75,
    Gemini: 95,
    Cancer: 55,
    Leo: 85,
    Virgo: 60,
    Scorpio: 65,
    Sagittarius: 80,
    Capricorn: 45,
    Aquarius: 90,
    Pisces: 70,
  },
  Scorpio: {
    Aries: 80,
    Taurus: 80,
    Gemini: 35,
    Cancer: 95,
    Leo: 50,
    Virgo: 85,
    Libra: 65,
    Sagittarius: 60,
    Capricorn: 75,
    Aquarius: 45,
    Pisces: 90,
  },
  Sagittarius: {
    Aries: 90,
    Taurus: 30,
    Gemini: 85,
    Cancer: 30,
    Leo: 90,
    Virgo: 35,
    Libra: 80,
    Scorpio: 60,
    Capricorn: 55,
    Aquarius: 85,
    Pisces: 45,
  },
  Capricorn: {
    Aries: 50,
    Taurus: 95,
    Gemini: 55,
    Cancer: 75,
    Leo: 40,
    Virgo: 95,
    Libra: 45,
    Scorpio: 75,
    Sagittarius: 55,
    Aquarius: 60,
    Pisces: 80,
  },
  Aquarius: {
    Aries: 70,
    Taurus: 25,
    Gemini: 90,
    Cancer: 40,
    Leo: 70,
    Virgo: 50,
    Libra: 90,
    Scorpio: 45,
    Sagittarius: 85,
    Capricorn: 60,
    Pisces: 65,
  },
  Pisces: {
    Aries: 40,
    Taurus: 85,
    Gemini: 45,
    Cancer: 90,
    Leo: 55,
    Virgo: 75,
    Libra: 70,
    Scorpio: 90,
    Sagittarius: 45,
    Capricorn: 80,
    Aquarius: 65,
  },
};

// Helper function to categorize all signs based on compatibility scores
const categorizeCompatibility = (selectedSign) => {
  const scores = compatibilityScores[selectedSign];
  const allOtherSigns = signs.filter((sign) => sign !== selectedSign);

  const categorized = {
    best: [],
    good: [],
    bad: [],
  };

  allOtherSigns.forEach((sign) => {
    const score = scores[sign];
    if (score >= 85) {
      categorized.best.push(sign);
    } else if (score >= 65) {
      categorized.good.push(sign);
    } else {
      categorized.bad.push(sign);
    }
  });

  // Sort each category by score (highest first)
  categorized.best.sort((a, b) => scores[b] - scores[a]);
  categorized.good.sort((a, b) => scores[b] - scores[a]);
  categorized.bad.sort((a, b) => scores[b] - scores[a]);

  return categorized;
};

// Sample compatibility data - simplified for demo
const compatibilityData = {
  Aries: {
    best: ["Leo", "Sagittarius", "Gemini"],
    good: ["Aquarius", "Libra"],
    bad: ["Cancer", "Capricorn", "Pisces"],
  },
  Taurus: {
    best: ["Virgo", "Capricorn", "Cancer"],
    good: ["Pisces", "Scorpio"],
    bad: ["Leo", "Aquarius", "Sagittarius"],
  },
  Gemini: {
    best: ["Libra", "Aquarius", "Aries"],
    good: ["Leo", "Sagittarius"],
    bad: ["Virgo", "Pisces", "Scorpio"],
  },
  Cancer: {
    best: ["Scorpio", "Pisces", "Taurus"],
    good: ["Virgo", "Capricorn"],
    bad: ["Aries", "Libra", "Sagittarius"],
  },
  Leo: {
    best: ["Aries", "Sagittarius", "Gemini"],
    good: ["Libra", "Aquarius"],
    bad: ["Taurus", "Scorpio", "Capricorn"],
  },
  Virgo: {
    best: ["Taurus", "Capricorn", "Cancer"],
    good: ["Scorpio", "Pisces"],
    bad: ["Sagittarius", "Gemini", "Aries"],
  },
  Libra: {
    best: ["Gemini", "Aquarius", "Leo"],
    good: ["Aries", "Sagittarius"],
    bad: ["Cancer", "Capricorn", "Virgo"],
  },
  Scorpio: {
    best: ["Cancer", "Pisces", "Virgo"],
    good: ["Taurus", "Capricorn"],
    bad: ["Leo", "Aquarius", "Gemini"],
  },
  Sagittarius: {
    best: ["Aries", "Leo", "Libra"],
    good: ["Gemini", "Aquarius"],
    bad: ["Virgo", "Pisces", "Cancer"],
  },
  Capricorn: {
    best: ["Taurus", "Virgo", "Scorpio"],
    good: ["Cancer", "Pisces"],
    bad: ["Aries", "Libra", "Sagittarius"],
  },
  Aquarius: {
    best: ["Gemini", "Libra", "Sagittarius"],
    good: ["Aries", "Leo"],
    bad: ["Taurus", "Scorpio", "Cancer"],
  },
  Pisces: {
    best: ["Cancer", "Scorpio", "Taurus"],
    good: ["Virgo", "Capricorn"],
    bad: ["Gemini", "Sagittarius", "Leo"],
  },
};

// Female perspective compatibility data
const femaleCompatibilityData = {
  "Aquarius-Aquarius":
    "As an Aquarius woman, you'll find deep understanding with an Aquarius man who shares your need for intellectual freedom and independence. Your similar approaches to relationships - taking time to commit while maintaining your social circles - create a harmonious dynamic. You'll appreciate that he doesn't try to change your unique style or unconventional viewpoints.",
  "Aquarius-Aries":
    "As an Aquarius woman, you'll be drawn to the Aries man's confidence and directness. He won't play games with you, which you appreciate, and his passionate nature will intrigue your intellectual curiosity. You'll enjoy how he encourages you to be more decisive and take action on your ideas.",
  "Aquarius-Cancer":
    "As an Aquarius woman, you may find the Cancer man's emotional depth both fascinating and challenging. His nurturing nature can make you feel cared for in ways you didn't know you needed, but his desire for emotional security might clash with your need for independence.",
  "Aquarius-Capricorn":
    "As an Aquarius woman, you'll be intrigued by the Capricorn man's quiet confidence and ambitious nature. His traditional approach to relationships might feel restrictive at first, but you'll come to appreciate the security and stability he offers.",
  "Aquarius-Gemini":
    "As an Aquarius woman, you'll instantly connect with a Gemini man's intellectual curiosity and wit. He matches your need for mental stimulation and freedom, creating a relationship built on friendship and shared interests.",
  "Aquarius-Leo":
    "As an Aquarius woman, you'll be captivated by the Leo man's confidence and dramatic flair. His warm, generous nature will draw you in, and you'll appreciate how he celebrates your uniqueness rather than trying to change you.",
  "Aquarius-Libra":
    "As an Aquarius woman, you'll find a kindred spirit in the Libra man who shares your love of ideas, social causes, and intellectual discussions. His diplomatic nature complements your sometimes blunt honesty.",
  "Aquarius-Pisces":
    "As an Aquarius woman, you'll be intrigued by the Pisces man's emotional depth and intuitive nature. His romantic, dreamy approach to life offers a beautiful contrast to your logical mindset.",
  "Aquarius-Sagittarius":
    "As an Aquarius woman, you'll find an ideal adventure partner in the Sagittarius man who shares your love of freedom and new experiences. His philosophical nature matches your intellectual curiosity.",
  "Aquarius-Scorpio":
    "As an Aquarius woman, you'll be both fascinated and challenged by the Scorpio man's intensity and depth. His mysterious nature will intrigue your curious mind, while his passionate approach to love contrasts sharply with your more detached style.",
  "Aquarius-Taurus":
    "As an Aquarius woman, you'll be drawn to the Taurus man's stability and reliability, finding comfort in his grounded nature. His sensual approach to love will help you connect with your physical side.",
  "Aquarius-Virgo":
    "As an Aquarius woman, you'll connect with the Virgo man's analytical mind and problem-solving abilities. His attention to detail can help ground your sometimes scattered ideas.",

  "Aries-Aries":
    "As an Aries woman, you'll find an equal match in an Aries man who understands your need for independence and adventure. The chemistry is explosive and immediate, with both of you bringing passion and energy to the relationship.",
  "Aries-Cancer":
    "As an Aries woman, you'll be drawn to the Cancer man's emotional depth and nurturing nature. His protective instincts will make you feel cherished, while his sensitivity provides a beautiful contrast to your fiery energy.",
  "Aries-Capricorn":
    "As an Aries woman, you'll respect the Capricorn man's ambition and determination. His steady, goal-oriented approach can help channel your energy into productive endeavors.",
  "Aries-Gemini":
    "As an Aries woman, you'll be captivated by the Gemini man's wit and intellectual agility. His playful nature matches your adventurous spirit, and you'll enjoy the variety and excitement he brings to your life.",
  "Aries-Leo":
    "As an Aries woman, you'll be magnetically drawn to the Leo man's confidence and charismatic presence. His generous nature and romantic gestures will sweep you off your feet.",
  "Aries-Libra":
    "As an Aries woman, you'll be fascinated by the Libra man's charm and diplomatic nature. His desire for harmony and balance will intrigue you, even as it sometimes frustrates your direct approach to conflict.",
  "Aries-Pisces":
    "As an Aries woman, you'll be touched by the Pisces man's sensitivity and intuitive understanding of your deeper emotions. His gentle, empathetic nature will help you access your softer side.",
  "Aries-Sagittarius":
    "As an Aries woman, you'll find a kindred spirit in the Sagittarius man's adventurous nature and love of freedom. His philosophical outlook and sense of humor will keep you intellectually stimulated.",
  "Aries-Scorpio":
    "As an Aries woman, you'll be both fascinated and challenged by the Scorpio man's mysterious depth and emotional intensity. His passionate nature matches your own fire.",
  "Aries-Taurus":
    "As an Aries woman, you'll appreciate the Taurus man's stability and sensual approach to love. His patience and reliability provide a grounding influence for your fiery energy.",
  "Aries-Virgo":
    "As an Aries woman, you'll be intrigued by the Virgo man's attention to detail and practical intelligence. His caring nature and desire to serve will make you feel cherished.",

  // Cancer female perspective
  "Cancer-Aquarius":
    "As a Cancer woman, you'll be intrigued by the Aquarius man's unique perspective and intellectual independence. His innovative thinking challenges your traditional views in fascinating ways, though his emotional detachment may sometimes leave you feeling unsure.",
  "Cancer-Aries":
    "As a Cancer woman, you'll be drawn to the Aries man's protective strength and passionate nature. His confidence and direct approach make you feel secure, while his energy brings excitement to your nurturing world.",
  "Cancer-Cancer":
    "As a Cancer woman, you'll find deep emotional understanding with a Cancer man who shares your intuitive nature and need for security. Your similar approaches to love and family create a harmonious, nurturing relationship.",
  "Cancer-Capricorn":
    "As a Cancer woman, you'll be attracted to the Capricorn man's stability and ambition. His traditional values align with your desire for security, and his steady presence makes you feel protected and cherished.",
  "Cancer-Gemini":
    "As a Cancer woman, you'll be fascinated by the Gemini man's wit and intellectual curiosity. His playful nature brings lightness to your sometimes serious disposition, though his changeable nature may challenge your need for emotional consistency.",
  "Cancer-Leo":
    "As a Cancer woman, you'll be captivated by the Leo man's warmth and generous spirit. His protective nature and dramatic expressions of love make you feel like royalty, and you'll appreciate his loyalty and devotion.",
  "Cancer-Libra":
    "As a Cancer woman, you'll be charmed by the Libra man's romantic nature and desire for harmony. His diplomatic approach to conflict appeals to your peace-loving nature, and his appreciation for beauty enhances your domestic world.",
  "Cancer-Pisces":
    "As a Cancer woman, you'll find a soulmate in the Pisces man who understands your emotional depth and intuitive nature. His compassionate heart and romantic spirit create a dreamy, nurturing relationship filled with mutual understanding.",
  "Cancer-Sagittarius":
    "As a Cancer woman, you'll be both excited and challenged by the Sagittarius man's adventurous spirit. His optimistic outlook and love of exploration can help you break out of your comfort zone, though his need for freedom may sometimes clash with your desire for closeness.",
  "Cancer-Scorpio":
    "As a Cancer woman, you'll be deeply drawn to the Scorpio man's emotional intensity and mysterious nature. His passionate approach to love matches your own emotional depth, creating a profound and transformative connection.",
  "Cancer-Taurus":
    "As a Cancer woman, you'll feel completely at home with the Taurus man's steady, reliable nature. His appreciation for comfort and tradition aligns perfectly with your nurturing instincts, creating a stable and loving partnership.",
  "Cancer-Virgo":
    "As a Cancer woman, you'll appreciate the Virgo man's caring attention to detail and desire to serve. His practical approach to love and life provides the security you crave, while his analytical mind helps organize your emotional world.",

  // Gemini female perspective
  "Gemini-Aquarius":
    "As a Gemini woman, you'll find an ideal intellectual companion in the Aquarius man who matches your curiosity and love of ideas. His innovative thinking and social consciousness fascinate you, while his respect for independence appeals to your free spirit.",
  "Gemini-Aries":
    "As a Gemini woman, you'll be energized by the Aries man's bold confidence and adventurous spirit. His direct approach to life and love cuts through your sometimes scattered thoughts, providing the decisive action you admire.",
  "Gemini-Cancer":
    "As a Gemini woman, you'll be touched by the Cancer man's emotional depth and nurturing nature. His intuitive understanding of your moods helps ground your sometimes scattered energy, though his need for emotional security may feel restricting at times.",
  "Gemini-Capricorn":
    "As a Gemini woman, you'll be impressed by the Capricorn man's ambition and self-discipline. His steady approach to goals can help focus your versatile energy, though his serious nature may sometimes clash with your playful spirit.",
  "Gemini-Gemini":
    "As a Gemini woman, you'll find endless fascination with a Gemini man who mirrors your quick wit and intellectual curiosity. Your conversations will be stimulating and varied, though you may both struggle with commitment and consistency.",
  "Gemini-Leo":
    "As a Gemini woman, you'll be dazzled by the Leo man's confident charisma and dramatic flair. His warmth and generosity draw you in, while your wit and charm perfectly complement his need for an engaging audience.",
  "Gemini-Libra":
    "As a Gemini woman, you'll find perfect mental harmony with the Libra man who shares your love of communication and ideas. His diplomatic nature balances your sometimes sharp wit, creating elegant conversations and social connections.",
  "Gemini-Pisces":
    "As a Gemini woman, you'll be intrigued by the Pisces man's dreamy, intuitive nature. His emotional depth and artistic sensitivity offer a beautiful contrast to your logical approach, though his moodiness may sometimes confuse your rational mind.",
  "Gemini-Sagittarius":
    "As a Gemini woman, you'll find your perfect opposite in the Sagittarius man who shares your love of learning and exploration. His philosophical depth matches your intellectual curiosity, while his adventurous spirit inspires your own wanderlust.",
  "Gemini-Scorpio":
    "As a Gemini woman, you'll be both fascinated and challenged by the Scorpio man's intense emotional depth. His mysterious nature intrigues your curious mind, though his need for emotional intensity may feel overwhelming to your lighter approach.",
  "Gemini-Taurus":
    "As a Gemini woman, you'll appreciate the Taurus man's steady, grounding presence. His reliability provides security for your changeable nature, though his resistance to change may sometimes frustrate your need for variety and stimulation.",
  "Gemini-Virgo":
    "As a Gemini woman, you'll connect with the Virgo man's sharp intellect and analytical mind. His attention to detail complements your broad perspective, though his critical nature may sometimes dampen your optimistic enthusiasm.",

  // Leo female perspective
  "Leo-Aquarius":
    "As a Leo woman, you'll be both attracted to and challenged by the Aquarius man's unique independence and unconventional thinking. His intellectual approach to life fascinates you, though his emotional detachment may sometimes leave you craving more warmth and attention.",
  "Leo-Aries":
    "As a Leo woman, you'll be magnetically drawn to the Aries man's confidence and pioneering spirit. His bold energy matches your own dramatic flair, creating a passionate and dynamic relationship filled with adventure and mutual admiration.",
  "Leo-Cancer":
    "As a Leo woman, you'll be touched by the Cancer man's gentle, nurturing nature. His devotion and emotional depth appeal to your generous heart, while his protective instincts make you feel cherished and adored.",
  "Leo-Capricorn":
    "As a Leo woman, you'll respect the Capricorn man's ambition and success-oriented nature. His determination and status appeal to your desire for the finest things in life, though his reserved nature may require patience to draw out his affection.",
  "Leo-Gemini":
    "As a Leo woman, you'll be delighted by the Gemini man's wit and intellectual versatility. His ability to keep you entertained with stimulating conversation and varied interests perfectly complements your need for an engaging and admiring audience.",
  "Leo-Leo":
    "As a Leo woman, you'll find both intense attraction and dramatic conflict with a Leo man who mirrors your own passionate, theatrical nature. When you're in sync, the relationship is magnificent, but you may clash over who gets the spotlight.",
  "Leo-Libra":
    "As a Leo woman, you'll be charmed by the Libra man's refined taste and romantic nature. His appreciation for beauty and harmony complements your own dramatic style, while his diplomatic skills help smooth over any conflicts with grace.",
  "Leo-Pisces":
    "As a Leo woman, you'll be moved by the Pisces man's romantic, dreamy nature. His emotional sensitivity and artistic soul appeal to your creative side, while his willingness to adore you satisfies your need for appreciation and devotion.",
  "Leo-Sagittarius":
    "As a Leo woman, you'll find an ideal companion in the Sagittarius man who shares your love of adventure and grand gestures. His optimistic spirit and philosophical nature match your own dramatic enthusiasm for life's possibilities.",
  "Leo-Scorpio":
    "As a Leo woman, you'll be both attracted to and challenged by the Scorpio man's intense, magnetic presence. His passionate nature matches your own fire, but his tendency toward jealousy and possessiveness may clash with your need for admiration from others.",
  "Leo-Taurus":
    "As a Leo woman, you'll appreciate the Taurus man's steady devotion and appreciation for luxury. His reliable nature provides security, while his sensual approach to love and life appeals to your desire for comfort and pleasure.",
  "Leo-Virgo":
    "As a Leo woman, you'll be intrigued by the Virgo man's quiet intelligence and desire to serve. His attention to detail and caring nature make you feel special, though his critical tendencies may sometimes hurt your sensitive pride.",

  // Libra female perspective
  "Libra-Aquarius":
    "As a Libra woman, you'll find an ideal intellectual partnership with the Aquarius man who shares your love of ideas and social justice. His innovative thinking inspires your own diplomatic solutions, while his respect for independence appeals to your balanced nature.",
  "Libra-Aries":
    "As a Libra woman, you'll be both attracted to and challenged by the Aries man's direct, passionate approach. His confidence and decisiveness help you overcome your tendency to hesitate, though his blunt manner may sometimes clash with your diplomatic nature.",
  "Libra-Cancer":
    "As a Libra woman, you'll be touched by the Cancer man's gentle, caring nature. His emotional sensitivity appeals to your desire for harmony, while his nurturing instincts create the peaceful, loving environment you crave.",
  "Libra-Capricorn":
    "As a Libra woman, you'll admire the Capricorn man's ambition and sophisticated approach to life. His success and status appeal to your appreciation for quality and refinement, while his steady nature provides the security you value.",
  "Libra-Gemini":
    "As a Libra woman, you'll find perfect mental compatibility with the Gemini man who shares your love of communication and social connection. His wit and versatility keep you engaged, while your diplomatic skills help balance his sometimes scattered energy.",
  "Libra-Leo":
    "As a Libra woman, you'll be dazzled by the Leo man's confident charisma and generous spirit. His dramatic flair and appreciation for beauty match your own refined tastes, while his warmth and loyalty satisfy your need for devoted partnership.",
  "Libra-Libra":
    "As a Libra woman, you'll find perfect harmony with a Libra man who shares your love of beauty, balance, and peaceful relationships. Your mutual appreciation for romance and refinement creates an elegant partnership, though you may both struggle with decision-making.",
  "Libra-Pisces":
    "As a Libra woman, you'll be enchanted by the Pisces man's romantic, artistic nature. His emotional depth and compassionate heart appeal to your desire for meaningful connection, while his dreamy sensitivity complements your aesthetic appreciation.",
  "Libra-Sagittarius":
    "As a Libra woman, you'll be inspired by the Sagittarius man's optimistic philosophy and love of exploration. His broad perspective on life expands your own worldview, while his adventurous spirit adds excitement to your sometimes indecisive nature.",
  "Libra-Scorpio":
    "As a Libra woman, you'll be both intrigued and challenged by the Scorpio man's intense emotional depth. His passionate nature awakens feelings you didn't know you had, though his intensity may sometimes overwhelm your preference for peace and harmony.",
  "Libra-Taurus":
    "As a Libra woman, you'll feel completely at home with the Taurus man's appreciation for beauty and comfort. His steady, reliable nature provides the security you crave, while his sensual approach to life perfectly complements your refined tastes.",
  "Libra-Virgo":
    "As a Libra woman, you'll appreciate the Virgo man's thoughtful, caring nature. His attention to detail and desire to serve appeal to your diplomatic heart, while his practical approach helps ground your sometimes idealistic tendencies.",

  // Pisces female perspective
  "Pisces-Aquarius":
    "As a Pisces woman, you'll be fascinated by the Aquarius man's unique perspective and humanitarian spirit. His intellectual approach to emotions helps you understand your own feelings, though his detachment may sometimes leave you longing for deeper emotional connection.",
  "Pisces-Aries":
    "As a Pisces woman, you'll be both excited and overwhelmed by the Aries man's bold, passionate energy. His protective strength makes you feel safe, while his direct approach helps you navigate decisions you might otherwise avoid.",
  "Pisces-Cancer":
    "As a Pisces woman, you'll find your emotional soulmate in the Cancer man who understands your intuitive, nurturing nature. His protective instincts and emotional depth create a safe haven where your sensitive spirit can flourish completely.",
  "Pisces-Capricorn":
    "As a Pisces woman, you'll be drawn to the Capricorn man's strength and ambition. His practical approach to life provides the structure and security your dreamy nature needs, while his quiet confidence makes you feel protected and cherished.",
  "Pisces-Gemini":
    "As a Pisces woman, you'll be intrigued by the Gemini man's quick wit and intellectual curiosity. His versatile nature keeps you engaged, though his rational approach may sometimes clash with your emotional, intuitive way of understanding the world.",
  "Pisces-Leo":
    "As a Pisces woman, you'll be enchanted by the Leo man's warmth and generous spirit. His confident protection and dramatic expressions of love make you feel like a treasured princess, while your devotion satisfies his need for adoration.",
  "Pisces-Libra":
    "As a Pisces woman, you'll be charmed by the Libra man's romantic nature and appreciation for beauty. His diplomatic approach to conflict appeals to your peace-loving spirit, while his aesthetic sense complements your own artistic sensibilities.",
  "Pisces-Pisces":
    "As a Pisces woman, you'll find perfect emotional understanding with a Pisces man who shares your intuitive, compassionate nature. Your mutual empathy and spiritual connection create a dreamy, otherworldly relationship filled with deep emotional intimacy.",
  "Pisces-Sagittarius":
    "As a Pisces woman, you'll be inspired by the Sagittarius man's optimistic philosophy and adventurous spirit. His broad perspective on life expands your own spiritual understanding, though his need for freedom may sometimes leave you feeling emotionally adrift.",
  "Pisces-Scorpio":
    "As a Pisces woman, you'll be deeply drawn to the Scorpio man's emotional intensity and mysterious depth. His passionate nature matches your own emotional depths, creating a profound, transformative connection that transcends the ordinary.",
  "Pisces-Taurus":
    "As a Pisces woman, you'll feel completely secure with the Taurus man's steady, reliable nature. His practical approach to love provides the stability your dreamy nature needs, while his sensual appreciation for life's pleasures appeals to your romantic spirit.",
  "Pisces-Virgo":
    "As a Pisces woman, you'll be touched by the Virgo man's caring attention to detail and desire to serve. His practical approach helps organize your sometimes chaotic emotional world, while his devotion provides the security and care you crave.",

  // Sagittarius female perspective
  "Sagittarius-Aquarius":
    "As a Sagittarius woman, you'll find an ideal adventure companion in the Aquarius man who shares your love of freedom and intellectual exploration. His innovative thinking expands your philosophical horizons, while his respect for independence perfectly matches your free spirit.",
  "Sagittarius-Aries":
    "As a Sagittarius woman, you'll be thrilled by the Aries man's bold energy and pioneering spirit. His confidence and direct approach to life match your own adventurous nature, creating a dynamic partnership filled with excitement and shared conquests.",
  "Sagittarius-Cancer":
    "As a Sagittarius woman, you'll be both touched and challenged by the Cancer man's nurturing, emotional nature. His protective instincts appeal to your generous heart, though his need for security may sometimes clash with your desire for freedom and exploration.",
  "Sagittarius-Capricorn":
    "As a Sagittarius woman, you'll respect the Capricorn man's ambition and determination. His practical approach to achieving goals can help ground your expansive dreams, though his cautious nature may sometimes frustrate your impulsive, adventurous spirit.",
  "Sagittarius-Gemini":
    "As a Sagittarius woman, you'll find your perfect intellectual match in the Gemini man who shares your curiosity and love of learning. His versatile mind keeps you constantly engaged, while your philosophical depth adds meaning to his varied interests.",
  "Sagittarius-Leo":
    "As a Sagittarius woman, you'll be captivated by the Leo man's confident charisma and dramatic flair. His generous spirit matches your own optimistic nature, while his appreciation for your adventurous spirit creates a relationship filled with grand gestures and shared excitement.",
  "Sagittarius-Libra":
    "As a Sagittarius woman, you'll be charmed by the Libra man's diplomatic nature and appreciation for beauty. His balanced approach to life complements your sometimes extreme enthusiasm, while his social grace enhances your natural ability to connect with others.",
  "Sagittarius-Pisces":
    "As a Sagittarius woman, you'll be intrigued by the Pisces man's emotional depth and spiritual sensitivity. His compassionate nature softens your sometimes blunt honesty, while his intuitive understanding adds emotional richness to your philosophical worldview.",
  "Sagittarius-Sagittarius":
    "As a Sagittarius woman, you'll find the ultimate adventure partner in a Sagittarius man who shares your love of freedom, exploration, and philosophical discovery. Your mutual optimism and wanderlust create an exciting, ever-expanding relationship.",
  "Sagittarius-Scorpio":
    "As a Sagittarius woman, you'll be both fascinated and challenged by the Scorpio man's intense emotional depth. His passionate nature intrigues your curious mind, though his need for emotional intensity may sometimes feel heavy compared to your light-hearted approach.",
  "Sagittarius-Taurus":
    "As a Sagittarius woman, you'll appreciate the Taurus man's steady, grounding presence. His reliability provides a secure base for your adventures, though his resistance to change and preference for routine may sometimes clash with your need for variety and exploration.",
  "Sagittarius-Virgo":
    "As a Sagittarius woman, you'll be impressed by the Virgo man's intelligence and attention to detail. His practical approach can help you organize your expansive plans, though his critical nature may sometimes dampen your enthusiastic, optimistic spirit.",

  // Scorpio female perspective
  "Scorpio-Aquarius":
    "As a Scorpio woman, you'll be both intrigued and frustrated by the Aquarius man's intellectual detachment. His innovative thinking fascinates your investigative mind, though his emotional aloofness may leave you craving the deep, intense connection you need.",
  "Scorpio-Aries":
    "As a Scorpio woman, you'll be magnetically drawn to the Aries man's bold confidence and passionate energy. His direct approach to life and love appeals to your intense nature, while his courage matches your own fearless pursuit of what you want.",
  "Scorpio-Cancer":
    "As a Scorpio woman, you'll find perfect emotional understanding with the Cancer man who shares your deep, intuitive nature. His protective instincts and emotional sensitivity create the safe, nurturing environment where your intense feelings can be fully expressed and understood.",
  "Scorpio-Capricorn":
    "As a Scorpio woman, you'll be powerfully attracted to the Capricorn man's ambition and self-control. His determination and success-oriented nature match your own intense drive, while his quiet strength provides the stability you need for your transformative journey.",
  "Scorpio-Gemini":
    "As a Scorpio woman, you'll be both fascinated and frustrated by the Gemini man's quick, versatile mind. His intellectual curiosity intrigues you, though his surface-level approach to emotions may clash with your need for deep, meaningful psychological connection.",
  "Scorpio-Leo":
    "As a Scorpio woman, you'll be drawn to the Leo man's confident strength and dramatic passion. His bold approach to love matches your own intensity, though you may clash over control and your respective needs for attention and dominance.",
  "Scorpio-Libra":
    "As a Scorpio woman, you'll be both attracted to and challenged by the Libra man's diplomatic charm. His appreciation for beauty and harmony appeals to your aesthetic sense, though his avoidance of conflict may frustrate your direct, intense approach to relationships.",
  "Scorpio-Pisces":
    "As a Scorpio woman, you'll find your emotional soulmate in the Pisces man who understands your deep, intuitive nature. His compassionate heart and spiritual sensitivity perfectly complement your intensity, creating a profoundly transformative and healing connection.",
  "Scorpio-Sagittarius":
    "As a Scorpio woman, you'll be intrigued by the Sagittarius man's adventurous spirit and philosophical nature. His optimistic outlook can lighten your sometimes intense mood, though his need for freedom may challenge your desire for deep, committed connection.",
  "Scorpio-Scorpio":
    "As a Scorpio woman, you'll find both intense passion and potential conflict with a Scorpio man who mirrors your own emotional depth and intensity. When you're aligned, the connection is transformative, but power struggles and jealousy may create dramatic challenges.",
  "Scorpio-Taurus":
    "As a Scorpio woman, you'll be powerfully drawn to the Taurus man's sensual, steady nature. His reliability and devotion appeal to your need for loyalty, while his appreciation for life's pleasures perfectly complements your own passionate, intense approach to love.",
  "Scorpio-Virgo":
    "As a Scorpio woman, you'll appreciate the Virgo man's analytical intelligence and devotion to service. His attention to detail and desire to understand you deeply satisfies your need for genuine connection, while his practical nature helps ground your intense emotions.",

  // Taurus female perspective
  "Taurus-Aquarius":
    "As a Taurus woman, you'll be both intrigued and challenged by the Aquarius man's unconventional thinking. His innovative ideas expand your perspective, though his unpredictable nature and need for independence may sometimes clash with your desire for security and routine.",
  "Taurus-Aries":
    "As a Taurus woman, you'll be both attracted to and overwhelmed by the Aries man's bold, energetic approach. His confidence and passion awaken your sensual nature, though his impulsive behavior may sometimes disrupt the peace and stability you crave.",
  "Taurus-Cancer":
    "As a Taurus woman, you'll find perfect emotional harmony with the Cancer man who shares your love of home, security, and nurturing relationships. His protective instincts and emotional depth create the stable, loving environment where your generous nature can flourish.",
  "Taurus-Capricorn":
    "As a Taurus woman, you'll feel completely aligned with the Capricorn man who shares your appreciation for tradition, security, and long-term goals. His ambition and practical approach to life perfectly complement your own steady, determined nature.",
  "Taurus-Gemini":
    "As a Taurus woman, you'll be both fascinated and frustrated by the Gemini man's quick wit and changeable nature. His intellectual curiosity keeps you entertained, though his restless energy may sometimes disturb your preference for peace and predictability.",
  "Taurus-Leo":
    "As a Taurus woman, you'll be enchanted by the Leo man's warmth and generous spirit. His appreciation for luxury and comfort aligns with your own love of life's pleasures, while his loyal, devoted nature satisfies your need for security and consistency.",
  "Taurus-Libra":
    "As a Taurus woman, you'll be charmed by the Libra man's appreciation for beauty and harmony. His diplomatic nature and refined tastes perfectly complement your own aesthetic sensibilities, while his desire for partnership matches your loyal, committed approach to love.",
  "Taurus-Pisces":
    "As a Taurus woman, you'll be touched by the Pisces man's gentle, compassionate nature. His emotional sensitivity and romantic spirit appeal to your nurturing heart, while his appreciation for your stability provides the grounding his dreamy nature needs.",
  "Taurus-Sagittarius":
    "As a Taurus woman, you'll be both excited and challenged by the Sagittarius man's adventurous spirit. His optimistic outlook and love of exploration can help expand your sometimes narrow worldview, though his restless nature may clash with your need for routine and security.",
  "Taurus-Scorpio":
    "As a Taurus woman, you'll be powerfully drawn to the Scorpio man's intense, magnetic presence. His passionate nature awakens your own sensual depths, while his devotion and loyalty satisfy your need for a deep, committed, transformative relationship.",
  "Taurus-Taurus":
    "As a Taurus woman, you'll find perfect understanding with a Taurus man who shares your love of comfort, security, and life's sensual pleasures. Your mutual appreciation for stability and luxury creates a harmonious, indulgent partnership built on shared values.",
  "Taurus-Virgo":
    "As a Taurus woman, you'll feel perfectly at home with the Virgo man's practical, caring nature. His attention to detail and desire to serve perfectly complement your nurturing instincts, while his reliable, hardworking approach matches your own steady determination.",

  // Virgo female perspective
  "Virgo-Aquarius":
    "As a Virgo woman, you'll be both impressed and puzzled by the Aquarius man's innovative thinking. His humanitarian ideals appeal to your desire to serve, though his unconventional approach may sometimes clash with your preference for practical, proven methods.",
  "Virgo-Aries":
    "As a Virgo woman, you'll be both energized and overwhelmed by the Aries man's bold, impulsive nature. His confidence and leadership abilities impress you, though his hasty decision-making may conflict with your careful, analytical approach to life.",
  "Virgo-Cancer":
    "As a Virgo woman, you'll find perfect emotional compatibility with the Cancer man who shares your caring, nurturing nature. His protective instincts and emotional sensitivity complement your practical care, creating a relationship built on mutual service and devotion.",
  "Virgo-Capricorn":
    "As a Virgo woman, you'll feel completely aligned with the Capricorn man who shares your practical approach to life and long-term goals. His ambition and discipline match your own hardworking nature, creating a partnership built on mutual respect and shared achievements.",
  "Virgo-Gemini":
    "As a Virgo woman, you'll appreciate the Gemini man's quick intelligence and curiosity. His versatile mind keeps you intellectually engaged, though his scattered energy may sometimes frustrate your preference for focus and follow-through on commitments.",
  "Virgo-Leo":
    "As a Virgo woman, you'll be both charmed and challenged by the Leo man's confident, dramatic nature. His warmth and generosity appeal to your caring heart, though his need for attention and grand gestures may sometimes overwhelm your modest, practical sensibilities.",
  "Virgo-Libra":
    "As a Virgo woman, you'll appreciate the Libra man's diplomatic nature and appreciation for harmony. His balanced approach to relationships complements your own desire for peace, while his aesthetic sense enhances your practical approach to creating beauty.",
  "Virgo-Pisces":
    "As a Virgo woman, you'll be both drawn to and challenged by the Pisces man's emotional, intuitive nature. His compassionate heart appeals to your caring instincts, while your practical approach provides the grounding his dreamy, sensitive nature needs.",
  "Virgo-Sagittarius":
    "As a Virgo woman, you'll be intrigued by the Sagittarius man's philosophical outlook and adventurous spirit. His broad perspective expands your sometimes narrow focus, though his impulsive nature may clash with your careful, methodical approach to life.",
  "Virgo-Scorpio":
    "As a Virgo woman, you'll be fascinated by the Scorpio man's emotional depth and investigative nature. His intensity and passion intrigue your analytical mind, while his devotion and loyalty satisfy your need for a committed, meaningful relationship.",
  "Virgo-Taurus":
    "As a Virgo woman, you'll feel perfectly understood by the Taurus man who shares your practical, steady approach to life. His reliability and appreciation for your caring nature create a stable, harmonious partnership built on mutual respect and shared values.",
  "Virgo-Virgo":
    "As a Virgo woman, you'll find both perfect understanding and potential criticism with a Virgo man who shares your analytical, perfectionist nature. Your mutual desire to serve and improve creates a dedicated partnership, though you may both struggle with being overly critical.",

  // Capricorn female perspective
  "Capricorn-Aquarius":
    "As a Capricorn woman, you'll be both impressed and frustrated by the Aquarius man's innovative thinking. His humanitarian ideals and progressive ideas challenge your traditional approach, though his unpredictable nature may clash with your need for structure and security.",
  "Capricorn-Aries":
    "As a Capricorn woman, you'll be energized by the Aries man's confidence and leadership abilities. His bold approach to achieving goals impresses your ambitious nature, though his impulsive methods may sometimes conflict with your careful, strategic planning.",
  "Capricorn-Cancer":
    "As a Capricorn woman, you'll find perfect complementary balance with the Cancer man who provides the emotional warmth and nurturing that softens your sometimes stern exterior. His protective instincts and family values align beautifully with your traditional approach to relationships.",
  "Capricorn-Capricorn":
    "As a Capricorn woman, you'll find ideal partnership with a Capricorn man who shares your ambition, discipline, and long-term vision. Your mutual respect for tradition and success creates a powerful alliance, though you may both need to work on expressing emotions.",
  "Capricorn-Gemini":
    "As a Capricorn woman, you'll be both fascinated and frustrated by the Gemini man's quick wit and versatile nature. His intellectual agility impresses you, though his changeable approach may clash with your preference for consistency and long-term commitment.",
  "Capricorn-Leo":
    "As a Capricorn woman, you'll be attracted to the Leo man's confidence and success-oriented nature. His leadership abilities and generous spirit appeal to your ambitious heart, while his appreciation for luxury aligns with your own desire for quality and status.",
  "Capricorn-Libra":
    "As a Capricorn woman, you'll appreciate the Libra man's diplomatic skills and appreciation for quality. His balanced approach to relationships complements your practical nature, while his aesthetic sense enhances your own sophisticated taste and social ambitions.",
  "Capricorn-Pisces":
    "As a Capricorn woman, you'll be touched by the Pisces man's gentle, compassionate nature. His emotional sensitivity and intuitive understanding help soften your sometimes rigid approach, while your stability provides the security his sensitive nature craves.",
  "Capricorn-Sagittarius":
    "As a Capricorn woman, you'll be both inspired and challenged by the Sagittarius man's optimistic, adventurous spirit. His philosophical outlook expands your practical worldview, though his impulsive nature may sometimes conflict with your careful planning.",
  "Capricorn-Scorpio":
    "As a Capricorn woman, you'll be powerfully drawn to the Scorpio man's intensity and determination. His passionate approach to achieving goals matches your own ambitious drive, while his emotional depth adds richness to your sometimes work-focused life.",
  "Capricorn-Taurus":
    "As a Capricorn woman, you'll feel perfectly aligned with the Taurus man who shares your appreciation for security, tradition, and life's finer pleasures. His steady, reliable nature complements your ambitious drive, creating a stable, prosperous partnership.",
  "Capricorn-Virgo":
    "As a Capricorn woman, you'll find ideal compatibility with the Virgo man who shares your practical, hardworking approach to life. His attention to detail and desire to serve perfectly complement your leadership abilities and long-term vision for success.",
};

// Male perspective compatibility data
const maleCompatibilityData = {
  "Aquarius-Aquarius":
    "As an Aquarius man, you'll find a perfect intellectual match in an Aquarius woman who understands your need for independence and mental stimulation. She won't pressure you to commit quickly, allowing the relationship to develop naturally. You'll admire her individuality and unique perspective on life.",
  "Aquarius-Aries":
    "As an Aquarius man, you'll be fascinated by the Aries woman's boldness and determination. She brings excitement and energy into your life, pushing you to turn your innovative ideas into action. You'll enjoy intellectual sparring with her, as she can match your wit and challenge your perspectives.",
  "Aquarius-Cancer":
    "As an Aquarius man, you may find the Cancer woman's emotional intelligence and intuitive nature intriguing but sometimes overwhelming. She offers you a level of emotional depth and nurturing that can help you connect with your feelings, but her need for security and tradition might feel restrictive.",
  "Aquarius-Capricorn":
    "As an Aquarius man, you'll respect the Capricorn woman's ambition and self-discipline, finding her success and independence attractive. Her practical approach can help ground your innovative ideas into reality.",
  "Aquarius-Gemini":
    "As an Aquarius man, you'll find the perfect conversational partner in a Gemini woman who can match your intellectual energy and curiosity. She keeps you engaged with her quick wit and ever-changing interests.",
  "Aquarius-Leo":
    "As an Aquarius man, you'll be drawn to the Leo woman's confidence and radiant personality. Her warmth and generosity will make you feel special, and you'll enjoy the way she brings excitement and drama into your life.",
  "Aquarius-Libra":
    "As an Aquarius man, you'll connect deeply with the Libra woman's sense of justice and love for intellectual discussions. Her diplomatic skills will smooth over your sometimes tactless comments.",
  "Aquarius-Pisces":
    "As an Aquarius man, you'll be captivated by the Pisces woman's compassionate nature and artistic sensibility. Her intuitive understanding of emotions can help you connect with feelings you usually intellectualize.",
  "Aquarius-Sagittarius":
    "As an Aquarius man, you'll find the perfect companion in the Sagittarius woman who shares your love of adventure and intellectual exploration. Her optimistic outlook matches your progressive thinking.",
  "Aquarius-Scorpio":
    "As an Aquarius man, you'll be drawn to the Scorpio woman's magnetic intensity and psychological depth. Her mysterious nature will challenge your analytical mind.",
  "Aquarius-Taurus":
    "As an Aquarius man, you'll appreciate the Taurus woman's reliability and down-to-earth approach to life. Her nurturing nature can provide the stability and comfort you sometimes need.",
  "Aquarius-Virgo":
    "As an Aquarius man, you'll respect the Virgo woman's intelligence and practical problem-solving skills. Her methodical approach can help you organize your innovative ideas into workable plans.",

  "Aries-Aries":
    "As an Aries man, you'll meet your perfect match in an Aries woman who shares your competitive spirit and love of adventure. The attraction is instant and intense, with both of you bringing raw energy and passion to the relationship.",
  "Aries-Cancer":
    "As an Aries man, you'll be touched by the Cancer woman's caring nature and emotional intelligence. Her nurturing approach will make you feel truly cared for, while her intuition helps you understand your own feelings better.",
  "Aries-Capricorn":
    "As an Aries man, you'll be impressed by the Capricorn woman's ambition and self-discipline. Her practical approach can help you turn your bold ideas into reality.",
  "Aries-Gemini":
    "As an Aries man, you'll be fascinated by the Gemini woman's quick mind and adaptability. Her intellectual curiosity matches your adventurous spirit.",
  "Aries-Leo":
    "As an Aries man, you'll be captivated by the Leo woman's radiant confidence and dramatic flair. Her warmth and generosity will inspire your protective instincts.",
  "Aries-Libra":
    "As an Aries man, you'll be intrigued by the Libra woman's grace and diplomatic charm. Her natural beauty and desire for harmony will soften your rough edges.",
  "Aries-Pisces":
    "As an Aries man, you'll be moved by the Pisces woman's emotional depth and intuitive understanding. Her gentle, compassionate nature brings out your protective side.",
  "Aries-Sagittarius":
    "As an Aries man, you'll find an ideal adventure partner in the Sagittarius woman's free-spirited nature. Her love of travel and new experiences matches your own pioneering spirit.",
  "Aries-Scorpio":
    "As an Aries man, you'll be both fascinated and challenged by the Scorpio woman's intense emotional depth. Her passionate nature matches your own fire.",
  "Aries-Taurus":
    "As an Aries man, you'll be grounded by the Taurus woman's stability and sensual nature. Her patience and practical approach help you slow down and appreciate life's pleasures.",
  "Aries-Virgo":
    "As an Aries man, you'll be impressed by the Virgo woman's intelligence and attention to detail. Her practical approach can help you refine your bold ideas into successful realities.",

  // Cancer male perspective
  "Cancer-Aquarius":
    "As a Cancer man, you'll be intrigued by the Aquarius woman's independent spirit and innovative thinking. Her intellectual approach to life fascinates you, though her emotional detachment may sometimes leave you feeling uncertain about her feelings.",
  "Cancer-Aries":
    "As a Cancer man, you'll be both attracted to and overwhelmed by the Aries woman's bold confidence. Her passionate energy excites you, while your protective instincts are aroused by her need for emotional security beneath her strong exterior.",
  "Cancer-Cancer":
    "As a Cancer man, you'll find perfect emotional understanding with a Cancer woman who shares your intuitive, nurturing nature. Your mutual need for security and emotional connection creates a deeply bonded, protective relationship.",
  "Cancer-Capricorn":
    "As a Cancer man, you'll be impressed by the Capricorn woman's ambition and determination. Her practical approach to goals complements your emotional intelligence, while her success-oriented nature makes you feel proud and protective.",
  "Cancer-Gemini":
    "As a Cancer man, you'll be fascinated by the Gemini woman's quick wit and intellectual versatility. Her playful nature lightens your sometimes serious mood, though her changeable emotions may challenge your need for emotional consistency.",
  "Cancer-Leo":
    "As a Cancer man, you'll be drawn to the Leo woman's warmth and dramatic flair. Her confidence and generous spirit make you feel appreciated, while your nurturing nature satisfies her need for devotion and care.",
  "Cancer-Libra":
    "As a Cancer man, you'll be charmed by the Libra woman's diplomatic grace and appreciation for harmony. Her peaceful nature appeals to your desire for emotional security, while her aesthetic sense enhances your domestic instincts.",
  "Cancer-Pisces":
    "As a Cancer man, you'll find your perfect emotional match in the Pisces woman who understands your deep, intuitive nature. Her compassionate heart and emotional sensitivity create a profound, spiritual connection that feels like coming home.",
  "Cancer-Sagittarius":
    "As a Cancer man, you'll be both excited and challenged by the Sagittarius woman's adventurous spirit. Her optimistic outlook can help lift your moods, though her need for freedom may sometimes clash with your desire for closeness and security.",
  "Cancer-Scorpio":
    "As a Cancer man, you'll be deeply attracted to the Scorpio woman's emotional intensity and mysterious depth. Her passionate nature matches your own emotional depths, creating a transformative connection that transcends ordinary relationships.",
  "Cancer-Taurus":
    "As a Cancer man, you'll feel completely at home with the Taurus woman's steady, nurturing nature. Her practical approach to love and appreciation for domestic comfort perfectly complement your protective instincts and need for security.",
  "Cancer-Virgo":
    "As a Cancer man, you'll appreciate the Virgo woman's caring attention to detail and practical approach to relationships. Her desire to serve and improve perfectly complements your nurturing nature and emotional intelligence.",

  // Gemini male perspective
  "Gemini-Aquarius":
    "As a Gemini man, you'll find the perfect intellectual companion in the Aquarius woman who matches your curiosity and love of ideas. Her innovative thinking and social consciousness fascinate you, while her independence respects your need for mental freedom.",
  "Gemini-Aries":
    "As a Gemini man, you'll be energized by the Aries woman's bold confidence and direct approach. Her decisive nature cuts through your sometimes scattered thoughts, while your wit and adaptability keep her constantly engaged and intrigued.",
  "Gemini-Cancer":
    "As a Gemini man, you'll be touched by the Cancer woman's emotional depth and nurturing instincts. Her intuitive understanding of your moods helps stabilize your changeable nature, though her need for emotional security may sometimes feel restrictive.",
  "Gemini-Capricorn":
    "As a Gemini man, you'll be impressed by the Capricorn woman's ambition and disciplined approach to life. Her practical goals can help focus your scattered energy, though her serious nature may sometimes clash with your playful spirit.",
  "Gemini-Gemini":
    "As a Gemini man, you'll find endless mental stimulation with a Gemini woman who mirrors your quick wit and intellectual curiosity. Your conversations will be fascinating and varied, though you may both struggle with consistency and emotional depth.",
  "Gemini-Leo":
    "As a Gemini man, you'll be captivated by the Leo woman's confident charisma and dramatic presence. Her warmth and generosity draw you in, while your wit and charm perfectly satisfy her need for an entertaining, admiring audience.",
  "Gemini-Libra":
    "As a Gemini man, you'll find perfect mental harmony with the Libra woman who shares your love of communication and social connection. Her diplomatic grace balances your sometimes sharp wit, creating elegant conversations and partnerships.",
  "Gemini-Pisces":
    "As a Gemini man, you'll be intrigued by the Pisces woman's emotional depth and intuitive understanding. Her compassionate nature softens your rational approach, though her emotional intensity may sometimes overwhelm your lighter perspective.",
  "Gemini-Sagittarius":
    "As a Gemini man, you'll find your ideal intellectual opposite in the Sagittarius woman who shares your love of learning and exploration. Her philosophical depth gives meaning to your varied interests, while her adventurous spirit matches your mental wanderlust.",
  "Gemini-Scorpio":
    "As a Gemini man, you'll be both fascinated and challenged by the Scorpio woman's intense emotional depth. Her mysterious nature intrigues your curious mind, though her need for deep psychological connection may feel overwhelming to your surface-oriented approach.",
  "Gemini-Taurus":
    "As a Gemini man, you'll appreciate the Taurus woman's steady, grounding presence. Her reliability provides security for your changeable nature, though her resistance to change may sometimes frustrate your need for variety and mental stimulation.",
  "Gemini-Virgo":
    "As a Gemini man, you'll connect with the Virgo woman's sharp intellect and analytical abilities. Her attention to detail complements your broad perspective, though her critical nature may sometimes dampen your optimistic enthusiasm and scattered approach.",

  // Leo male perspective
  "Leo-Aquarius":
    "As a Leo man, you'll be both attracted to and challenged by the Aquarius woman's unique independence and unconventional thinking. Her intellectual approach fascinates you, though her emotional detachment may leave you craving more warmth and admiration.",
  "Leo-Aries":
    "As a Leo man, you'll find your perfect match in the Aries woman who shares your bold confidence and passionate energy. Her adventurous spirit matches your own dramatic flair, creating a dynamic, exciting relationship filled with mutual admiration and respect.",
  "Leo-Cancer":
    "As a Leo man, you'll be touched by the Cancer woman's gentle, nurturing devotion. Her emotional depth and protective instincts appeal to your generous heart, while her appreciation for your strength and leadership makes you feel truly valued.",
  "Leo-Capricorn":
    "As a Leo man, you'll respect the Capricorn woman's ambition and success-oriented nature. Her determination and practical approach to achieving goals impress you, while her appreciation for quality and status aligns with your own desire for the finest things.",
  "Leo-Gemini":
    "As a Leo man, you'll be delighted by the Gemini woman's wit and intellectual versatility. Her ability to keep you entertained with stimulating conversation perfectly satisfies your need for an engaging, appreciative audience who can match your mental energy.",
  "Leo-Leo":
    "As a Leo man, you'll find both magnificent attraction and dramatic conflict with a Leo woman who mirrors your own passionate, theatrical nature. When you're in harmony, the relationship is spectacular, but you may compete for attention and dominance.",
  "Leo-Libra":
    "As a Leo man, you'll be charmed by the Libra woman's refined grace and romantic nature. Her appreciation for beauty and harmony complements your own dramatic style, while her diplomatic skills help manage conflicts with elegant solutions.",
  "Leo-Pisces":
    "As a Leo man, you'll be moved by the Pisces woman's romantic, dreamy devotion. Her emotional sensitivity and artistic nature appeal to your creative side, while her willingness to adore and support you satisfies your need for appreciation.",
  "Leo-Sagittarius":
    "As a Leo man, you'll find an ideal companion in the Sagittarius woman who shares your love of adventure and grand gestures. Her optimistic spirit and philosophical nature perfectly match your own enthusiastic approach to life's possibilities.",
  "Leo-Scorpio":
    "As a Leo man, you'll be both attracted to and challenged by the Scorpio woman's intense, magnetic presence. Her passionate nature matches your own dramatic energy, but her tendency toward jealousy may clash with your need for admiration from others.",
  "Leo-Taurus":
    "As a Leo man, you'll appreciate the Taurus woman's steady devotion and appreciation for luxury. Her reliable, sensual nature provides security, while her appreciation for comfort and pleasure aligns with your own desire for the good life.",
  "Leo-Virgo":
    "As a Leo man, you'll be intrigued by the Virgo woman's quiet intelligence and desire to serve. Her attention to detail and caring devotion make you feel special, though her critical tendencies may sometimes bruise your sensitive pride.",

  // Libra male perspective
  "Libra-Aquarius":
    "As a Libra man, you'll find an ideal intellectual partnership with the Aquarius woman who shares your love of ideas and social justice. Her innovative thinking inspires your diplomatic solutions, while her respect for independence appeals to your balanced nature.",
  "Libra-Aries":
    "As a Libra man, you'll be both attracted to and challenged by the Aries woman's direct, passionate approach. Her confidence and decisiveness help you overcome your tendency to hesitate, though her bluntness may sometimes clash with your diplomatic style.",
  "Libra-Cancer":
    "As a Libra man, you'll be touched by the Cancer woman's gentle, nurturing nature. Her emotional sensitivity and caring instincts appeal to your desire for harmony, while her protective love creates the peaceful environment you cherish.",
  "Libra-Capricorn":
    "As a Libra man, you'll admire the Capricorn woman's ambition and sophisticated approach to success. Her practical achievements and refined taste appeal to your appreciation for quality, while her steady nature provides the security you value.",
  "Libra-Gemini":
    "As a Libra man, you'll find perfect mental compatibility with the Gemini woman who shares your love of communication and intellectual exploration. Her wit and versatility keep you engaged, while your diplomatic skills help balance her scattered energy.",
  "Libra-Leo":
    "As a Libra man, you'll be dazzled by the Leo woman's confident charisma and generous spirit. Her dramatic flair and appreciation for beauty match your refined tastes, while her warmth and loyalty satisfy your need for devoted partnership.",
  "Libra-Libra":
    "As a Libra man, you'll find perfect harmony with a Libra woman who shares your love of beauty, balance, and peaceful relationships. Your mutual appreciation for romance and refinement creates an elegant partnership, though decision-making may be challenging.",
  "Libra-Pisces":
    "As a Libra man, you'll be enchanted by the Pisces woman's romantic, artistic nature. Her emotional depth and compassionate heart appeal to your desire for meaningful connection, while her dreamy sensitivity complements your aesthetic appreciation.",
  "Libra-Sagittarius":
    "As a Libra man, you'll be inspired by the Sagittarius woman's optimistic philosophy and adventurous spirit. Her broad perspective expands your worldview, while her enthusiastic nature adds excitement to your sometimes indecisive approach.",
  "Libra-Scorpio":
    "As a Libra man, you'll be both intrigued and overwhelmed by the Scorpio woman's intense emotional depth. Her passionate nature awakens feelings you didn't know you had, though her intensity may sometimes disturb your preference for peace and harmony.",
  "Libra-Taurus":
    "As a Libra man, you'll feel completely at home with the Taurus woman's appreciation for beauty and comfort. Her steady, reliable nature provides security, while her sensual approach to life perfectly complements your refined aesthetic sensibilities.",
  "Libra-Virgo":
    "As a Libra man, you'll appreciate the Virgo woman's thoughtful, caring nature. Her attention to detail and desire to serve appeal to your diplomatic heart, while her practical approach helps ground your sometimes idealistic tendencies.",

  // Pisces male perspective
  "Pisces-Aquarius":
    "As a Pisces man, you'll be fascinated by the Aquarius woman's unique perspective and humanitarian spirit. Her intellectual approach to emotions helps you understand your feelings, though her detachment may sometimes leave you longing for deeper emotional connection.",
  "Pisces-Aries":
    "As a Pisces man, you'll be both excited and overwhelmed by the Aries woman's bold, passionate energy. Her protective strength makes you feel safe, while her direct approach helps you navigate decisions you might otherwise avoid through intuition alone.",
  "Pisces-Cancer":
    "As a Pisces man, you'll find your emotional soulmate in the Cancer woman who understands your intuitive, compassionate nature. Her protective instincts and nurturing heart create a safe haven where your sensitive spirit can flourish and feel completely understood.",
  "Pisces-Capricorn":
    "As a Pisces man, you'll be drawn to the Capricorn woman's strength and practical ambition. Her structured approach to life provides the stability your dreamy nature needs, while her quiet confidence makes you feel protected and grounded.",
  "Pisces-Gemini":
    "As a Pisces man, you'll be intrigued by the Gemini woman's quick wit and intellectual curiosity. Her versatile nature keeps you engaged, though her rational approach may sometimes clash with your emotional, intuitive way of understanding the world.",
  "Pisces-Leo":
    "As a Pisces man, you'll be enchanted by the Leo woman's warmth and generous spirit. Her confident protection and dramatic expressions of love make you feel cherished, while your devotion and emotional depth satisfy her need for adoration.",
  "Pisces-Libra":
    "As a Pisces man, you'll be charmed by the Libra woman's romantic nature and appreciation for beauty. Her diplomatic approach to conflict appeals to your peace-loving spirit, while her aesthetic sense perfectly complements your own artistic sensibilities.",
  "Pisces-Pisces":
    "As a Pisces man, you'll find perfect emotional understanding with a Pisces woman who shares your intuitive, compassionate nature. Your mutual empathy and spiritual connection create a dreamy, otherworldly relationship filled with deep emotional and psychic intimacy.",
  "Pisces-Sagittarius":
    "As a Pisces man, you'll be inspired by the Sagittarius woman's optimistic philosophy and adventurous spirit. Her broad perspective expands your spiritual understanding, though her need for freedom may sometimes leave you feeling emotionally uncertain.",
  "Pisces-Scorpio":
    "As a Pisces man, you'll be deeply drawn to the Scorpio woman's emotional intensity and mysterious depth. Her passionate nature matches your own emotional depths, creating a profound, transformative connection that transcends ordinary human experience.",
  "Pisces-Taurus":
    "As a Pisces man, you'll feel completely secure with the Taurus woman's steady, reliable nature. Her practical approach to love provides the stability your dreamy nature needs, while her sensual appreciation for life appeals to your romantic spirit.",
  "Pisces-Virgo":
    "As a Pisces man, you'll be touched by the Virgo woman's caring attention to detail and desire to serve. Her practical approach helps organize your sometimes chaotic emotional world, while her devoted care provides the security and understanding you crave.",

  // Sagittarius male perspective
  "Sagittarius-Aquarius":
    "As a Sagittarius man, you'll find an ideal adventure companion in the Aquarius woman who shares your love of freedom and intellectual exploration. Her innovative thinking expands your philosophical horizons, while her independence perfectly matches your free-spirited nature.",
  "Sagittarius-Aries":
    "As a Sagittarius man, you'll be thrilled by the Aries woman's bold energy and pioneering spirit. Her confidence and direct approach match your own adventurous nature, creating a dynamic partnership filled with excitement, exploration, and shared conquests.",
  "Sagittarius-Cancer":
    "As a Sagittarius man, you'll be both touched and challenged by the Cancer woman's nurturing, emotional nature. Her protective instincts and caring heart appeal to your generous spirit, though her need for security may sometimes clash with your wanderlust.",
  "Sagittarius-Capricorn":
    "As a Sagittarius man, you'll respect the Capricorn woman's ambition and determination. Her practical approach to achieving goals can help ground your expansive dreams, though her cautious nature may sometimes frustrate your impulsive, optimistic approach.",
  "Sagittarius-Gemini":
    "As a Sagittarius man, you'll find your perfect intellectual match in the Gemini woman who shares your curiosity and love of learning. Her versatile mind keeps you constantly engaged, while your philosophical depth adds meaning to her varied interests.",
  "Sagittarius-Leo":
    "As a Sagittarius man, you'll be captivated by the Leo woman's confident charisma and dramatic flair. Her generous spirit matches your own optimistic nature, while her appreciation for your adventurous spirit creates a relationship filled with grand gestures.",
  "Sagittarius-Libra":
    "As a Sagittarius man, you'll be charmed by the Libra woman's diplomatic nature and appreciation for beauty. Her balanced approach complements your sometimes extreme enthusiasm, while her social grace enhances your natural ability to connect with diverse people.",
  "Sagittarius-Pisces":
    "As a Sagittarius man, you'll be intrigued by the Pisces woman's emotional depth and spiritual sensitivity. Her compassionate nature softens your sometimes blunt honesty, while her intuitive understanding adds emotional richness to your philosophical worldview.",
  "Sagittarius-Sagittarius":
    "As a Sagittarius man, you'll find the ultimate adventure partner in a Sagittarius woman who shares your love of freedom, exploration, and philosophical discovery. Your mutual optimism and wanderlust create an exciting, ever-expanding relationship.",
  "Sagittarius-Scorpio":
    "As a Sagittarius man, you'll be both fascinated and challenged by the Scorpio woman's intense emotional depth. Her passionate nature intrigues your curious mind, though her need for emotional intensity may sometimes feel heavy compared to your light-hearted approach.",
  "Sagittarius-Taurus":
    "As a Sagittarius man, you'll appreciate the Taurus woman's steady, grounding presence. Her reliability provides a secure base for your adventures, though her resistance to change may sometimes clash with your need for variety and constant exploration.",
  "Sagittarius-Virgo":
    "As a Sagittarius man, you'll be impressed by the Virgo woman's intelligence and attention to detail. Her practical approach can help you organize your expansive plans, though her critical nature may sometimes dampen your enthusiastic, optimistic spirit.",

  // Scorpio male perspective
  "Scorpio-Aquarius":
    "As a Scorpio man, you'll be both intrigued and frustrated by the Aquarius woman's intellectual detachment. Her innovative thinking fascinates your investigative mind, though her emotional aloofness may leave you craving the deep, intense connection you need.",
  "Scorpio-Aries":
    "As a Scorpio man, you'll be magnetically drawn to the Aries woman's bold confidence and passionate energy. Her direct approach to life and fearless nature appeal to your intense personality, while her courage matches your own relentless pursuit of what you want.",
  "Scorpio-Cancer":
    "As a Scorpio man, you'll find perfect emotional understanding with the Cancer woman who shares your deep, intuitive nature. Her protective instincts and emotional sensitivity create the safe, nurturing environment where your intense feelings can be fully expressed.",
  "Scorpio-Capricorn":
    "As a Scorpio man, you'll be powerfully attracted to the Capricorn woman's ambition and self-control. Her determination and success-oriented nature match your own intense drive, while her quiet strength provides the stability you need for transformation.",
  "Scorpio-Gemini":
    "As a Scorpio man, you'll be both fascinated and frustrated by the Gemini woman's quick, versatile mind. Her intellectual curiosity intrigues you, though her surface-level approach to emotions may clash with your need for deep, meaningful connection.",
  "Scorpio-Leo":
    "As a Scorpio man, you'll be drawn to the Leo woman's confident strength and dramatic passion. Her bold approach to love matches your own intensity, though you may clash over control and your respective needs for attention and dominance.",
  "Scorpio-Libra":
    "As a Scorpio man, you'll be both attracted to and challenged by the Libra woman's diplomatic charm. Her appreciation for beauty and harmony appeals to you, though her avoidance of conflict may frustrate your direct, intense approach to relationships.",
  "Scorpio-Pisces":
    "As a Scorpio man, you'll find your emotional soulmate in the Pisces woman who understands your deep, intuitive nature. Her compassionate heart and spiritual sensitivity perfectly complement your intensity, creating a profoundly transformative connection.",
  "Scorpio-Sagittarius":
    "As a Scorpio man, you'll be intrigued by the Sagittarius woman's adventurous spirit and philosophical nature. Her optimistic outlook can lighten your intense moods, though her need for freedom may challenge your desire for deep commitment.",
  "Scorpio-Scorpio":
    "As a Scorpio man, you'll find both intense passion and potential conflict with a Scorpio woman who mirrors your emotional depth and intensity. When aligned, the connection is transformative, but power struggles and jealousy may create dramatic challenges.",
  "Scorpio-Taurus":
    "As a Scorpio man, you'll be powerfully drawn to the Taurus woman's sensual, steady nature. Her reliability and devotion appeal to your need for loyalty, while her appreciation for life's pleasures perfectly complements your passionate, intense approach.",
  "Scorpio-Virgo":
    "As a Scorpio man, you'll appreciate the Virgo woman's analytical intelligence and devotion. Her attention to detail and desire to understand you deeply satisfies your need for genuine connection, while her practical nature helps ground your intense emotions.",

  // Taurus male perspective
  "Taurus-Aquarius":
    "As a Taurus man, you'll be both intrigued and challenged by the Aquarius woman's unconventional thinking. Her innovative ideas expand your perspective, though her unpredictable nature may sometimes disrupt the peace and stability you cherish in relationships.",
  "Taurus-Aries":
    "As a Taurus man, you'll be both attracted to and overwhelmed by the Aries woman's bold, energetic approach. Her confidence and passion awaken your sensual nature, though her impulsive behavior may sometimes disrupt your preference for steady, predictable love.",
  "Taurus-Cancer":
    "As a Taurus man, you'll find perfect emotional harmony with the Cancer woman who shares your love of home, security, and nurturing relationships. Her protective instincts and emotional depth create the stable, loving environment where your generous nature flourishes.",
  "Taurus-Capricorn":
    "As a Taurus man, you'll feel completely aligned with the Capricorn woman who shares your appreciation for tradition, security, and long-term goals. Her ambition and practical approach perfectly complement your own steady, determined nature and work ethic.",
  "Taurus-Gemini":
    "As a Taurus man, you'll be both fascinated and frustrated by the Gemini woman's quick wit and changeable nature. Her intellectual curiosity keeps you entertained, though her restless energy may sometimes disturb your preference for peace and consistency.",
  "Taurus-Leo":
    "As a Taurus man, you'll be enchanted by the Leo woman's warmth and generous spirit. Her appreciation for luxury and comfort aligns with your own love of life's pleasures, while her loyal, devoted nature satisfies your need for security.",
  "Taurus-Libra":
    "As a Taurus man, you'll be charmed by the Libra woman's appreciation for beauty and harmony. Her diplomatic nature and refined tastes perfectly complement your aesthetic sensibilities, while her desire for partnership matches your loyal approach to love.",
  "Taurus-Pisces":
    "As a Taurus man, you'll be touched by the Pisces woman's gentle, compassionate nature. Her emotional sensitivity and romantic spirit appeal to your nurturing heart, while her appreciation for your stability provides grounding for her dreamy nature.",
  "Taurus-Sagittarius":
    "As a Taurus man, you'll be both excited and challenged by the Sagittarius woman's adventurous spirit. Her optimistic outlook can help expand your sometimes narrow worldview, though her restless nature may clash with your need for routine and security.",
  "Taurus-Scorpio":
    "As a Taurus man, you'll be powerfully drawn to the Scorpio woman's intense, magnetic presence. Her passionate nature awakens your own sensual depths, while her devotion and loyalty satisfy your need for a deep, committed, transformative relationship.",
  "Taurus-Taurus":
    "As a Taurus man, you'll find perfect understanding with a Taurus woman who shares your love of comfort, security, and life's sensual pleasures. Your mutual appreciation for stability and luxury creates a harmonious, indulgent partnership built on shared values.",
  "Taurus-Virgo":
    "As a Taurus man, you'll feel perfectly at home with the Virgo woman's practical, caring nature. Her attention to detail and desire to serve perfectly complement your nurturing instincts, while her reliable approach matches your own steady determination.",

  // Virgo male perspective
  "Virgo-Aquarius":
    "As a Virgo man, you'll be both impressed and puzzled by the Aquarius woman's innovative thinking. Her humanitarian ideals appeal to your desire to serve, though her unconventional approach may sometimes clash with your preference for practical, proven methods.",
  "Virgo-Aries":
    "As a Virgo man, you'll be both energized and overwhelmed by the Aries woman's bold, impulsive nature. Her confidence and leadership impress you, though her hasty decision-making may conflict with your careful, analytical approach to life and relationships.",
  "Virgo-Cancer":
    "As a Virgo man, you'll find perfect emotional compatibility with the Cancer woman who shares your caring, nurturing nature. Her protective instincts and emotional sensitivity complement your practical care, creating a relationship built on mutual service and devotion.",
  "Virgo-Capricorn":
    "As a Virgo man, you'll feel completely aligned with the Capricorn woman who shares your practical approach to life and long-term goals. Her ambition and discipline match your hardworking nature, creating a partnership built on mutual respect and achievements.",
  "Virgo-Gemini":
    "As a Virgo man, you'll appreciate the Gemini woman's quick intelligence and curiosity. Her versatile mind keeps you intellectually engaged, though her scattered energy may sometimes frustrate your preference for focus and methodical follow-through.",
  "Virgo-Leo":
    "As a Virgo man, you'll be both charmed and challenged by the Leo woman's confident, dramatic nature. Her warmth and generosity appeal to your caring heart, though her need for attention may sometimes overwhelm your modest, practical sensibilities.",
  "Virgo-Libra":
    "As a Virgo man, you'll appreciate the Libra woman's diplomatic nature and desire for harmony. Her balanced approach to relationships complements your own desire for peace, while her aesthetic sense enhances your practical approach to creating beauty.",
  "Virgo-Pisces":
    "As a Virgo man, you'll be both drawn to and challenged by the Pisces woman's emotional, intuitive nature. Her compassionate heart appeals to your caring instincts, while your practical approach provides the grounding her dreamy, sensitive nature needs.",
  "Virgo-Sagittarius":
    "As a Virgo man, you'll be intrigued by the Sagittarius woman's philosophical outlook and adventurous spirit. Her broad perspective expands your sometimes narrow focus, though her impulsive nature may clash with your careful, methodical approach.",
  "Virgo-Scorpio":
    "As a Virgo man, you'll be fascinated by the Scorpio woman's emotional depth and investigative nature. Her intensity and passion intrigue your analytical mind, while her devotion and loyalty satisfy your need for a committed, meaningful relationship.",
  "Virgo-Taurus":
    "As a Virgo man, you'll feel perfectly understood by the Taurus woman who shares your practical, steady approach to life. Her reliability and appreciation for your caring nature create a stable, harmonious partnership built on mutual respect and shared values.",
  "Virgo-Virgo":
    "As a Virgo man, you'll find both perfect understanding and potential over-criticism with a Virgo woman who shares your analytical, perfectionist nature. Your mutual desire to serve and improve creates a dedicated partnership, though you may both struggle with being overly critical.",

  // Capricorn male perspective
  "Capricorn-Aquarius":
    "As a Capricorn man, you'll be both impressed and frustrated by the Aquarius woman's innovative thinking. Her humanitarian ideals and progressive ideas challenge your traditional approach, though her unpredictable nature may clash with your need for structure.",
  "Capricorn-Aries":
    "As a Capricorn man, you'll be energized by the Aries woman's confidence and leadership abilities. Her bold approach to achieving goals impresses your ambitious nature, though her impulsive methods may conflict with your careful, strategic planning approach.",
  "Capricorn-Cancer":
    "As a Capricorn man, you'll find perfect complementary balance with the Cancer woman who provides emotional warmth and nurturing that softens your stern exterior. Her protective instincts and family values align beautifully with your traditional relationship approach.",
  "Capricorn-Capricorn":
    "As a Capricorn man, you'll find ideal partnership with a Capricorn woman who shares your ambition, discipline, and long-term vision. Your mutual respect for tradition and success creates a powerful alliance, though emotional expression may require conscious effort.",
  "Capricorn-Gemini":
    "As a Capricorn man, you'll be both fascinated and frustrated by the Gemini woman's quick wit and versatile nature. Her intellectual agility impresses you, though her changeable approach may clash with your preference for consistency and commitment.",
  "Capricorn-Leo":
    "As a Capricorn man, you'll be attracted to the Leo woman's confidence and success-oriented nature. Her leadership abilities and generous spirit appeal to your ambitious heart, while her appreciation for luxury aligns with your desire for quality and status.",
  "Capricorn-Libra":
    "As a Capricorn man, you'll appreciate the Libra woman's diplomatic skills and appreciation for quality. Her balanced approach to relationships complements your practical nature, while her aesthetic sense enhances your sophisticated taste and social ambitions.",
  "Capricorn-Pisces":
    "As a Capricorn man, you'll be touched by the Pisces woman's gentle, compassionate nature. Her emotional sensitivity and intuitive understanding help soften your sometimes rigid approach, while your stability provides the security her sensitive nature craves.",
  "Capricorn-Sagittarius":
    "As a Capricorn man, you'll be both inspired and challenged by the Sagittarius woman's optimistic, adventurous spirit. Her philosophical outlook expands your practical worldview, though her impulsive nature may conflict with your careful planning.",
  "Capricorn-Scorpio":
    "As a Capricorn man, you'll be powerfully drawn to the Scorpio woman's intensity and determination. Her passionate approach to achieving goals matches your ambitious drive, while her emotional depth adds richness to your sometimes work-focused life.",
  "Capricorn-Taurus":
    "As a Capricorn man, you'll feel perfectly aligned with the Taurus woman who shares your appreciation for security, tradition, and life's finer pleasures. Her steady, reliable nature complements your ambitious drive, creating a stable, prosperous partnership.",
  "Capricorn-Virgo":
    "As a Capricorn man, you'll find ideal compatibility with the Virgo woman who shares your practical, hardworking approach to life. Her attention to detail and desire to serve perfectly complement your leadership abilities and long-term vision for success.",
};

// Planetary and astrological influences data
const planetaryData = {
  "Aquarius-Aquarius":
    "Elements: Aquarius is a sign of the zodiac associated with the element of air. Both partners are accustomed to brainstorming and facing problems with their exceptional intellectual ability. Planetary Influences: Being ruled by Uranus, the planet of innovation and rebellion, both Aquarians bring unpredictable energy to their relationship.",
  "Aquarius-Aries":
    "Elements: Fire and Air create a dynamic combination where Aries' passionate fire is fueled by Aquarius' intellectual air. Planetary Influences: Mars (Aries) meets Uranus (Aquarius), creating a relationship filled with spontaneous adventures and revolutionary ideas.",
  "Aquarius-Cancer":
    "Elements: Air and Water create a complex dynamic where intellectual Aquarius meets emotional Cancer. Planetary Influences: Uranus (Aquarius) and the Moon (Cancer) create an interesting tension between innovation and tradition, freedom and security.",
  "Aquarius-Capricorn":
    "Elements: Air meets Earth in a combination that can either create dust storms or fertile ground for growth. Planetary Influences: Uranus (Aquarius) and Saturn (Capricorn) create a fascinating dynamic between rebellion and tradition.",
  "Aquarius-Gemini":
    "Elements: Double Air creates a intellectual powerhouse where ideas flow freely and communication is effortless. Planetary Influences: Uranus (Aquarius) and Mercury (Gemini) create rapid mental connections and breakthrough insights.",
  "Aquarius-Leo":
    "Elements: Air and Fire create a dynamic combination where Leo's dramatic fire is fueled by Aquarius' intellectual air. Planetary Influences: Uranus (Aquarius) and the Sun (Leo) represent the tension between collective consciousness and individual expression.",
  "Aquarius-Libra":
    "Elements: Double Air creates perfect mental harmony where ideas, justice, and beauty flow seamlessly between partners. Planetary Influences: Uranus (Aquarius) and Venus (Libra) blend innovation with harmony.",
  "Aquarius-Pisces":
    "Elements: Air and Water create a mystical combination where intellectual innovation meets intuitive wisdom. Planetary Influences: Uranus (Aquarius) and Neptune (Pisces) create a dreamy, visionary energy.",
  "Aquarius-Sagittarius":
    "Elements: Air and Fire create an enthusiastic combination where intellectual pursuits meet adventurous exploration. Planetary Influences: Uranus (Aquarius) and Jupiter (Sagittarius) combine revolutionary innovation with expansive wisdom.",
  "Aquarius-Scorpio":
    "Elements: Air and Water create an intense combination where intellectual detachment meets emotional depth. Planetary Influences: Uranus (Aquarius) and Pluto (Scorpio) represent revolutionary transformation and deep psychological change.",
  "Aquarius-Taurus":
    "Elements: Air and Earth create a challenging combination where innovation meets tradition. Planetary Influences: Uranus (Aquarius) and Venus (Taurus) represent the tension between revolutionary change and traditional values.",
  "Aquarius-Virgo":
    "Elements: Air and Earth combine intellectual innovation with practical application. Planetary Influences: Uranus (Aquarius) and Mercury (Virgo) create a dynamic between revolutionary thinking and practical analysis.",

  "Aries-Aries":
    "The double Mars influence creates an intensely passionate and competitive dynamic. Both partners are driven by the warrior planet, leading to explosive energy, courage, and sexual magnetism.",
  "Aries-Cancer":
    "Mars meets the Moon in this pairing, creating a push-pull dynamic between action and emotion. Aries' Mars drives forward momentum while Cancer's Moon seeks emotional security and nurturing.",
  "Aries-Capricorn":
    "Mars-Saturn creates a powerful but challenging planetary combination. Aries' Mars represents raw energy and immediate action, while Capricorn's Saturn embodies discipline and long-term planning.",
  "Aries-Gemini":
    "Mars-Mercury creates a dynamic blend of action and communication. Aries' warrior energy combines with Gemini's messenger planet to create quick thinking and rapid decision-making.",
  "Aries-Leo":
    "Mars-Sun creates a magnificently powerful and regal combination. The warrior planet meets the king of the solar system, resulting in natural leadership and incredible confidence.",
  "Aries-Libra":
    "Mars-Venus creates a classic attraction of opposites, with the warrior planet meeting the goddess of love. Aries' direct Mars energy is softened and refined by Libra's harmonious Venus.",
  "Aries-Pisces":
    "Mars-Neptune creates a dreamy yet dynamic combination where action meets imagination. Aries' warrior energy is spiritualized and softened by Pisces' mystical Neptune.",
  "Aries-Sagittarius":
    "Mars-Jupiter creates an expansive and adventurous planetary combination. The warrior planet meets the great benefic, resulting in optimism, courage, and the drive to explore new frontiers.",
  "Aries-Scorpio":
    "Mars-Pluto creates an intensely powerful and transformative combination. Traditional Mars meets its higher octave in Pluto, resulting in incredible depth and passion.",
  "Aries-Taurus":
    "Mars-Venus creates a fundamental attraction between the masculine and feminine principles of the zodiac. Aries' quick Mars energy meets Taurus' steady Venus.",
  "Aries-Virgo":
    "Mars-Mercury creates a dynamic combination of action and analysis. Aries' warrior energy meets Virgo's analytical mind, resulting in the ability to think quickly and act strategically.",

  // Cancer planetary influences
  "Cancer-Cancer":
    "The double Moon influence creates an intensely emotional and nurturing dynamic. Both partners are driven by lunar cycles, leading to deep empathy, intuitive understanding, and protective instincts.",
  "Cancer-Capricorn":
    "Moon-Saturn creates a powerful but challenging planetary combination. Cancer's Moon represents emotion and nurturing, while Capricorn's Saturn embodies structure and responsibility, creating complementary opposites.",
  "Cancer-Gemini":
    "Moon-Mercury creates a blend of emotion and communication. Cancer's intuitive Moon combines with Gemini's quick Mercury to create empathetic understanding and caring conversation.",
  "Cancer-Leo":
    "Moon-Sun creates a fundamental cosmic balance between the feminine and masculine principles. Cancer's nurturing Moon perfectly complements Leo's radiant Sun energy.",
  "Cancer-Libra":
    "Moon-Venus creates a harmonious combination of emotion and beauty. Cancer's protective Moon meets Libra's loving Venus, resulting in romantic, caring partnerships focused on harmony.",
  "Cancer-Pisces":
    "Moon-Neptune creates a mystical, deeply emotional combination. Cancer's nurturing Moon meets Pisces' spiritual Neptune, resulting in profound intuitive and psychic connection.",
  "Cancer-Sagittarius":
    "Moon-Jupiter creates an emotionally expansive combination. Cancer's protective Moon meets Sagittarius' optimistic Jupiter, blending nurturing care with philosophical growth.",
  "Cancer-Scorpio":
    "Moon-Pluto creates an intensely transformative emotional combination. Cancer's nurturing Moon meets Scorpio's transformative Pluto, resulting in deep psychological healing and rebirth.",
  "Cancer-Taurus":
    "Moon-Venus creates a beautifully harmonious combination of emotion and sensuality. Cancer's protective Moon perfectly aligns with Taurus' loving Venus for stable, nurturing love.",
  "Cancer-Virgo":
    "Moon-Mercury creates a caring, analytical combination. Cancer's intuitive Moon meets Virgo's practical Mercury, resulting in thoughtful service and emotional intelligence.",

  // Gemini planetary influences
  "Gemini-Cancer":
    "Mercury-Moon creates a combination of mind and emotion. Gemini's quick Mercury meets Cancer's intuitive Moon, blending intellectual curiosity with emotional understanding.",
  "Gemini-Capricorn":
    "Mercury-Saturn creates a disciplined mental combination. Gemini's versatile Mercury meets Capricorn's structured Saturn, resulting in focused thinking and practical communication.",
  "Gemini-Gemini":
    "The double Mercury influence creates rapid mental agility and constant communication. Both partners are driven by the messenger planet, leading to endless conversation and intellectual stimulation.",
  "Gemini-Leo":
    "Mercury-Sun creates a brilliant combination of mind and self-expression. Gemini's quick Mercury perfectly complements Leo's radiant Sun for charismatic communication and creative thinking.",
  "Gemini-Libra":
    "Mercury-Venus creates an elegant combination of mind and beauty. Gemini's intellectual Mercury meets Libra's harmonious Venus, resulting in diplomatic communication and aesthetic appreciation.",
  "Gemini-Pisces":
    "Mercury-Neptune creates a mystical mental combination. Gemini's rational Mercury meets Pisces' intuitive Neptune, blending logic with imagination and spiritual insight.",
  "Gemini-Sagittarius":
    "Mercury-Jupiter creates an expansive intellectual combination. Gemini's quick Mercury meets Sagittarius' philosophical Jupiter, resulting in broad thinking and educational adventures.",
  "Gemini-Scorpio":
    "Mercury-Pluto creates an intensely investigative mental combination. Gemini's curious Mercury meets Scorpio's transformative Pluto, resulting in deep psychological research and powerful communication.",
  "Gemini-Taurus":
    "Mercury-Venus creates a practical yet beautiful mental combination. Gemini's versatile Mercury meets Taurus' steady Venus, blending quick thinking with aesthetic appreciation.",
  "Gemini-Virgo":
    "The double Mercury influence creates analytical precision and detailed communication. Both partners are ruled by Mercury, leading to practical thinking and methodical problem-solving.",

  // Leo planetary influences
  "Leo-Cancer":
    "Sun-Moon creates the fundamental cosmic balance of masculine and feminine, day and night. Leo's radiant Sun perfectly complements Cancer's nurturing Moon in this classic astrological pairing.",
  "Leo-Capricorn":
    "Sun-Saturn creates a powerful combination of leadership and structure. Leo's confident Sun meets Capricorn's disciplined Saturn, resulting in authoritative leadership and long-term success.",
  "Leo-Gemini":
    "Sun-Mercury creates a brilliant combination of self-expression and communication. Leo's dramatic Sun meets Gemini's quick Mercury, resulting in charismatic speaking and creative thinking.",
  "Leo-Leo":
    "The double Sun influence creates magnificent but potentially competitive energy. Both partners are ruled by the Sun, leading to dramatic self-expression and the need for individual recognition.",
  "Leo-Libra":
    "Sun-Venus creates a beautiful combination of self-expression and harmony. Leo's confident Sun meets Libra's loving Venus, resulting in romantic creativity and aesthetic appreciation.",
  "Leo-Pisces":
    "Sun-Neptune creates a mystical combination of ego and transcendence. Leo's radiant Sun meets Pisces' spiritual Neptune, blending dramatic self-expression with compassionate service.",
  "Leo-Sagittarius":
    "Sun-Jupiter creates an expansive, optimistic combination. Leo's confident Sun meets Sagittarius' philosophical Jupiter, resulting in generous leadership and adventurous self-expression.",
  "Leo-Scorpio":
    "Sun-Pluto creates an intensely powerful combination of ego and transformation. Leo's radiant Sun meets Scorpio's transformative Pluto, resulting in dramatic personal evolution.",
  "Leo-Taurus":
    "Sun-Venus creates a luxurious combination of self-expression and beauty. Leo's dramatic Sun meets Taurus' sensual Venus, resulting in appreciation for life's finest pleasures.",
  "Leo-Virgo":
    "Sun-Mercury creates a precise combination of self-expression and analysis. Leo's confident Sun meets Virgo's practical Mercury, resulting in thoughtful leadership and detailed creativity.",

  // Libra planetary influences
  "Libra-Cancer":
    "Venus-Moon creates a beautifully harmonious combination of love and nurturing. Libra's diplomatic Venus meets Cancer's protective Moon, resulting in caring, romantic partnerships.",
  "Libra-Capricorn":
    "Venus-Saturn creates a mature, structured approach to love and beauty. Libra's harmonious Venus meets Capricorn's disciplined Saturn, resulting in long-lasting, committed relationships.",
  "Libra-Gemini":
    "Venus-Mercury creates an elegant combination of love and communication. Libra's harmonious Venus meets Gemini's quick Mercury, resulting in charming conversation and intellectual romance.",
  "Libra-Leo":
    "Venus-Sun creates a magnificent combination of love and self-expression. Libra's diplomatic Venus meets Leo's radiant Sun, resulting in romantic creativity and mutual admiration.",
  "Libra-Libra":
    "The double Venus influence creates exquisite beauty and harmony, but potential indecision. Both partners are ruled by Venus, leading to refined aesthetics and balanced relationships.",
  "Libra-Pisces":
    "Venus-Neptune creates a dreamy, romantic combination of love and spirituality. Libra's harmonious Venus meets Pisces' mystical Neptune, resulting in idealistic, compassionate partnerships.",
  "Libra-Sagittarius":
    "Venus-Jupiter creates an optimistic, expansive approach to love and beauty. Libra's diplomatic Venus meets Sagittarius' philosophical Jupiter, resulting in culturally rich, adventurous relationships.",
  "Libra-Scorpio":
    "Venus-Pluto creates an intensely transformative approach to love and beauty. Libra's harmonious Venus meets Scorpio's powerful Pluto, resulting in deep, passionate relationships.",
  "Libra-Taurus":
    "The double Venus influence creates maximum beauty, sensuality, and appreciation for life's pleasures. Both partners are ruled by Venus, leading to luxurious, aesthetically pleasing partnerships.",
  "Libra-Virgo":
    "Venus-Mercury creates a thoughtful, refined combination of love and analysis. Libra's harmonious Venus meets Virgo's practical Mercury, resulting in caring, detailed attention to relationships.",

  // Pisces planetary influences
  "Pisces-Cancer":
    "Neptune-Moon creates a deeply emotional, intuitive combination. Pisces' mystical Neptune meets Cancer's nurturing Moon, resulting in psychic connection and spiritual nurturing.",
  "Pisces-Capricorn":
    "Neptune-Saturn creates a grounding combination of dreams and reality. Pisces' ethereal Neptune meets Capricorn's practical Saturn, resulting in structured spirituality and materialized dreams.",
  "Pisces-Gemini":
    "Neptune-Mercury creates a mystical mental combination. Pisces' intuitive Neptune meets Gemini's rational Mercury, blending imagination with communication and spiritual understanding.",
  "Pisces-Leo":
    "Neptune-Sun creates a combination of ego dissolution and self-expression. Pisces' mystical Neptune meets Leo's radiant Sun, resulting in compassionate leadership and spiritual creativity.",
  "Pisces-Libra":
    "Neptune-Venus creates an idealistic, romantic combination. Pisces' spiritual Neptune meets Libra's harmonious Venus, resulting in dreamy, aesthetically beautiful relationships.",
  "Pisces-Pisces":
    "The double Neptune influence creates maximum intuition, spirituality, and emotional sensitivity. Both partners are ruled by Neptune, leading to psychic connection but potential confusion.",
  "Pisces-Sagittarius":
    "Neptune-Jupiter creates an expansive, spiritual combination. Pisces' mystical Neptune meets Sagittarius' philosophical Jupiter, resulting in religious or spiritual exploration and growth.",
  "Pisces-Scorpio":
    "Neptune-Pluto creates the most transformative, spiritual combination in astrology. Pisces' mystical Neptune meets Scorpio's powerful Pluto, resulting in profound spiritual transformation.",
  "Pisces-Taurus":
    "Neptune-Venus creates a beautifully romantic, sensual combination. Pisces' spiritual Neptune meets Taurus' loving Venus, resulting in grounded spirituality and practical compassion.",
  "Pisces-Virgo":
    "Neptune-Mercury creates a combination of intuition and analysis. Pisces' mystical Neptune meets Virgo's practical Mercury, resulting in spiritual service and intuitive problem-solving.",

  // Sagittarius planetary influences
  "Sagittarius-Cancer":
    "Jupiter-Moon creates an emotionally expansive, nurturing combination. Sagittarius' optimistic Jupiter meets Cancer's protective Moon, resulting in generous care and philosophical nurturing.",
  "Sagittarius-Capricorn":
    "Jupiter-Saturn creates a balanced combination of expansion and structure. Sagittarius' optimistic Jupiter meets Capricorn's disciplined Saturn, resulting in practical wisdom and structured growth.",
  "Sagittarius-Gemini":
    "Jupiter-Mercury creates an intellectually expansive combination. Sagittarius' philosophical Jupiter meets Gemini's quick Mercury, resulting in educational adventures and broad communication.",
  "Sagittarius-Leo":
    "Jupiter-Sun creates a magnificently optimistic, confident combination. Sagittarius' expansive Jupiter meets Leo's radiant Sun, resulting in generous leadership and adventurous self-expression.",
  "Sagittarius-Libra":
    "Jupiter-Venus creates a culturally rich, harmonious combination. Sagittarius' philosophical Jupiter meets Libra's diplomatic Venus, resulting in beautiful, balanced relationships and aesthetic appreciation.",
  "Sagittarius-Pisces":
    "Jupiter-Neptune creates a spiritual, expansive combination. Sagittarius' philosophical Jupiter meets Pisces' mystical Neptune, resulting in religious exploration and compassionate understanding.",
  "Sagittarius-Sagittarius":
    "The double Jupiter influence creates maximum optimism, adventure, and philosophical exploration. Both partners are ruled by Jupiter, leading to constant growth and expansive experiences.",
  "Sagittarius-Scorpio":
    "Jupiter-Pluto creates an intensely transformative, exploratory combination. Sagittarius' optimistic Jupiter meets Scorpio's powerful Pluto, resulting in deep philosophical transformation.",
  "Sagittarius-Taurus":
    "Jupiter-Venus creates an indulgent, pleasure-loving combination. Sagittarius' expansive Jupiter meets Taurus' sensual Venus, resulting in appreciation for life's finest experiences.",
  "Sagittarius-Virgo":
    "Jupiter-Mercury creates a practical, educational combination. Sagittarius' philosophical Jupiter meets Virgo's analytical Mercury, resulting in detailed wisdom and methodical growth.",

  // Scorpio planetary influences
  "Scorpio-Cancer":
    "Pluto-Moon creates an intensely emotional, transformative combination. Scorpio's powerful Pluto meets Cancer's nurturing Moon, resulting in profound emotional healing and protective transformation.",
  "Scorpio-Capricorn":
    "Pluto-Saturn creates a powerfully structured, transformative combination. Scorpio's intense Pluto meets Capricorn's disciplined Saturn, resulting in systematic transformation and controlled power.",
  "Scorpio-Gemini":
    "Pluto-Mercury creates an intensely investigative, transformative mental combination. Scorpio's powerful Pluto meets Gemini's quick Mercury, resulting in deep research and psychological communication.",
  "Scorpio-Leo":
    "Pluto-Sun creates an intensely powerful combination of transformation and self-expression. Scorpio's deep Pluto meets Leo's radiant Sun, resulting in dramatic personal evolution.",
  "Scorpio-Libra":
    "Pluto-Venus creates an intensely transformative approach to love and beauty. Scorpio's powerful Pluto meets Libra's harmonious Venus, resulting in deep, passionate relationships.",
  "Scorpio-Pisces":
    "Pluto-Neptune creates the most spiritually transformative combination in astrology. Scorpio's powerful Pluto meets Pisces' mystical Neptune, resulting in profound spiritual rebirth.",
  "Scorpio-Sagittarius":
    "Pluto-Jupiter creates an intensely expansive, transformative combination. Scorpio's deep Pluto meets Sagittarius' optimistic Jupiter, resulting in philosophical transformation and spiritual growth.",
  "Scorpio-Scorpio":
    "The double Pluto influence creates maximum intensity, transformation, and psychological depth. Both partners are ruled by Pluto, leading to profound mutual transformation.",
  "Scorpio-Taurus":
    "Pluto-Venus creates an intensely passionate, transformative approach to love. Scorpio's powerful Pluto meets Taurus' sensual Venus, resulting in deep, sensual transformation.",
  "Scorpio-Virgo":
    "Pluto-Mercury creates an intensely analytical, transformative mental combination. Scorpio's powerful Pluto meets Virgo's practical Mercury, resulting in deep healing and psychological service.",

  // Taurus planetary influences
  "Taurus-Cancer":
    "Venus-Moon creates a beautifully nurturing, sensual combination. Taurus' loving Venus meets Cancer's protective Moon, resulting in stable, caring relationships and domestic harmony.",
  "Taurus-Capricorn":
    "Venus-Saturn creates a mature, stable approach to love and beauty. Taurus' sensual Venus meets Capricorn's disciplined Saturn, resulting in long-lasting, committed, prosperous relationships.",
  "Taurus-Gemini":
    "Venus-Mercury creates a thoughtful, communicative approach to love. Taurus' steady Venus meets Gemini's quick Mercury, resulting in practical romance and stable communication.",
  "Taurus-Leo":
    "Venus-Sun creates a luxurious, confident combination of love and self-expression. Taurus' sensual Venus meets Leo's radiant Sun, resulting in appreciation for life's finest pleasures.",
  "Taurus-Libra":
    "The double Venus influence creates maximum beauty, harmony, and appreciation for life's pleasures. Both partners are ruled by Venus, leading to aesthetically pleasing, balanced relationships.",
  "Taurus-Pisces":
    "Venus-Neptune creates a romantic, spiritually beautiful combination. Taurus' sensual Venus meets Pisces' mystical Neptune, resulting in grounded spirituality and practical compassion.",
  "Taurus-Sagittarius":
    "Venus-Jupiter creates an indulgent, expansive approach to love and pleasure. Taurus' steady Venus meets Sagittarius' optimistic Jupiter, resulting in generous, adventurous relationships.",
  "Taurus-Scorpio":
    "Venus-Pluto creates an intensely passionate, transformative approach to love. Taurus' sensual Venus meets Scorpio's powerful Pluto, resulting in deep, magnetic attraction.",
  "Taurus-Taurus":
    "The double Venus influence creates maximum sensuality, stability, and appreciation for comfort. Both partners are ruled by Venus, leading to luxurious, harmonious, indulgent partnerships.",
  "Taurus-Virgo":
    "Venus-Mercury creates a practical, caring approach to love and service. Taurus' nurturing Venus meets Virgo's analytical Mercury, resulting in thoughtful, devoted relationships.",

  // Virgo planetary influences
  "Virgo-Cancer":
    "Mercury-Moon creates a caring, analytical combination of mind and emotion. Virgo's practical Mercury meets Cancer's intuitive Moon, resulting in thoughtful nurturing and emotional intelligence.",
  "Virgo-Capricorn":
    "Mercury-Saturn creates a disciplined, practical mental combination. Virgo's analytical Mercury meets Capricorn's structured Saturn, resulting in methodical achievement and detailed planning.",
  "Virgo-Gemini":
    "The double Mercury influence creates maximum mental agility, analysis, and communication. Both partners are ruled by Mercury, leading to detailed conversations and practical problem-solving.",
  "Virgo-Leo":
    "Mercury-Sun creates a precise, confident combination of analysis and self-expression. Virgo's practical Mercury meets Leo's radiant Sun, resulting in thoughtful leadership and detailed creativity.",
  "Virgo-Libra":
    "Mercury-Venus creates a refined, thoughtful approach to communication and beauty. Virgo's analytical Mercury meets Libra's harmonious Venus, resulting in diplomatic service and aesthetic precision.",
  "Virgo-Pisces":
    "Mercury-Neptune creates a combination of practical analysis and intuitive understanding. Virgo's rational Mercury meets Pisces' mystical Neptune, resulting in spiritual service and healing.",
  "Virgo-Sagittarius":
    "Mercury-Jupiter creates an educational, expansive mental combination. Virgo's detailed Mercury meets Sagittarius' philosophical Jupiter, resulting in practical wisdom and methodical growth.",
  "Virgo-Scorpio":
    "Mercury-Pluto creates an intensely analytical, investigative mental combination. Virgo's practical Mercury meets Scorpio's transformative Pluto, resulting in deep healing and psychological service.",
  "Virgo-Taurus":
    "Mercury-Venus creates a practical, caring approach to communication and service. Virgo's analytical Mercury meets Taurus' nurturing Venus, resulting in thoughtful, devoted relationships.",
  "Virgo-Virgo":
    "The double Mercury influence creates maximum analytical precision, attention to detail, and practical service. Both partners are ruled by Mercury, leading to methodical problem-solving.",

  // Capricorn planetary influences
  "Capricorn-Cancer":
    "Saturn-Moon creates a fundamental balance of structure and emotion, authority and nurturing. Capricorn's disciplined Saturn meets Cancer's protective Moon in this classic opposition.",
  "Capricorn-Capricorn":
    "The double Saturn influence creates maximum ambition, discipline, and long-term planning. Both partners are ruled by Saturn, leading to structured achievement and traditional values.",
  "Capricorn-Gemini":
    "Saturn-Mercury creates a disciplined, structured approach to communication and learning. Capricorn's practical Saturn meets Gemini's quick Mercury, resulting in focused thinking and serious communication.",
  "Capricorn-Leo":
    "Saturn-Sun creates a powerful combination of structure and leadership. Capricorn's disciplined Saturn meets Leo's confident Sun, resulting in authoritative leadership and long-term success.",
  "Capricorn-Libra":
    "Saturn-Venus creates a mature, structured approach to love and beauty. Capricorn's practical Saturn meets Libra's harmonious Venus, resulting in committed, balanced, long-lasting relationships.",
  "Capricorn-Pisces":
    "Saturn-Neptune creates a grounding combination of structure and spirituality. Capricorn's practical Saturn meets Pisces' mystical Neptune, resulting in materialized dreams and structured compassion.",
  "Capricorn-Sagittarius":
    "Saturn-Jupiter creates a balanced combination of structure and expansion. Capricorn's disciplined Saturn meets Sagittarius' optimistic Jupiter, resulting in practical wisdom and structured growth.",
  "Capricorn-Scorpio":
    "Saturn-Pluto creates a powerfully transformative, structured combination. Capricorn's disciplined Saturn meets Scorpio's intense Pluto, resulting in systematic transformation and controlled power.",
  "Capricorn-Taurus":
    "Saturn-Venus creates a stable, practical approach to love and material security. Capricorn's structured Saturn meets Taurus' sensual Venus, resulting in prosperous, long-lasting partnerships.",
  "Capricorn-Virgo":
    "Saturn-Mercury creates a disciplined, practical mental combination. Capricorn's structured Saturn meets Virgo's analytical Mercury, resulting in methodical achievement and detailed planning.",
};

export default function ZodiacCompatibility({ user, onLogin }) {
  const [lockedSign, setLockedSign] = useState(user?.zodiacChart?.sun || null);
  const [currentPage, setCurrentPage] = useState("selection");
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [selectedPerspective, setSelectedPerspective] = useState(null);
  const [detailView, setDetailView] = useState(false);
  const [messageInput, setMessageInput] = useState("");

  // Real-time socket connection
  const {
    isConnected,
    isQueuing,
    isMatched,
    matchData,
    messages,
    joinQueue,
    cancelQueue,
    sendMessage,
    disconnect,
  } = useSocket();

  // Helper function to lock in a sign and move to results page
  const lockInSign = (sign) => {
    setLockedSign(sign);
    setCurrentPage("results");
  };

  // Helper function to go back to sign selection
  const goBackToSelection = () => {
    setLockedSign(null);
    setSelectedPartner(null);
    setSelectedPerspective(null);
    setDetailView(false);
    setCurrentPage("selection");
    setMessageInput("");
    disconnect(); // Disconnect from socket and reset chat state
  };

  // Generate random user data
  const generateRandomUser = () => {
    const names = [
      "Alex",
      "Jordan",
      "Casey",
      "Taylor",
      "Morgan",
      "Riley",
      "Jamie",
      "Avery",
      "Quinn",
      "Sage",
    ];
    const randomSign = signs[Math.floor(Math.random() * signs.length)];
    const randomName = names[Math.floor(Math.random() * names.length)];

    return {
      name: randomName,
      sign: randomSign,
      age: Math.floor(Math.random() * 15) + 20, // Age between 20-35
    };
  };

  // Queue up/cancel function - toggles between joining and cancelling queue
  const handleQueueUp = async () => {
    if (!user) {
      onLogin?.();
      return;
    }

    if (isQueuing) {
      // If already queuing, cancel it
      cancelQueue();
    } else {
      // If not queuing, join the queue
      if (!isConnected) {
        console.log("Not connected to server, attempting to connect...");
      }

      const userData = {
        sign: user.zodiacChart.sun,
        moon: user.zodiacChart.moon,
        rising: user.zodiacChart.rising,
        name: user.username,
      };

      joinQueue(userData);
    }
  };

  // Helper function to go back to main results
  const goBackToResults = () => {
    setSelectedPartner(null);
    setSelectedPerspective(null);
    setDetailView(false);
  };

  // Helper function to show detailed compatibility
  const showDetailedCompatibility = (partner, perspective) => {
    setSelectedPartner(partner);
    setSelectedPerspective(perspective);
    setDetailView(true);
  };

  // Get compatibility key for data lookup
  const getCompatibilityKey = (sign1, sign2) => {
    return `${sign1}-${sign2}`;
  };

  // Helper function to get compatibility content with fallback
  const getCompatibilityContent = (sign1, sign2, dataSource) => {
    const key1 = `${sign1}-${sign2}`;
    const key2 = `${sign2}-${sign1}`;

    const result = dataSource[key1] || dataSource[key2];

    if (result) {
      return result;
    }

    // Enhanced fallback message that's more informative
    return `Detailed compatibility analysis for ${sign1} and ${sign2} is currently being developed. Our astrology team is working to provide comprehensive insights for this combination. Please check back soon or try selecting Aquarius or Aries for complete compatibility data.`;
  };

  // Sign Selection Page
  const renderSelectionPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Zodiac Compatibility
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-purple-200 px-4">
            Select your zodiac sign to discover your cosmic connections
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
        >
          {signs.map((sign, index) => (
            <motion.button
              key={sign}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(168, 85, 247, 0.4)",
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => lockInSign(sign)}
              className="bg-gradient-to-br from-purple-600 to-pink-600 p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl text-center hover:from-purple-500 hover:to-pink-500 transition-all duration-300 border border-purple-400/30 min-h-[80px] sm:min-h-[100px] md:min-h-[120px] flex flex-col justify-center items-center"
            >
              <div className="text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2 md:mb-3">
                {zodiacSymbols[sign]}
              </div>
              <div className="text-sm sm:text-base md:text-lg font-semibold">
                {sign}
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );

  // Results Page
  const renderResultsPage = () => {
    // Use the new scoring system to categorize all signs
    const signData = categorizeCompatibility(lockedSign);

    // If in detail view, show detailed compatibility
    if (detailView && selectedPartner && selectedPerspective) {
      return renderDetailedCompatibility();
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-4 sm:p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header with back button */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 gap-4"
          >
            <button
              onClick={goBackToSelection}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
            >
              <span>←</span>
              <span>Back to Selection</span>
            </button>
            <div className="text-center flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                {zodiacSymbols[lockedSign]} {lockedSign} Compatibility
              </h1>
            </div>
            <div className="hidden sm:block sm:w-32"></div>{" "}
            {/* Spacer for centering on larger screens */}
          </motion.div>

          {/* Compatibility Results */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
          >
            {/* BEST Matches */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-green-600 to-emerald-600 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-green-400/30"
            >
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-center">
                ✨ BEST MATCHES (85-100%)
              </h2>
              <div className="space-y-2 sm:space-y-3">
                {signData.best.map((sign, index) => (
                  <motion.div
                    key={sign}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="bg-white/10 p-2 sm:p-3 rounded-lg"
                  >
                    <div className="flex items-center justify-between flex-wrap sm:flex-nowrap gap-2">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <span className="text-xl sm:text-2xl flex-shrink-0">
                          {zodiacSymbols[sign]}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm sm:text-base md:text-lg font-semibold truncate">
                            {sign}
                          </span>
                          <span className="text-xs sm:text-sm text-green-200">
                            {compatibilityScores[lockedSign][sign]}% match
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
                        <button
                          onClick={() =>
                            showDetailedCompatibility(sign, "male")
                          }
                          className="text-blue-300 hover:text-blue-100 text-lg sm:text-xl transition-colors p-1 rounded hover:bg-white/10"
                          title="Male Perspective"
                        >
                          ♂
                        </button>
                        <button
                          onClick={() =>
                            showDetailedCompatibility(sign, "female")
                          }
                          className="text-pink-300 hover:text-pink-100 text-lg sm:text-xl transition-colors p-1 rounded hover:bg-white/10"
                          title="Female Perspective"
                        >
                          ♀
                        </button>
                        <button
                          onClick={() =>
                            showDetailedCompatibility(sign, "planetary")
                          }
                          className="text-yellow-300 hover:text-yellow-100 text-lg sm:text-xl transition-colors p-1 rounded hover:bg-white/10"
                          title="Planetary Influences"
                        >
                          ⭐
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* GOOD Matches */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-yellow-600 to-orange-600 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-yellow-400/30"
            >
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-center">
                🌟 GOOD MATCHES (65-84%)
              </h2>
              <div className="space-y-2 sm:space-y-3">
                {signData.good.map((sign, index) => (
                  <motion.div
                    key={sign}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="bg-white/10 p-2 sm:p-3 rounded-lg"
                  >
                    <div className="flex items-center justify-between flex-wrap sm:flex-nowrap gap-2">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <span className="text-xl sm:text-2xl flex-shrink-0">
                          {zodiacSymbols[sign]}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm sm:text-base md:text-lg font-semibold truncate">
                            {sign}
                          </span>
                          <span className="text-xs sm:text-sm text-yellow-200">
                            {compatibilityScores[lockedSign][sign]}% match
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
                        <button
                          onClick={() =>
                            showDetailedCompatibility(sign, "male")
                          }
                          className="text-blue-300 hover:text-blue-100 text-xl transition-colors"
                          title="Male Perspective"
                        >
                          ♂
                        </button>
                        <button
                          onClick={() =>
                            showDetailedCompatibility(sign, "female")
                          }
                          className="text-pink-300 hover:text-pink-100 text-xl transition-colors"
                          title="Female Perspective"
                        >
                          ♀
                        </button>
                        <button
                          onClick={() =>
                            showDetailedCompatibility(sign, "planetary")
                          }
                          className="text-yellow-300 hover:text-yellow-100 text-xl transition-colors"
                          title="Planetary Influences"
                        >
                          ⭐
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* BAD Matches */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-red-600 to-pink-600 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-red-400/30"
            >
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-center">
                💔 BAD MATCHES (&lt;65%)
              </h2>
              <div className="space-y-2 sm:space-y-3">
                {signData.bad.map((sign, index) => (
                  <motion.div
                    key={sign}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="bg-white/10 p-2 sm:p-3 rounded-lg"
                  >
                    <div className="flex items-center justify-between flex-wrap sm:flex-nowrap gap-2">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <span className="text-xl sm:text-2xl flex-shrink-0">
                          {zodiacSymbols[sign]}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm sm:text-base md:text-lg font-semibold truncate">
                            {sign}
                          </span>
                          <span className="text-xs sm:text-sm text-red-200">
                            {compatibilityScores[lockedSign][sign]}% match
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
                        <button
                          onClick={() =>
                            showDetailedCompatibility(sign, "male")
                          }
                          className="text-blue-300 hover:text-blue-100 text-lg sm:text-xl transition-colors p-1 rounded hover:bg-white/10"
                          title="Male Perspective"
                        >
                          ♂
                        </button>
                        <button
                          onClick={() =>
                            showDetailedCompatibility(sign, "female")
                          }
                          className="text-pink-300 hover:text-pink-100 text-lg sm:text-xl transition-colors p-1 rounded hover:bg-white/10"
                          title="Female Perspective"
                        >
                          ♀
                        </button>
                        <button
                          onClick={() =>
                            showDetailedCompatibility(sign, "planetary")
                          }
                          className="text-yellow-300 hover:text-yellow-100 text-lg sm:text-xl transition-colors p-1 rounded hover:bg-white/10"
                          title="Planetary Influences"
                        >
                          ⭐
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Additional Info */}
          {/* Queue Up Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center"
          >
            <button
              onClick={handleQueueUp}
              className={`font-bold py-4 px-8 rounded-xl text-lg sm:text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${
                isQueuing
                  ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  : !user
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  : "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              } text-white`}
            >
              {!user ? (
                <div className="flex items-center space-x-2">
                  <span>🔮</span>
                  <span>SIGN IN TO CHAT</span>
                  <span>🔮</span>
                </div>
              ) : isQueuing ? (
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Finding match... Click to CANCEL</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>💫</span>
                  <span>QUEUE UP</span>
                  <span>💫</span>
                </div>
              )}
            </button>
            <p className="text-purple-200 text-sm mt-3">
              {!user
                ? "Create your profile to connect with compatible souls!"
                : "Connect with someone who shares your zodiac energy!"}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-6 sm:mt-8 text-center px-4"
          >
            <p className="text-purple-200 text-sm sm:text-base md:text-lg">
              Click the symbols (♂ ♀ ⭐) next to each sign for detailed
              compatibility insights!
            </p>
            <p className="text-purple-300 text-xs sm:text-sm mt-2">
              Remember, astrology is just one perspective on compatibility. Real
              relationships are built on understanding, communication, and
              mutual respect! ✨
            </p>
          </motion.div>
        </div>
      </div>
    );
  };

  // Chat Interface
  const renderChatInterface = () => {
    const handleSendMessage = () => {
      if (messageInput.trim() && isMatched) {
        sendMessage(messageInput.trim());
        setMessageInput("");
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Chat Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm"
          >
            <button
              onClick={goBackToSelection}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg transition-colors text-sm w-full sm:w-auto justify-center sm:justify-start"
            >
              <span>←</span>
              <span>Back to Compatibility</span>
            </button>

            <div className="text-center flex-1">
              <h1 className="text-xl sm:text-2xl font-bold">
                💬 Chatting with {matchData?.partner?.name || "Partner"}
              </h1>
              <p className="text-sm text-purple-200">
                {matchData?.partner?.sign &&
                  zodiacSymbols[matchData.partner.sign]}{" "}
                {matchData?.partner?.sign || "Unknown"} • Real person!
              </p>
            </div>

            <div className="hidden sm:block sm:w-32"></div>
          </motion.div>

          {/* Chat Messages */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 rounded-xl p-4 mb-4 h-96 overflow-y-auto space-y-3"
          >
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${
                  message.type === "user"
                    ? "justify-end"
                    : message.type === "system"
                    ? "justify-center"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs sm:max-w-md p-3 rounded-lg ${
                    message.type === "user"
                      ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                      : message.type === "system"
                      ? "bg-yellow-500/20 text-yellow-200 text-center text-sm"
                      : "bg-white/10 text-white"
                  }`}
                >
                  <p className="text-sm sm:text-base">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Message Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200"
            >
              Send
            </button>
          </motion.div>
        </div>
      </div>
    );
  };

  // Detailed Compatibility View
  const renderDetailedCompatibility = () => {
    let content = "";
    let perspectiveTitle = "";
    let perspectiveIcon = "";
    let perspectiveColor = "";

    // Get content based on perspective using the helper function
    if (selectedPerspective === "male") {
      content = getCompatibilityContent(
        lockedSign,
        selectedPartner,
        maleCompatibilityData
      );
      perspectiveTitle = "Male Perspective";
      perspectiveIcon = "♂";
      perspectiveColor = "from-blue-600 to-cyan-600";
    } else if (selectedPerspective === "female") {
      content = getCompatibilityContent(
        lockedSign,
        selectedPartner,
        femaleCompatibilityData
      );
      perspectiveTitle = "Female Perspective";
      perspectiveIcon = "♀";
      perspectiveColor = "from-pink-600 to-rose-600";
    } else if (selectedPerspective === "planetary") {
      content = getCompatibilityContent(
        lockedSign,
        selectedPartner,
        planetaryData
      );
      perspectiveTitle = "Planetary Influences";
      perspectiveIcon = "⭐";
      perspectiveColor = "from-yellow-600 to-amber-600";
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with navigation */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 gap-4"
          >
            <button
              onClick={goBackToResults}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
            >
              <span>←</span>
              <span>Back to Results</span>
            </button>

            <div className="text-center flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                {zodiacSymbols[lockedSign]} {lockedSign} +{" "}
                {zodiacSymbols[selectedPartner]} {selectedPartner}
              </h1>
            </div>

            <button
              onClick={goBackToSelection}
              className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-500 px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm w-full sm:w-auto justify-center sm:justify-start"
            >
              <span>↩</span>
              <span className="hidden sm:inline">Start Over</span>
              <span className="sm:hidden">Reset</span>
            </button>
          </motion.div>

          {/* Perspective Header */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`bg-gradient-to-r ${perspectiveColor} p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl mb-6 sm:mb-8 text-center border border-white/20`}
          >
            <div className="text-2xl sm:text-3xl md:text-4xl mb-2">
              {perspectiveIcon}
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold">
              {perspectiveTitle}
            </h2>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-purple-400/30"
          >
            <p className="text-sm sm:text-base md:text-lg leading-relaxed text-purple-100">
              {content}
            </p>
          </motion.div>

          {/* Alternative Perspectives */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6 sm:mt-8 text-center"
          >
            <p className="text-purple-200 mb-3 sm:mb-4 text-sm sm:text-base">
              Explore other perspectives:
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
              {selectedPerspective !== "male" && (
                <button
                  onClick={() =>
                    showDetailedCompatibility(selectedPartner, "male")
                  }
                  className="bg-blue-600 hover:bg-blue-500 px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base w-full sm:w-auto"
                >
                  <span>♂</span>
                  <span>Male View</span>
                </button>
              )}
              {selectedPerspective !== "female" && (
                <button
                  onClick={() =>
                    showDetailedCompatibility(selectedPartner, "female")
                  }
                  className="bg-pink-600 hover:bg-pink-500 px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base w-full sm:w-auto"
                >
                  <span>♀</span>
                  <span>Female View</span>
                </button>
              )}
              {selectedPerspective !== "planetary" && (
                <button
                  onClick={() =>
                    showDetailedCompatibility(selectedPartner, "planetary")
                  }
                  className="bg-yellow-600 hover:bg-yellow-500 px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base w-full sm:w-auto"
                >
                  <span>⭐</span>
                  <span>Planetary</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {isMatched ? (
        <motion.div
          key="chat"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderChatInterface()}
        </motion.div>
      ) : currentPage === "selection" ? (
        <motion.div
          key="selection"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderSelectionPage()}
        </motion.div>
      ) : (
        <motion.div
          key="results"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderResultsPage()}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
