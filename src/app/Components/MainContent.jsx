import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import ZodiacCompatibility from "../Components/Features/ZodiacCompatibility";
import Notes from "../Components/Features/Notes";
import MysticElements from "../Components/Features/MysticElements";
import Friends from "../Components/Features/Friends";
import UserProfile from "../Components/UserProfile";
import ChatSidebar from "../Components/ChatSidebar";
import { useSocket } from "../contexts/SocketContext";

// EmojiPicker accesses browser APIs at module-init time; disable SSR to prevent
// ReferenceError during static generation.
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

// Zodiac symbols mapping (needed for chat interface)
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

// Swiper configuration for character carousel

// Notable traits for each zodiac sign - Full character pool (15 characters each)
const zodiacTraits = {
  Aries: [
    "Annie Leonhart",
    "Eren Yeager",
    "Hidan",
    "Katsuki Bakugo",
    "Natsu Dragneel",
    "Edward Elric",
    "Lady Gaga",
    "Robert Downey Jr.",
    "Emma Watson",
    "Elton John",
    "Mariah Carey",
    "Jackie Chan",
    "Vincent van Gogh",
    "Leonardo da Vinci",
    "Maya Angelou",
  ],
  Taurus: [
    "Choji Akimichi",
    "Deidara",
    "Kankuro",
    "Tanjiro Kamado",
    "Momo Yaoyorozu",
    "Bulma",
    "Dwayne Johnson",
    "Adele",
    "George Clooney",
    "Queen Elizabeth II",
    "Mark Zuckerberg",
    "Audrey Hepburn",
    "William Shakespeare",
    "Salvador Dalí",
    "Barbra Streisand",
  ],
  Gemini: [
    "Itachi Uchiha",
    "Ymir",
    "Karin Uzumaki",
    "Zenitsu Agatsuma",
    "Denki Kaminari",
    "Kuroko Tetsuya",
    "Johnny Depp",
    "Angelina Jolie",
    "Kanye West",
    "Donald Trump",
    "Marilyn Monroe",
    "Bob Dylan",
    "John F. Kennedy",
    "Walt Whitman",
    "Paul McCartney",
  ],
  Cancer: [
    "Neji Hyuga",
    "Kushina Uzumaki",
    "Madara Uchiha",
    "Nezuko Kamado",
    "Izuku Midoriya",
    "Hinata Hyuga",
    "Tom Hanks",
    "Selena Gomez",
    "Robin Williams",
    "Princess Diana",
    "Ernest Hemingway",
    "Frida Kahlo",
    "Nelson Mandela",
    "Julius Caesar",
    "Meryl Streep",
  ],
  Leo: [
    "Sasuke Uchiha",
    "Historia Reiss",
    "Fugaku Uchiha",
    "Kyojuro Rengoku",
    "All Might",
    "Vegeta",
    "Jennifer Lopez",
    "Barack Obama",
    "Madonna",
    "Arnold Schwarzenegger",
    "Whitney Houston",
    "Andy Warhol",
    "Napoleon Bonaparte",
    "Alfred Hitchcock",
    "Mick Jagger",
  ],
  Virgo: [
    "Hange Zoë",
    "Kakashi Hatake",
    "Shikamaru Nara",
    "Giyu Tomioka",
    "Tenya Iida",
    "Senku Ishigami",
    "Beyoncé",
    "Michael Jackson",
    "Keanu Reeves",
    "Mother Teresa",
    "Warren Buffett",
    "Stephen King",
    "Agatha Christie",
    "Freddie Mercury",
    "Amy Poehler",
  ],
  Libra: [
    "Ino Yamanaka",
    "Naruto Uzumaki",
    "Mikoto Uchiha",
    "Inosuke Hashibira",
    "Ochaco Uraraka",
    "Light Yagami",
    "Will Smith",
    "Kim Kardashian",
    "Hugh Jackman",
    "John Lennon",
    "Gwyneth Paltrow",
    "Bruno Mars",
    "Mahatma Gandhi",
    "Oscar Wilde",
    "Margaret Thatcher",
  ],
  Scorpio: [
    "L Lawliet",
    "Armin Arlert",
    "Yagura Karatachi",
    "Muichiro Tokito",
    "Shoto Todoroki",
    "Sasuke Uchiha",
    "Ryan Reynolds",
    "Emma Stone",
    "Leonardo DiCaprio",
    "Bill Gates",
    "Hillary Clinton",
    "Pablo Picasso",
    "Marie Curie",
    "Theodore Roosevelt",
    "Katy Perry",
  ],
  Sagittarius: [
    "Zabuza Momochi",
    "Mikoto Uchiha",
    "Mello",
    "Mitsuri Kanroji",
    "Katsuki Bakugo",
    "Monkey D. Luffy",
    "Taylor Swift",
    "Brad Pitt",
    "Miley Cyrus",
    "Winston Churchill",
    "Walt Disney",
    "Frank Sinatra",
    "Ludwig van Beethoven",
    "Jane Austen",
    "Jim Morrison",
  ],
  Capricorn: [
    "Levi Ackerman",
    "Misa Amane",
    "Gaara",
    "Obanai Iguro",
    "Fumikage Tokoyami",
    "Sasori",
    "Denzel Washington",
    "Michelle Obama",
    "Kate Middleton",
    "Martin Luther King Jr.",
    "David Bowie",
    "Elvis Presley",
    "Isaac Newton",
    "Stephen Hawking",
    "Dolly Parton",
  ],
  Aquarius: [
    "Mikasa Ackerman",
    "Obito Uchiha",
    "Konohamaru Sarutobi",
    "Sanemi Shinazugawa",
    "Katsuki Bakugo",
    "Killua Zoldyck",
    "Oprah Winfrey",
    "Jennifer Aniston",
    "The Weeknd",
    "Abraham Lincoln",
    "Ronald Reagan",
    "Bob Marley",
    "Thomas Edison",
    "Charles Darwin",
    "Ellen DeGeneres",
  ],
  Pisces: [
    "Light Yagami",
    "Rin Nohara",
    "Isaribi",
    "Shinobu Kocho",
    "Tamaki Amajiki",
    "Gon Freecss",
    "Rihanna",
    "Justin Bieber",
    "Drew Barrymore",
    "Albert Einstein",
    "Steve Jobs",
    "Kurt Cobain",
    "Michelangelo",
    "Elizabeth Taylor",
    "Daniel Craig",
  ],
};

// Function to get all characters for a zodiac sign (for carousel navigation)
const getAllCharacters = (sign) => {
  return zodiacTraits[sign] || [];
};

// Function to randomly select 3 characters from a zodiac sign (for display)
const getRandomCharacters = (sign) => {
  const characters = zodiacTraits[sign] || [];
  const shuffled = [...characters].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
};

export default function MainContent({ active, user, onLogin, setActive }) {
  const {
    isQueuing,
    joinQueue,
    cancelQueue,
    isConnected,
    isMatched,
    matchData,
    messages,
    sendMessage,
    partnerDisconnected,
    chatClosed,
    startNewMatch,
    closeChat,
    reopenChat,
  } = useSocket();
  const [messageInput, setMessageInput] = useState("");
  const [usedQuotes, setUsedQuotes] = useState({});

  // Mobile chat sidebar toggle state
  const [showChatSidebar, setShowChatSidebar] = useState(false);

  // Character panel toggle state
  const [showCharacterPanel, setShowCharacterPanel] = useState(false);

  // Chat preservation state
  const [showChatNotification, setShowChatNotification] = useState(false);

  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);

  // Chat scroll state
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const chatContainerRef = useRef(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);

  // Quote modal state
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [availableQuotes, setAvailableQuotes] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState("");

  // Match found modal state – initialized to safe server-side defaults; hydrated
  // from localStorage in a useEffect below (localStorage is client-only).
  const [showMatchFoundModal, setShowMatchFoundModal] = useState(false);
  const [hasShownMatchModal, setHasShownMatchModal] = useState(false);
  const [currentMatchId, setCurrentMatchId] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Hydrate localStorage-backed state on mount (client-only).
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dreamweaver-match-state");
      if (saved) {
        const savedData = JSON.parse(saved);
        setHasShownMatchModal(savedData?.isMatched || false);
        setCurrentMatchId(savedData?.matchData?.matchId || null);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Get characters for the current user's zodiac sign
  const allCharacters = getAllCharacters(user?.zodiacChart?.sun) || [];

  // Force navigation to chat only when match modal should be shown (new match)
  useEffect(() => {
    if (
      isMatched &&
      matchData &&
      !chatClosed &&
      showMatchFoundModal &&
      active !== "chat"
    ) {
      console.log("New match found, navigating to chat");
      setActive("chat");
    }
  }, [
    isMatched,
    matchData,
    chatClosed,
    showMatchFoundModal,
    setActive,
    active,
  ]);

  // Show chat notification when there's an active chat but user is on different section
  useEffect(() => {
    const hasActiveChat =
      isMatched && matchData && !chatClosed && !partnerDisconnected;
    const isOnChatSection = active === "chat";

    // Only show notification if there's an active chat AND user is not on chat section
    // AND the notification hasn't been manually dismissed
    if (hasActiveChat && !isOnChatSection) {
      setShowChatNotification(true);
    } else {
      setShowChatNotification(false);
    }
  }, [isMatched, matchData, chatClosed, partnerDisconnected, active]);

  // Set initial load flag to false after first render
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 100); // Small delay to let socket context initialize
    return () => clearTimeout(timer);
  }, []);

  // Show match found modal when a new match is found (only once per match)
  useEffect(() => {
    // Check if this is a completely new match
    const newMatchId = matchData?.matchId;

    console.log("Match modal useEffect triggered:", {
      isMatched,
      hasMatchData: !!matchData,
      chatClosed,
      newMatchId,
      currentMatchId,
      hasShownMatchModal,
      isInitialLoad,
      shouldShow:
        isMatched &&
        matchData &&
        !chatClosed &&
        newMatchId !== currentMatchId &&
        newMatchId !== null &&
        !isInitialLoad,
    });

    // Only show modal for genuinely new matches that we haven't seen before
    // Skip if this is the initial load (app restart with restored data)
    if (
      isMatched &&
      matchData &&
      !chatClosed &&
      newMatchId !== currentMatchId &&
      newMatchId !== null && // Ensure we have a valid match ID
      !hasShownMatchModal && // Double-check we haven't shown it yet
      !isInitialLoad // Don't show on app restart
    ) {
      console.log("Showing match found modal for new match:", newMatchId);
      setCurrentMatchId(newMatchId);
      setHasShownMatchModal(true); // Mark that we've shown the modal for this match
      setShowMatchFoundModal(true);
    }
  }, [
    isMatched,
    matchData,
    chatClosed,
    currentMatchId,
    hasShownMatchModal,
    isInitialLoad,
  ]);

  // Reset modal flag when starting a new match or when match data changes
  useEffect(() => {
    if (!isMatched || !matchData) {
      setHasShownMatchModal(false);
      setShowMatchFoundModal(false);
      setCurrentMatchId(null);
    }
  }, [isMatched, matchData]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showEmojiPicker]);

  // Handle auto-scroll and new message indicator when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        if (isUserAtBottom) {
          // User was at bottom, auto-scroll to new message
          scrollToBottom();
        } else {
          // User was scrolled up, show new message indicator
          setNewMessageCount((prev) => prev + 1);
          setShowNewMessageIndicator(true);
        }
      }, 100);
    }
  }, [messages.length]);

  // Initial scroll to bottom when chat opens
  useEffect(() => {
    if (active === "chat" && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
        setIsUserAtBottom(true);
      }, 200);
    }
  }, [active, matchData]);

  // Character data for quote functionality (simplified version)
  const characterData = {
    "Annie Leonhart": {
      image:
        "https://static.wikia.nocookie.net/shingekinokyojin/images/9/9c/Annie_Leonhart_%28Anime%29_character_image.png",
      quotes: [
        "I just want to go home.",
        "I'm going to see my father again.",
        "I failed to become a warrior.",
        "The worst part about people is that they're all so selfish.",
        "I don't think I'm a good person.",
        "I'll do whatever it takes to return home.",
        "I can't be the good person everyone wants me to be.",
        "My father is waiting for me.",
        "I've done terrible things to get this far.",
      ],
    },
    "Eren Yeager": {
      image:
        "https://static.wikia.nocookie.net/shingekinokyojin/images/d/d8/Eren_Yeager_%28Anime%29_character_image.png",
      quotes: [
        "I'll kill them all! Every last one of them!",
        "If you win, you live. If you lose, you die. If you don't fight, you can't win!",
        "I'm free.",
        "Because I was born into this world.",
        "Fight! Fight! Fight!",
        "Freedom is what I seek.",
        "I keep moving forward, until my enemies are destroyed.",
        "The only way to truly escape the monsters is to become a monster yourself.",
        "I won't hesitate anymore. No matter what enemies I face, I won't let anyone else die.",
      ],
    },
    // New Aries Characters
    "Katsuki Bakugo": {
      image:
        "https://static.wikia.nocookie.net/bokunoheroacademia/images/7/73/Katsuki_Bakugo_Headshot.png",
      quotes: [
        "I'm gonna be the number one hero!",
        "Die! Die! Die!",
        "Don't underestimate me!",
        "I'm the best!",
        "Get out of my way, extras!",
        "I don't need your help!",
        "I'll surpass All Might!",
        "You're just a stepping stone for me!",
        "I'm all fired up!",
      ],
    },
    "Natsu Dragneel": {
      image:
        "https://static.wikia.nocookie.net/fairytail/images/0/04/Natsu_headshot.png",
      quotes: [
        "I'm all fired up!",
        "We're Fairy Tail!",
        "I'll protect my friends!",
        "Let's go on an adventure!",
        "Fire Dragon Roar!",
        "I never give up!",
        "My flames will burn everything!",
        "Happy! Let's go!",
        "I'm getting motion sick...",
      ],
    },
    "Edward Elric": {
      image:
        "https://static.wikia.nocookie.net/fma/images/7/7c/EdwardElricEp1.png",
      quotes: [
        "Who are you calling a runt?!",
        "Humankind cannot gain anything without first giving something in return.",
        "A lesson without pain is meaningless.",
        "Stand up and walk. Keep moving forward.",
        "To obtain something, something of equal value must be lost.",
        "I'm not short! I'm fun-sized!",
        "Equivalent exchange!",
        "Al, we're going to get our bodies back!",
        "Mankind's greatest scientific discovery may be its ability to communicate!",
      ],
    },
    "Lady Gaga": {
      image: "",
      quotes: [
        "Born this way, baby!",
        "Be yourself, love yourself.",
        "You have to be unique, and different, and shine in your own way.",
        "I want people to walk around delusional about how great they can be.",
        "Poker face!",
        "I live between two worlds: reality and theater.",
        "Art is life, life is art.",
        "Dance in the dark!",
        "Some women choose to follow men, and some choose to follow their dreams.",
      ],
    },
    "Robert Downey Jr.": {
      image: "",
      quotes: [
        "I am Iron Man.",
        "Sometimes you gotta run before you can walk.",
        "Genius, billionaire, playboy, philanthropist.",
        "I love you 3000.",
        "We have a Hulk.",
        "Part of the journey is the end.",
        "The truth is... I am Iron Man.",
        "I can do this all day... wait, that's the other guy.",
        "I am... inevitable. No wait, that's Thanos.",
      ],
    },
    // Default entries for other new characters (can be expanded later)
    "Emma Watson": {
      image: "",
      quotes: [
        "Be yourself.",
        "If not me, who? If not now, when?",
        "Books fall open, you fall in.",
        "Feeling beautiful has nothing to do with what you look like.",
        "It's a wonderful thing to be curious.",
        "I don't want other people to decide who I am.",
        "Both men and women should feel free to be sensitive.",
        "The less you reveal, the more people can wonder.",
        "Young girls are told you have to be the delicate princess.",
      ],
    },
    "Tanjiro Kamado": {
      image: "",
      quotes: [
        "I believe in Nezuko!",
        "I will not let my sister die!",
        "Total Concentration! Water Breathing!",
        "I can smell kindness on you.",
        "I'll never give up!",
        "Nezuko is different from other demons!",
        "I have to become stronger!",
        "Thank you for everything!",
        "Even if you are a demon, I won't let anyone hurt my friends!",
      ],
    },
    "Momo Yaoyorozu": {
      image: "",
      quotes: [
        "I must live up to everyone's expectations!",
        "Creation!",
        "I need to understand the molecular structure first.",
        "I believe in my classmates!",
        "We can do this together!",
        "Knowledge is power!",
        "I won't let my friends down!",
        "Strategic planning is essential!",
        "Everyone has their own strengths!",
      ],
    },
    Bulma: {
      image: "",
      quotes: [
        "I'm a genius!",
        "Vegeta, you're such a fool!",
        "Science will solve everything!",
        "Dragon Ball radar activated!",
        "I invented this myself!",
        "Money can buy anything!",
        "Capsule Corp technology!",
        "I don't have time for this!",
        "Trunks, be careful!",
      ],
    },
    "Zenitsu Agatsuma": {
      image: "",
      quotes: [
        "I want to live a quiet life!",
        "Thunder Breathing, First Form!",
        "Nezuko-chan!",
        "I'm going to die! I'm going to die!",
        "I can only use one form, but I've honed it to perfection!",
        "Don't underestimate me!",
        "Thunderclap and Flash!",
        "I might be a coward, but I'll still fight!",
        "Protect what's important to you!",
      ],
    },
    "Denki Kaminari": {
      image: "",
      quotes: [
        "Electrification!",
        "Wheyyy!",
        "I'm sparking!",
        "Lightning speed!",
        "Don't call me stupid!",
        "Electric shock!",
        "I'm fully charged!",
        "Static electricity!",
        "Short circuit mode activated!",
      ],
    },
    "Kuroko Tetsuya": {
      image: "",
      quotes: [
        "I am a shadow.",
        "The only one who can beat me is me.",
        "Basketball is a team sport.",
        "I will be the shadow that helps the light shine brighter.",
        "Misdirection overflow!",
        "I'm not good at expressing myself.",
        "I believe in my teammates.",
        "Phantom shot!",
        "I'll always support my team from the shadows.",
      ],
    },
    // More simplified entries for celebrities and other characters
    "Johnny Depp": {
      image: "",
      quotes: [
        "The only creatures that are evolved enough to convey pure love are dogs and infants.",
        "I think the thing to do is enjoy the ride while you're on it.",
        "My body is my journal, and my tattoos are my story.",
        "People say I make strange choices, but they're not strange for me.",
        "Just keep moving forward.",
        "We're all damaged in our own way.",
        "The term 'serious actor' is kind of an oxymoron.",
        "I like the challenge of trying different things.",
        "Nobody's perfect.",
      ],
    },
    "Angelina Jolie": {
      image: "",
      quotes: [
        "Be yourself.",
        "Take risks.",
        "Fight for what you believe in.",
        "Family comes first.",
        "Never give up on your dreams.",
        "Help others in need.",
        "Stand up for justice.",
        "Embrace your uniqueness.",
        "Love unconditionally.",
      ],
    },
    "Tom Hanks": {
      image: "",
      quotes: [
        "Life is like a box of chocolates.",
        "There's no crying in baseball!",
        "Houston, we have a problem.",
        "You've got a friend in me.",
        "Keep moving forward.",
        "Be kind to others.",
        "Never lose hope.",
        "Family is everything.",
        "Sometimes life hits you in the head with a brick.",
      ],
    },
    "Jennifer Lopez": {
      image: "",
      quotes: [
        "Let's get loud!",
        "You have to stand up and say there's nothing wrong with me.",
        "I only do what my gut tells me to.",
        "Dream big and work hard.",
        "Age is just a number.",
        "Love yourself.",
        "Never give up.",
        "Be fabulous.",
        "Dance like nobody's watching.",
      ],
    },
    "Barack Obama": {
      image: "",
      quotes: [
        "Yes we can!",
        "Change will not come if we wait for some other person.",
        "The best way to not feel hopeless is to get up and do something.",
        "We are the ones we've been waiting for.",
        "Hope is not blind optimism.",
        "Progress is possible.",
        "Yes we did.",
        "Fired up, ready to go!",
        "We rise by lifting others.",
      ],
    },
    Beyoncé: {
      image: "",
      quotes: [
        "Who run the world? Girls!",
        "I'm not bossy, I'm the boss.",
        "Power is not given to you. You have to take it.",
        "Your self-worth is determined by you.",
        "We all have our imperfections.",
        "Embrace your uniqueness.",
        "Formation!",
        "Flawless.",
        "I'm a human being and I fall in love.",
      ],
    },
    "Michael Jackson": {
      image: "",
      quotes: [
        "I'm just like anyone. I cut and I bleed.",
        "The greatest education in the world is watching the masters at work.",
        "Just because it's in print doesn't mean it's the gospel.",
        "Heal the world.",
        "Beat it!",
        "Smooth criminal.",
        "You rock my world.",
        "Man in the mirror.",
        "They don't care about us.",
      ],
    },
    "Will Smith": {
      image: "",
      quotes: [
        "The first step is you have to say that you can.",
        "Fear is not real.",
        "If you're not making someone else's life better, then you're wasting your time.",
        "Greatness is not this wonderful, esoteric, elusive, godlike feature.",
        "Welcome to Earth!",
        "I, Robot.",
        "Independence Day!",
        "Men in Black.",
        "Pursuit of happiness.",
      ],
    },
    "Taylor Swift": {
      image: "",
      quotes: [
        "Shake it off!",
        "We are never getting back together.",
        "Look what you made me do.",
        "I knew you were trouble.",
        "Love story.",
        "You belong with me.",
        "Bad blood.",
        "Blank space.",
        "Anti-hero.",
      ],
    },
    "Leonardo DiCaprio": {
      image: "",
      quotes: [
        "I'm the king of the world!",
        "Climate change is real.",
        "Every generation has the responsibility to be stewards of the environment.",
        "I just want to make great films.",
        "Inception!",
        "The Wolf of Wall Street!",
        "The Revenant.",
        "Titanic forever.",
        "Don't let go, Jack!",
      ],
    },
    "Oprah Winfrey": {
      image: "",
      quotes: [
        "You get a car! Everybody gets a car!",
        "The biggest adventure you can take is to live the life of your dreams.",
        "Be thankful for what you have.",
        "What I know for sure.",
        "Live your best life.",
        "The secret to being happy is accepting where you are in life.",
        "Where there is no struggle, there is no strength.",
        "You become what you believe.",
        "Aha moment!",
      ],
    },
    // Add missing characters from zodiacTraits
    Rihanna: {
      image: "",
      quotes: [
        "Shine bright like a diamond!",
        "Work, work, work!",
        "We found love in a hopeless place.",
        "Umbrella, ella, ella!",
        "Don't stop the music!",
        "Disturbia!",
        "Only girl in the world!",
        "What's my name?",
        "Diamonds are forever!",
      ],
    },
    "Justin Bieber": {
      image: "",
      quotes: [
        "Baby, baby, baby!",
        "Never say never!",
        "Sorry, sorry, sorry!",
        "What do you mean?",
        "Is it too late now to say sorry?",
        "Love yourself!",
        "Purpose driven life!",
        "Believe in yourself!",
        "Changes are coming!",
      ],
    },
    "Drew Barrymore": {
      image: "",
      quotes: [
        "Life is very interesting... in the end, some of your greatest pains become your greatest strengths.",
        "I never regret anything. Because every little detail of your life is what made you into who you are in the end.",
        "I think happiness is what makes you pretty.",
        "When things are perfect, that's when you need to worry most.",
        "I love being a mom. I really do.",
        "Everyone is like a butterfly, they start out ugly and awkward and then morph into beautiful graceful butterflies.",
        "I've always said that one woman's success can only help another woman's success.",
        "Life is tough, but it's tougher when you're stupid.",
        "I aspire to be that person who is never afraid to be herself.",
      ],
    },
    "Albert Einstein": {
      image: "",
      quotes: [
        "Imagination is more important than knowledge.",
        "E=mc²!",
        "The important thing is not to stop questioning.",
        "Try not to become a person of success, but rather try to become a person of value.",
        "Life is like riding a bicycle. To keep your balance, you must keep moving.",
        "A person who never made a mistake never tried anything new.",
        "Logic will get you from A to B. Imagination will take you everywhere.",
        "The only source of knowledge is experience.",
        "Reality is merely an illusion, albeit a very persistent one.",
      ],
    },
    "Steve Jobs": {
      image: "",
      quotes: [
        "Stay hungry, stay foolish.",
        "Think different.",
        "Innovation distinguishes between a leader and a follower.",
        "Your work is going to fill a large part of your life.",
        "Design is not just what it looks like and feels like. Design is how it works.",
        "The people in the crazy enough to think they can change the world are the ones who do.",
        "Quality is more important than quantity.",
        "Details are not details. They make the design.",
        "I'm convinced that about half of what separates the successful entrepreneurs from the non-successful ones is pure perseverance.",
      ],
    },
    "Kurt Cobain": {
      image: "",
      quotes: [
        "Come as you are, as you were, as I want you to be.",
        "Smells like teen spirit!",
        "I'd rather be hated for who I am, than loved for who I am not.",
        "The duty of youth is to challenge corruption.",
        "Wanting to be someone else is a waste of who you are.",
        "I'm so happy because today I found my friends.",
        "It's better to burn out than to fade away.",
        "Thank you for the tragedy. I need it for my art.",
        "Music is my religion.",
      ],
    },
    Michelangelo: {
      image: "",
      quotes: [
        "I saw the angel in the marble and carved until I set him free.",
        "Every block of stone has a statue inside it.",
        "The greatest danger for most of us is not that our aim is too high and we miss it, but that it is too low and we reach it.",
        "I am still learning.",
        "Genius is eternal patience.",
        "Faith in oneself is the best and safest course.",
        "Lord, grant that I may always desire more than I can accomplish.",
        "Perfection is the enemy of greatness.",
        "Art is the lie that enables us to realize the truth.",
      ],
    },
    "Elizabeth Taylor": {
      image: "",
      quotes: [
        "Pour yourself a drink, put on some lipstick, and pull yourself together.",
        "I feel very adventurous. There are so many doors to be opened.",
        "Success is a great deodorant.",
        "The problem with people who have no vices is that generally you can be pretty sure they're going to have some pretty annoying virtues.",
        "I've always admitted that I'm ruled by my passions.",
        "I suppose when they reach a certain age some men are afraid to grow up.",
        "I've been through it all, baby, I'm mother courage.",
        "Some of my best leading men have been dogs and horses.",
        "Everything makes me nervous - except making films.",
      ],
    },
    "Daniel Craig": {
      image: "",
      quotes: [
        "Bond. James Bond.",
        "The name's Bond, James Bond.",
        "Shaken, not stirred.",
        "I've got all the time in the world.",
        "The job's done. I got the bad guy.",
        "Everyone needs a hobby.",
        "Sometimes the old ways are the best.",
        "I don't think I'm ever going to be comfortable being a public person.",
        "Being on your own would be sad, sick and weird.",
      ],
    },
    Hidan: {
      image: "",
      quotes: [
        "Jashin-sama demands a sacrifice!",
        "I'm immortal! You can't kill me!",
        "The way of Jashin!",
        "Pain is just an illusion!",
        "I love the sound of screaming!",
        "Death to all non-believers!",
        "My god will grant me eternal life!",
        "Ritual complete!",
        "You're going to die slowly!",
      ],
    },
    "Choji Akimichi": {
      image: "",
      quotes: [
        "I'm not fat, I'm big-boned!",
        "Expansion Jutsu!",
        "Food is the source of all power!",
        "Don't call me fat!",
        "Butterfly mode activated!",
        "I'll protect my friends!",
        "Size doesn't matter, heart does!",
        "Let's go eat!",
        "I believe in the power of friendship!",
      ],
    },
    Deidara: {
      image: "",
      quotes: [
        "Art is an explosion!",
        "My art is eternal!",
        "True art is an explosion!",
        "Katsu!",
        "Art is beauty that lasts for just a moment!",
        "I'll show you true art!",
        "Clay bombs ready!",
        "This is my masterpiece!",
        "Art is a bang!",
      ],
    },
    Kankuro: {
      image: "",
      quotes: [
        "Puppet Master Jutsu!",
        "I'll protect Gaara!",
        "My puppets never miss!",
        "Sand Village Pride!",
        "Don't underestimate a puppet master!",
        "Crow and Black Ant, ready for battle!",
        "Family comes first!",
        "I've got this under control!",
        "Puppet strings attached!",
      ],
    },
    "Dwayne Johnson": {
      image: "",
      quotes: [
        "Can you smell what The Rock is cooking?",
        "Be humble. Be hungry. And always be the hardest worker in the room.",
        "Success isn't always about greatness. It's about consistency.",
        "If you really want to do something, you'll find a way. If you don't, you'll find an excuse.",
        "The first step to achieving your goal, is to take a moment to respect your goal.",
        "Success at anything will always come down to this: focus and effort.",
        "Wake up determined. Go to bed satisfied.",
        "It's nice to be important, but it's more important to be nice.",
        "Stay strong. Keep pushing forward.",
      ],
    },
    Adele: {
      image: "",
      quotes: [
        "Hello, it's me!",
        "Someone like you!",
        "Rolling in the deep!",
        "Set fire to the rain!",
        "We could have had it all!",
        "Easy on me!",
        "When we were young!",
        "Make you feel my love!",
        "I was born to make mistakes, not to fake perfection.",
      ],
    },
    "George Clooney": {
      image: "",
      quotes: [
        "I'm a big believer in luck.",
        "Directing is really exciting. In the end, it's more fun to be the painter than the paint.",
        "You never really learn much from hearing yourself speak.",
        "The only failure is not to try.",
        "I don't believe in happy endings.",
        "I'm kind of comfortable with getting older because it's better than the other option.",
        "I just think there are a lot of celebrities who don't feel a responsibility.",
        "I've been my most happy and my most unhappy in relationships.",
        "I don't care if people think I'm a sellout.",
      ],
    },
    "Queen Elizabeth II": {
      image: "",
      quotes: [
        "I have to be seen to be believed.",
        "We all need people who will give us feedback.",
        "I know of no single formula for success.",
        "Grief is the price we pay for love.",
        "Let us not take ourselves too seriously.",
        "The true measure of all our actions is how long the good in them lasts.",
        "I cannot lead you into battle. I do not give you laws or administer justice.",
        "Family does not necessarily mean blood relatives but often a description of a community.",
        "Good memories are our second chance at happiness.",
      ],
    },
    "Mark Zuckerberg": {
      image: "",
      quotes: [
        "Move fast and break things.",
        "The biggest risk is not taking any risk.",
        "Connect the world!",
        "Think different!",
        "Code wins arguments.",
        "Done is better than perfect.",
        "People don't care about what you say, they care about what you build.",
        "I'm trying to make the world more open.",
        "Meta verse is the future!",
      ],
    },
    "Audrey Hepburn": {
      image: "",
      quotes: [
        "Nothing is impossible, the word itself says 'I'm possible'!",
        "Elegance is the only beauty that never fades.",
        "The most important thing is to enjoy your life.",
        "For beautiful eyes, look for the good in others.",
        "I believe in pink!",
        "Paris is always a good idea.",
        "As you grow older, you will discover that you have two hands.",
        "The best thing to hold onto in life is each other.",
        "Happy girls are the prettiest.",
      ],
    },
    "William Shakespeare": {
      image: "",
      quotes: [
        "To be or not to be, that is the question.",
        "All the world's a stage.",
        "Love looks not with the eyes, but with the mind.",
        "Some are born great, some achieve greatness.",
        "We know what we are, but know not what we may be.",
        "Better three hours too soon than a minute too late.",
        "The course of true love never did run smooth.",
        "All that glisters is not gold.",
        "What's in a name? A rose by any other name would smell as sweet.",
      ],
    },
    "Salvador Dalí": {
      image: "",
      quotes: [
        "I am not strange. I am just not normal.",
        "Surrealism is destructive, but it destroys only what it considers to be shackles limiting our vision.",
        "Have no fear of perfection - you'll never reach it.",
        "The only difference between me and a madman is that I'm not mad.",
        "Draw me a sheep!",
        "Intelligence without ambition is a bird without wings.",
        "What is important is to spread confusion, not eliminate it.",
        "Every morning when I wake up, I experience an exquisite joy.",
        "The secret to my influence has always been that it remained secret.",
      ],
    },
    "Barbra Streisand": {
      image: "",
      quotes: [
        "People like you and I, though mortal of course, like everyone else, do not grow old no matter how long we live.",
        "A man who graduated high in his class at Yale Law School and made partnership in a top law firm would be celebrated.",
        "Why is it men are permitted to be obsessed about their work, but women are only permitted to be obsessed about men?",
        "I've been called many names like perfectionist, difficult and obsessive.",
        "What does it mean when people applaud?",
        "The way I see it, if you want the rainbow, you gotta put up with the rain.",
        "I arrived in Hollywood without having my nose fixed.",
        "Just imagine how boring life would be if we were all the same.",
        "Men are allowed to have passion and commitment for their work... a woman is allowed that feeling for a man, but not her work.",
      ],
    },
    // Continue adding more missing characters as needed
    // Add more characters to reach all 15 for each zodiac sign...
    "Light Yagami": {
      image: "",
      quotes: [
        "I am Kira!",
        "I'll take a potato chip... and eat it!",
        "Justice will prevail!",
        "I am justice!",
        "The world needs to be cleansed!",
        "I will become the god of the new world!",
        "Delete!",
        "This world is rotten!",
        "I am the law!",
      ],
    },
    "Sasuke Uchiha": {
      image: "",
      quotes: [
        "I'll restore my clan!",
        "Revenge is my only goal!",
        "Chidori!",
        "I have to get stronger!",
        "The Uchiha name will be feared again!",
        "Fire Style: Fireball Jutsu!",
        "I'll surpass Itachi!",
        "Power is everything!",
        "I walk the path of vengeance!",
      ],
    },
    "Levi Ackerman": {
      image: "",
      quotes: [
        "I'll kill all the titans!",
        "Tch... annoying.",
        "Keep moving forward!",
        "Give up on your dreams and die!",
        "No regrets!",
        "Humanity's strongest soldier!",
        "Clean up this mess!",
        "That's an order!",
        "I choose to fight!",
      ],
    },
    "Mikasa Ackerman": {
      image: "",
      quotes: [
        "If I can't protect Eren, what good am I?",
        "I'll wrap this scarf around you forever!",
        "Eren, I'll always be by your side!",
        "I'm strong because I have to be!",
        "This world is cruel but beautiful!",
        "I'll kill anyone who threatens my family!",
        "Keep fighting!",
        "I won't let you die!",
        "We're free!",
      ],
    },
    Gaara: {
      image: "",
      quotes: [
        "Sand will protect me!",
        "I will become the Kazekage!",
        "Love is what makes us strong!",
        "I won't run away anymore!",
        "Sand Coffin!",
        "I have friends now!",
        "The pain taught me to care for others!",
        "I'll protect the village!",
        "Ultimate Defense!",
      ],
    },
    "Monkey D. Luffy": {
      image: "",
      quotes: [
        "I'm gonna be the Pirate King!",
        "Gomu Gomu no Pistol!",
        "I'll never give up!",
        "My crew is everything to me!",
        "Let's have an adventure!",
        "Meat! I want meat!",
        "I'll protect my friends!",
        "Gear Second!",
        "One Piece is real!",
      ],
    },
    "Shoto Todoroki": {
      image: "",
      quotes: [
        "I'll become a hero using only my ice!",
        "It's your power, isn't it?",
        "Half cold, half hot!",
        "I won't use his fire!",
        "Ice Wall!",
        "I'll surpass All Might!",
        "This is my power!",
        "Fire and ice!",
        "I choose my own path!",
      ],
    },
    // Add fallback for any remaining missing characters
    "Itachi Uchiha": {
      image: "",
      quotes: [
        "Those who break the rules are scum, but those who abandon their friends are worse than scum.",
        "People's lives don't end when they die. It ends when they lose faith.",
        "Knowledge and awareness are vague, and perhaps better called illusions.",
        "Self-sacrifice... A nameless shinobi who protects peace within its shadow.",
        "You and I are flesh and blood. I'm always going to be there for you, even if it's only as an obstacle for you to overcome.",
        "The village does have its dark side and its inconsistencies, but I'm still Konoha's Itachi Uchiha.",
        "We are humans, not fish. We don't know what kind of people we truly are until the moment before our deaths.",
        "It is not wise to judge others based on your own preconceptions and by their appearances.",
        "Forgive me, Sasuke. There won't be a next time.",
      ],
    },
    Ymir: {
      image: "",
      quotes: [
        "I'm sorry... for everything.",
        "Live for yourself!",
        "I finally understand what it means to live for someone else.",
        "Historia, live your life with pride.",
        "I want to see you live happily.",
        "Thank you for being born into this world.",
        "I was able to feel like a person again.",
        "My one and only wish is for you to live a life you're proud of.",
        "You're important to me.",
      ],
    },
    "Karin Uzumaki": {
      image: "",
      quotes: [
        "Sasuke-kun!",
        "My chakra sensing is perfect!",
        "Uzumaki healing power!",
        "I can sense everyone's chakra!",
        "Sasuke, you better not die!",
        "Chain abilities activate!",
        "I'm a sensor type ninja!",
        "My healing bite technique!",
        "Red hair, red hot temper!",
      ],
    },
    "Neji Hyuga": {
      image: "",
      quotes: [
        "Fate is not something to be determined by others!",
        "Byakugan!",
        "Gentle Fist technique!",
        "I will change my destiny!",
        "The difference between stupidity and genius is that genius has its limits.",
        "Eight Trigrams Sixty-Four Palms!",
        "I can see your chakra points clearly!",
        "A genius of hard work!",
        "The Hyuga clan's power!",
      ],
    },
    "Kushina Uzumaki": {
      image: "",
      quotes: [
        "Naruto, I love you!",
        "Don't be picky about food!",
        "Find a woman like me!",
        "Red-Hot Habanero!",
        "Uzumaki sealing techniques!",
        "My son will be Hokage!",
        "Believe it, dattebane!",
        "Protect the village!",
        "Minato, thank you for everything!",
      ],
    },
    "Madara Uchiha": {
      image: "",
      quotes: [
        "In this world, wherever there is light, there are also shadows.",
        "Wake up to reality!",
        "The concept of hope is nothing more than giving up!",
        "Power is not will, it is the phenomenon of physically making things happen.",
        "When a man learns to love, he must bear the risk of hatred.",
        "The longer you live, the more you realize that reality is just made of pain, suffering and emptiness.",
        "Nine-Tails, you are merely a momentary life, a temporary existence!",
        "I'll deal with you later!",
        "Infinite Tsukuyomi!",
      ],
    },
    "Nezuko Kamado": {
      image: "",
      quotes: [
        "Mmmph! Mmmph!",
        "Onii-chan!",
        "Nezuko will protect!",
        "Family is everything!",
        "Blood demon art!",
        "Size manipulation!",
        "Explosive blood!",
        "I won't eat humans!",
        "Brother's scent!",
      ],
    },
    "Izuku Midoriya": {
      image: "",
      quotes: [
        "I'll become the greatest hero!",
        "Plus Ultra!",
        "One For All, Full Cowling!",
        "Detroit Smash!",
        "I can do it!",
        "Everyone can be a hero!",
        "I want to save people!",
        "All Might, I'll make you proud!",
        "My hero academia!",
      ],
    },
    "Hinata Hyuga": {
      image: "",
      quotes: [
        "Naruto-kun, I've always been watching you!",
        "I won't run away anymore!",
        "Byakugan!",
        "Gentle Fist!",
        "I want to become stronger!",
        "Naruto-kun gave me courage!",
        "Twin Lion Fists!",
        "I'll protect what's important to me!",
        "Thank you for changing my life!",
      ],
    },
    "Historia Reiss": {
      image: "",
      quotes: [
        "I'm humanity's enemy!",
        "I choose to live for myself!",
        "I'm the worst girl in the world!",
        "I won't be a good girl anymore!",
        "I want to be proud of my life!",
        "I'll live however I want!",
        "Thank you, Ymir!",
        "I'm Historia Reiss!",
        "I choose my own path!",
      ],
    },
    "Fugaku Uchiha": {
      image: "",
      quotes: [
        "The Uchiha clan's pride!",
        "Sasuke, become strong!",
        "Mangekyo Sharingan!",
        "Protect the clan's honor!",
        "Fire Style techniques!",
        "Police force leader!",
        "Uchiha tradition!",
        "My sons will surpass me!",
        "Clan comes first!",
      ],
    },
    // Missing Aries Characters
    "Elton John": {
      image: "",
      quotes: [
        "I'm still standing!",
        "Rocket Man!",
        "Your Song!",
        "Candle in the Wind!",
        "Don't let the sun go down on me!",
        "I'm a survivor!",
        "Goodbye Yellow Brick Road!",
        "Tiny Dancer!",
        "Life is about making an impression, not an excuse.",
      ],
    },
    "Mariah Carey": {
      image: "",
      quotes: [
        "All I Want for Christmas Is You!",
        "We Belong Together!",
        "Hero!",
        "I don't know her.",
        "Vision of Love!",
        "Always Be My Baby!",
        "When You Believe!",
        "Fantasy!",
        "I can't read sudden movements. It's a condition.",
      ],
    },
    "Jackie Chan": {
      image: "",
      quotes: [
        "I don't want trouble!",
        "I'm not looking for trouble, but trouble looks for me!",
        "When people see me, they know I mean business.",
        "Be like water, my friend.",
        "I do all my own stunts!",
        "Family is everything!",
        "Train hard, fight easy!",
        "Rush Hour!",
        "Never give up, never surrender!",
      ],
    },
    "Vincent van Gogh": {
      image: "",
      quotes: [
        "I dream my painting, and then I paint my dream.",
        "Great things are not done by impulse, but by a series of small things brought together.",
        "I would rather die of passion than of boredom.",
        "The way to know life is to love many things.",
        "Art is to console those who are broken by life.",
        "I put my heart and soul into my work, and I have lost my mind in the process.",
        "If you hear a voice within you say you cannot paint, then by all means paint.",
        "What would life be if we had no courage to attempt anything?",
        "Starry night!",
      ],
    },
    "Leonardo da Vinci": {
      image: "",
      quotes: [
        "Learning never exhausts the mind.",
        "Simplicity is the ultimate sophistication.",
        "I have been impressed with the urgency of doing.",
        "The noblest pleasure is the joy of understanding.",
        "Art is never finished, only abandoned.",
        "Water is the driving force of all nature.",
        "He who loves practice without theory is like the sailor who boards ship without a rudder.",
        "The Mona Lisa!",
        "Obstacles cannot crush me; every obstacle yields to stern resolve.",
      ],
    },
    "Maya Angelou": {
      image: "",
      quotes: [
        "Still I Rise!",
        "If you don't like something, change it.",
        "I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.",
        "There is no greater agony than bearing an untold story inside you.",
        "Try to be a rainbow in someone's cloud.",
        "We delight in the beauty of the butterfly, but rarely admit the changes it has gone through to achieve that beauty.",
        "If you're always trying to be normal, you will never know how amazing you can be.",
        "Love recognizes no barriers.",
        "Phenomenal Woman!",
      ],
    },
    // Missing Gemini Characters
    "Kanye West": {
      image: "",
      quotes: [
        "I'mma let you finish, but...",
        "Gold Digger!",
        "Stronger!",
        "Through the Wire!",
        "I am a god!",
        "My greatest pain in life is that I will never be able to see myself perform live.",
        "I refuse to accept other people's ideas of happiness for me.",
        "All Falls Down!",
        "Graduation!",
      ],
    },
    "Donald Trump": {
      image: "",
      quotes: [
        "You're fired!",
        "Make America Great Again!",
        "We're gonna build a wall!",
        "I'm really rich!",
        "The Art of the Deal!",
        "Fake news!",
        "That's huge!",
        "Tremendous!",
        "I know words, I have the best words.",
      ],
    },
    "Marilyn Monroe": {
      image: "",
      quotes: [
        "I'm selfish, impatient and a little insecure.",
        "Imperfection is beauty, madness is genius.",
        "Give a girl the right shoes, and she can conquer the world.",
        "If you can't handle me at my worst, then you sure as hell don't deserve me at my best.",
        "A wise girl knows her limits, a smart girl knows that she has none.",
        "Diamonds are a girl's best friend!",
        "Some Like It Hot!",
        "Gentlemen Prefer Blondes!",
        "I want to be loved by you!",
      ],
    },
    "Bob Dylan": {
      image: "",
      quotes: [
        "The times they are a-changin'!",
        "Blowin' in the Wind!",
        "Like a Rolling Stone!",
        "A man is a success if he gets up in the morning and gets to bed at night, and in between he does what he wants to do.",
        "Don't think twice, it's all right!",
        "The answer, my friend, is blowin' in the wind.",
        "All Along the Watchtower!",
        "Highway 61 Revisited!",
        "Tangled Up in Blue!",
      ],
    },
    "John F. Kennedy": {
      image: "",
      quotes: [
        "Ask not what your country can do for you – ask what you can do for your country.",
        "The time to repair the roof is when the sun is shining.",
        "Change is the law of life.",
        "Let us never negotiate out of fear. But let us never fear to negotiate.",
        "We choose to go to the Moon!",
        "Ich bin ein Berliner!",
        "A man may die, nations may rise and fall, but an idea lives on.",
        "The best road to progress is freedom's road.",
        "Leadership and learning are indispensable to each other.",
      ],
    },
    "Walt Whitman": {
      image: "",
      quotes: [
        "I contain multitudes.",
        "Keep your face always toward the sunshine—and shadows will fall behind you.",
        "Be curious, not judgmental.",
        "Do I contradict myself? Very well then I contradict myself.",
        "Leaves of Grass!",
        "Song of Myself!",
        "I celebrate myself, and sing myself.",
        "Resist much, obey little.",
        "The United States themselves are essentially the greatest poem.",
      ],
    },
    "Paul McCartney": {
      image: "",
      quotes: [
        "Yesterday, all my troubles seemed so far away!",
        "Here comes the sun!",
        "Let it be!",
        "The long and winding road!",
        "Hey Jude!",
        "And I love her!",
        "Maybe I'm Amazed!",
        "Live and Let Die!",
        "The love you take is equal to the love you make.",
      ],
    },
    // Missing Cancer Characters
    "Selena Gomez": {
      image: "",
      quotes: [
        "You are who you surround yourself with.",
        "What makes you different makes you beautiful.",
        "Being yourself is all it takes.",
        "Lose You to Love Me!",
        "Come & Get It!",
        "Good for You!",
        "Look at Her Now!",
        "The heart wants what it wants!",
        "Rare!",
      ],
    },
    "Robin Williams": {
      image: "",
      quotes: [
        "You're only given a little spark of madness. You mustn't lose it.",
        "No matter what people tell you, words and ideas can change the world.",
        "Everyone you meet is fighting a battle you know nothing about. Be kind. Always.",
        "Good Will Hunting!",
        "Dead Poets Society!",
        "Mrs. Doubtfire!",
        "Patch Adams!",
        "What dreams may come!",
        "Nanu nanu!",
      ],
    },
    "Princess Diana": {
      image: "",
      quotes: [
        "Carry out a random act of kindness, with no expectation of reward.",
        "Everyone needs to be valued. Everyone has the potential to give something back.",
        "I don't go by the rule book... I lead from the heart, not the head.",
        "The greatest problem in the world today is intolerance.",
        "Nothing brings me more happiness than trying to help the most vulnerable people in society.",
        "I like to be a free spirit. Some don't like that, but that's the way I am.",
        "Family is the most important thing in the world.",
        "I want to walk into a room, be it a hospital for the dying or a hospital for the sick children, and feel that I am needed.",
        "I knew what my job was; it was to go out and meet the people and love them.",
      ],
    },
    "Ernest Hemingway": {
      image: "",
      quotes: [
        "The world breaks everyone, and afterward, some are strong at the broken places.",
        "There is nothing to writing. All you do is sit down at a typewriter and bleed.",
        "The best way to find out if you can trust somebody is to trust them.",
        "Courage is grace under pressure.",
        "All good books are alike in that they are truer than if they had really happened.",
        "The Old Man and the Sea!",
        "For Whom the Bell Tolls!",
        "A Farewell to Arms!",
        "The Sun Also Rises!",
      ],
    },
    "Frida Kahlo": {
      image: "",
      quotes: [
        "I paint my own reality.",
        "I am my own muse, my own subject, my own most fascinating topic of conversation.",
        "Feet, what do I need you for when I have wings to fly?",
        "I hope the exit is joyful - and I hope never to return.",
        "I paint flowers so they will not die.",
        "Nothing is worth more than laughter.",
        "At the end of the day, we can endure much more than we think we can.",
        "I drink to drown my sorrows, but the damned things have learned to swim.",
        "Viva la vida!",
      ],
    },
    "Nelson Mandela": {
      image: "",
      quotes: [
        "Education is the most powerful weapon which you can use to change the world.",
        "It always seems impossible until it's done.",
        "No one is born hating another person because of the color of his skin, or his background, or his religion.",
        "I learned that courage was not the absence of fear, but the triumph over it.",
        "There is no passion to be found playing small.",
        "A good head and a good heart are always a formidable combination.",
        "Freedom is indivisible; the chains on any one of my people were the chains on all of them.",
        "If you want to make peace with your enemy, you have to work with your enemy. Then he becomes your partner.",
        "The greatest glory in living lies not in never falling, but in rising every time we fall.",
      ],
    },
    "Julius Caesar": {
      image: "",
      quotes: [
        "I came, I saw, I conquered.",
        "Et tu, Brute?",
        "The die is cast.",
        "Experience is the teacher of all things.",
        "What we wish, we readily believe, and what we ourselves think, we imagine others think also.",
        "It is better to create than to learn! Creating is the essence of life.",
        "Cowards die many times before their deaths.",
        "Beware the Ides of March!",
        "Fortune favors the bold.",
      ],
    },
    "Meryl Streep": {
      image: "",
      quotes: [
        "The great gift of human beings is that we have the power of empathy.",
        "You just have to keep on doing what you do. It's the lesson I get from my husband; he just says, Keep going. Start by starting.",
        "Acting is not about being someone different. It's finding the similarity in what is apparently different.",
        "The formula of happiness and success is just, being actually yourself, in the most vivid possible way you can.",
        "It's amazing how good getting up and moving makes you feel.",
        "Sophie's Choice!",
        "The Devil Wears Prada!",
        "Mamma Mia!",
        "Into the Woods!",
      ],
    },
    // Missing Leo Characters
    "Kyojuro Rengoku": {
      image: "",
      quotes: [
        "Set your heart ablaze!",
        "Flame Breathing!",
        "I will fulfill my duty!",
        "The weak have no rights or choices!",
        "Those who regain their composure first in a battle are the ones who win!",
        "Life is like a flame. It burns bright, then dims, and eventually goes out.",
        "I will not allow anyone here to die!",
        "Umai! Umai! Umai!",
        "Even if you feel you are the most unfortunate person in the world, you mustn't give up!",
      ],
    },
    "All Might": {
      image: "",
      quotes: [
        "I am here!",
        "Plus Ultra!",
        "A real hero will always find a way for justice to be served!",
        "Whether you win or lose, you can always come out ahead by learning from the experience.",
        "It's fine now. Why? Because I am here!",
        "The most inflated egos are often the most fragile.",
        "Detroit Smash!",
        "Texas Smash!",
        "You're next!",
      ],
    },
    Vegeta: {
      image: "",
      quotes: [
        "It's over 9000!",
        "I am the prince of all Saiyans!",
        "Final Flash!",
        "Big Bang Attack!",
        "You will never be a true Saiyan!",
        "I will surpass Kakarot!",
        "My pride as a Saiyan prince!",
        "Galick Gun!",
        "I am elite!",
      ],
    },
    Madonna: {
      image: "",
      quotes: [
        "Express yourself!",
        "Like a Virgin!",
        "Material Girl!",
        "Vogue!",
        "Papa Don't Preach!",
        "Like a Prayer!",
        "Justify My Love!",
        "Ray of Light!",
        "I'm breathless!",
      ],
    },
    "Arnold Schwarzenegger": {
      image: "",
      quotes: [
        "I'll be back!",
        "Hasta la vista, baby!",
        "Get to the chopper!",
        "Come with me if you want to live!",
        "It's not a tumor!",
        "I'm a cybernetic organism!",
        "Strength does not come from physical capacity.",
        "The worst thing I can be is the same as everybody else. I hate that.",
        "Failure is not an option. Everyone has to succeed.",
      ],
    },
    "Whitney Houston": {
      image: "",
      quotes: [
        "I Will Always Love You!",
        "I Wanna Dance with Somebody!",
        "Greatest Love of All!",
        "How Will I Know!",
        "I Have Nothing!",
        "One moment in time!",
        "Where Do Broken Hearts Go!",
        "I'm Every Woman!",
        "Learning to love yourself is the greatest love of all!",
      ],
    },
    "Andy Warhol": {
      image: "",
      quotes: [
        "In the future, everyone will be world-famous for 15 minutes.",
        "Art is what you can get away with.",
        "I like boring things.",
        "Pop art is for everyone.",
        "The idea of waiting for something makes it more exciting.",
        "Campbell's Soup Cans!",
        "Marilyn Diptych!",
        "Factory life!",
        "Silver clouds!",
      ],
    },
    "Napoleon Bonaparte": {
      image: "",
      quotes: [
        "Impossible is a word to be found only in the dictionary of fools.",
        "Victory belongs to the most persevering.",
        "Courage isn't having the strength to go on - it is going on when you don't have strength.",
        "A leader is a dealer in hope.",
        "The battlefield is a scene of constant chaos. The winner will be the one who controls that chaos.",
        "An army marches on its stomach.",
        "Glory is fleeting, but obscurity is forever.",
        "I can no longer obey; I have tasted command, and I cannot give it up.",
        "Death is nothing, but to live defeated and inglorious is to die daily.",
      ],
    },
    "Alfred Hitchcock": {
      image: "",
      quotes: [
        "I'm not a heavy drinker, I can sometimes go for hours without touching a drop.",
        "The length of a film should be directly related to the endurance of the human bladder.",
        "There is no terror in the bang, only in the anticipation of it.",
        "Always make the audience suffer as much as possible.",
        "Vertigo!",
        "Psycho!",
        "The Birds!",
        "North by Northwest!",
        "Suspense is like a woman. The more left to the imagination, the more the excitement.",
      ],
    },
    "Mick Jagger": {
      image: "",
      quotes: [
        "I can't get no satisfaction!",
        "Paint It Black!",
        "Start Me Up!",
        "You Can't Always Get What You Want!",
        "Gimme Shelter!",
        "Angie!",
        "Wild Horses!",
        "Miss You!",
        "I move like Jagger!",
      ],
    },
    // Missing Virgo Characters
    "Hange Zoë": {
      image: "",
      quotes: [
        "Let's capture a titan!",
        "Science is amazing!",
        "Titans are so interesting!",
        "Sonny! Bean! My precious titans!",
        "We need to learn more about them!",
        "This is so exciting!",
        "Dedicate your hearts!",
        "For humanity's future!",
        "The pursuit of knowledge!",
      ],
    },
    "Kakashi Hatake": {
      image: "",
      quotes: [
        "Those who break the rules are trash, but those who abandon their friends are worse than trash.",
        "I'm Kakashi Hatake. Things I like and things I hate... I don't feel like telling you that.",
        "Sorry I'm late, I got lost on the path of life.",
        "Chidori!",
        "Copy Ninja Kakashi!",
        "Lightning Blade!",
        "Teamwork is essential!",
        "A ninja must see underneath the underneath.",
        "The next generation will always surpass the previous one.",
      ],
    },
    "Shikamaru Nara": {
      image: "",
      quotes: [
        "What a drag...",
        "Troublesome woman...",
        "Shadow Possession Jutsu!",
        "I'd rather not, but I guess I have no choice.",
        "The difference between stupidity and genius is that genius has its limits.",
        "How troublesome...",
        "Shadow Bind completed!",
        "Strategic planning is everything!",
        "Sometimes the most important thing is to not think too hard.",
      ],
    },
    "Giyu Tomioka": {
      image: "",
      quotes: [
        "Water Breathing!",
        "I am not disliked by people.",
        "Total Concentration!",
        "Water Surface Slash!",
        "The strong protect the weak.",
        "Dead Calm!",
        "Eleventh Form!",
        "I won't let anyone die!",
        "Keep moving forward!",
      ],
    },
    "Tenya Iida": {
      image: "",
      quotes: [
        "Everyone! Let us depart expeditiously!",
        "Recipro Burst!",
        "As class representative, I must set an example!",
        "Engine!",
        "Recipro Turbo!",
        "Follow the rules!",
        "Plus Ultra!",
        "I will become a proper hero!",
        "Hand chopping motion!",
      ],
    },
    "Senku Ishigami": {
      image: "",
      quotes: [
        "This is exhilarating!",
        "Science rules!",
        "10 billion percent!",
        "Let's get excited about science!",
        "Stone World!",
        "Get excited!",
        "Science is the way!",
        "Kingdom of Science!",
        "Logic and reason!",
      ],
    },
    "Keanu Reeves": {
      image: "",
      quotes: [
        "Whoa!",
        "I know kung fu!",
        "There is no spoon!",
        "Be excellent to each other!",
        "The Matrix has you!",
        "John Wick!",
        "You're breathtaking!",
        "Sometimes we get so caught up in our daily lives that we forget to take the time out to enjoy the beauty in life.",
        "I'm not a smart man, but I know what love is.",
      ],
    },
    "Mother Teresa": {
      image: "",
      quotes: [
        "Spread love everywhere you go.",
        "Not all of us can do great things. But we can do small things with great love.",
        "If you judge people, you have no time to love them.",
        "Give, but give until it hurts.",
        "Peace begins with a smile.",
        "Do something beautiful for God.",
        "Love is a fruit in season at all times.",
        "We can do no great things, only small things with great love.",
        "Be faithful in small things because it is in them that your strength lies.",
      ],
    },
    "Warren Buffett": {
      image: "",
      quotes: [
        "Rule No. 1: Never lose money. Rule No. 2: Never forget rule No. 1.",
        "It's better to be approximately right than precisely wrong.",
        "Price is what you pay. Value is what you get.",
        "The stock market is designed to transfer money from the Active to the Patient.",
        "Risk comes from not knowing what you're doing.",
        "Be fearful when others are greedy and greedy when others are fearful.",
        "Time is the friend of the wonderful company, the enemy of the mediocre.",
        "Our favorite holding period is forever.",
        "The best investment you can make is in yourself.",
      ],
    },
    "Stephen King": {
      image: "",
      quotes: [
        "The trust of the innocent is the liar's most useful tool.",
        "Get busy living, or get busy dying.",
        "Monsters are real, and ghosts are real too.",
        "Books are a uniquely portable magic.",
        "The road to hell is paved with adverbs.",
        "The Shining!",
        "It!",
        "Carrie!",
        "Here's Johnny!",
      ],
    },
    "Agatha Christie": {
      image: "",
      quotes: [
        "The impossible could not have happened, therefore the impossible must be possible.",
        "I like living. I have sometimes been wildly, despairingly, acutely miserable, racked with sorrow.",
        "The best time to plan a book is while you're doing the dishes.",
        "Hercule Poirot!",
        "Miss Marple!",
        "Murder on the Orient Express!",
        "And Then There Were None!",
        "The ABC Murders!",
        "Evil under the sun!",
      ],
    },
    "Freddie Mercury": {
      image: "",
      quotes: [
        "Mamaaaa, just killed a man!",
        "We are the champions!",
        "We will rock you!",
        "Don't stop me now!",
        "I want to break free!",
        "Somebody to Love!",
        "Another One Bites the Dust!",
        "Radio Ga Ga!",
        "The show must go on!",
      ],
    },
    "Amy Poehler": {
      image: "",
      quotes: [
        "Great people do things before they're ready.",
        "Find a group of people who challenge and inspire you.",
        "Treat your career like a bad boyfriend.",
        "You have to care about your work but not about the result.",
        "Leslie Knope!",
        "Parks and Recreation!",
        "Yes Please!",
        "Smart Girls!",
        "Upright Citizens Brigade!",
      ],
    },
    // Missing Libra Characters
    "Ino Yamanaka": {
      image: "",
      quotes: [
        "Mind Transfer Jutsu!",
        "I'm beautiful!",
        "Flower power!",
        "I won't lose to Sakura!",
        "Mind Body Switch Technique!",
        "Yamanaka clan secret techniques!",
        "I'm not just a pretty face!",
        "Sensory abilities activated!",
        "Girl power!",
      ],
    },
    "Naruto Uzumaki": {
      image: "",
      quotes: [
        "Believe it, dattebayo!",
        "I'm gonna be Hokage!",
        "Rasengan!",
        "Shadow Clone Jutsu!",
        "I never go back on my word!",
        "I'll protect my friends!",
        "Sage Mode!",
        "Nine-Tails Chakra Mode!",
        "My ninja way!",
      ],
    },
    "Mikoto Uchiha": {
      image: "",
      quotes: [
        "Take care of Sasuke!",
        "The Uchiha clan's love!",
        "My precious children!",
        "Fire Style techniques!",
        "Mother's love is eternal!",
        "Protect the family!",
        "Sharingan heritage!",
        "Fugaku, I believe in you!",
        "Love conquers all!",
      ],
    },
    "Inosuke Hashibira": {
      image: "",
      quotes: [
        "Beast Breathing!",
        "King of the mountain!",
        "I'm the strongest!",
        "Dual wielding swords!",
        "Wild boar rush!",
        "Fight me!",
        "Mountain pride!",
        "Spatial awareness!",
        "Lord Inosuke!",
      ],
    },
    "Ochaco Uraraka": {
      image: "",
      quotes: [
        "Zero Gravity!",
        "I want to help my parents!",
        "Plus Ultra!",
        "Deku-kun!",
        "Release!",
        "Weightless!",
        "I'll become a hero!",
        "Floating quirk!",
        "Gunhead Martial Arts!",
      ],
    },
    "Kim Kardashian": {
      image: "",
      quotes: [
        "Don't be f***ing rude!",
        "Bible!",
        "That's so cute!",
        "SKIMS!",
        "SKKN!",
        "Family over everything!",
        "Work harder!",
        "Selfie queen!",
        "Breaking the internet!",
      ],
    },
    "Hugh Jackman": {
      image: "",
      quotes: [
        "I'm Wolverine!",
        "Bub!",
        "The Greatest Showman!",
        "Les Misérables!",
        "X-Men!",
        "Logan!",
        "Musical theater!",
        "Jackman's back!",
        "Adamantium claws!",
      ],
    },
    "John Lennon": {
      image: "",
      quotes: [
        "Imagine all the people living life in peace!",
        "All you need is love!",
        "Come together!",
        "Give Peace a Chance!",
        "A Hard Day's Night!",
        "Help!",
        "Strawberry Fields Forever!",
        "Working Class Hero!",
        "War is over, if you want it!",
      ],
    },
    "Gwyneth Paltrow": {
      image: "",
      quotes: [
        "I'm Iron Man's wife!",
        "Goop!",
        "Conscious uncoupling!",
        "Shakespeare in Love!",
        "Pepper Potts!",
        "Wellness lifestyle!",
        "Clean eating!",
        "Mindful living!",
        "Detox everything!",
      ],
    },
    "Bruno Mars": {
      image: "",
      quotes: [
        "Uptown Funk!",
        "24K Magic!",
        "Just the Way You Are!",
        "Grenade!",
        "Count on Me!",
        "Locked Out of Heaven!",
        "That's What I Like!",
        "Treasure!",
        "When I Was Your Man!",
      ],
    },
    "Mahatma Gandhi": {
      image: "",
      quotes: [
        "Be the change you wish to see in the world.",
        "In a gentle way, you can shake the world.",
        "The weak can never forgive. Forgiveness is the attribute of the strong.",
        "Live as if you were to die tomorrow. Learn as if you were to live forever.",
        "An eye for an eye only ends up making the whole world blind.",
        "The best way to find yourself is to lose yourself in the service of others.",
        "Happiness is when what you think, what you say, and what you do are in harmony.",
        "Non-violence is a weapon of the strong.",
        "Truth never damages a cause that is just.",
      ],
    },
    "Oscar Wilde": {
      image: "",
      quotes: [
        "We are all in the gutter, but some of us are looking at the stars.",
        "Be yourself; everyone else is already taken.",
        "I can resist everything except temptation.",
        "The only way to get rid of a temptation is to yield to it.",
        "Experience is merely the name men gave to their mistakes.",
        "The Picture of Dorian Gray!",
        "The Importance of Being Earnest!",
        "A cynic is a man who knows the price of everything and the value of nothing.",
        "Work is the curse of the drinking classes.",
      ],
    },
    "Margaret Thatcher": {
      image: "",
      quotes: [
        "The lady is not for turning!",
        "There is no alternative!",
        "If you want something said, ask a man; if you want something done, ask a woman.",
        "I am extraordinarily patient, provided I get my own way in the end.",
        "Being powerful is like being a lady. If you have to tell people you are, you aren't.",
        "The problem with socialism is that you eventually run out of other people's money.",
        "I fight on, I fight to win!",
        "Iron Lady!",
        "Consensus is the absence of leadership.",
      ],
    },
    // Missing Scorpio Characters
    "L Lawliet": {
      image: "",
      quotes: [
        "I am L.",
        "Justice will prevail!",
        "Kira is evil!",
        "Light Yagami is Kira!",
        "Ryuzaki here!",
        "The probability is...",
        "Sugar addiction!",
        "Detective work!",
        "Death Note investigation!",
      ],
    },
    "Armin Arlert": {
      image: "",
      quotes: [
        "I want to see the ocean!",
        "Knowledge is power!",
        "Strategic planning!",
        "Colossal Titan!",
        "For humanity!",
        "Eren, Mikasa!",
        "The outside world!",
        "Sacrifice for the greater good!",
        "Intelligence over strength!",
      ],
    },
    "Yagura Karatachi": {
      image: "",
      quotes: [
        "Fourth Mizukage!",
        "Water Style techniques!",
        "Hidden Mist Village!",
        "Three-Tails jinchuriki!",
        "Coral Palm!",
        "Mist ninja pride!",
        "Village protection!",
        "Bloody Mist era!",
        "Kage responsibilities!",
      ],
    },
    "Muichiro Tokito": {
      image: "",
      quotes: [
        "Mist Breathing!",
        "I'm a Hashira!",
        "Obscuring Clouds!",
        "Mist pillar!",
        "Demon slayer corps!",
        "Youngest Hashira!",
        "Nichirin blade!",
        "Total Concentration!",
        "For my brother!",
      ],
    },
    "Ryan Reynolds": {
      image: "",
      quotes: [
        "Maximum effort!",
        "Deadpool!",
        "Green Lantern was a mistake!",
        "Blake Lively is amazing!",
        "Aviation Gin!",
        "Fourth wall breaking!",
        "Chimichangas!",
        "I'm not a hero!",
        "Mint Mobile!",
      ],
    },
    "Emma Stone": {
      image: "",
      quotes: [
        "La La Land!",
        "Easy A!",
        "Superbad!",
        "The Help!",
        "Birdman!",
        "Battle of the Sexes!",
        "Cruella!",
        "Poor Things!",
        "Stone cold acting!",
      ],
    },
    "Bill Gates": {
      image: "",
      quotes: [
        "Your most unhappy customers are your greatest source of learning.",
        "We always overestimate the change that will occur in the next two years.",
        "Success is a lousy teacher. It seduces smart people into thinking they can't lose.",
        "Microsoft!",
        "Windows!",
        "Philanthropy!",
        "Gates Foundation!",
        "Global health!",
        "Innovation for good!",
      ],
    },
    "Hillary Clinton": {
      image: "",
      quotes: [
        "I'm with her!",
        "Stronger together!",
        "It takes a village!",
        "Women's rights are human rights!",
        "Glass ceiling!",
        "What happened?",
        "Public service!",
        "First Lady, Senator, Secretary!",
        "Persist!",
      ],
    },
    "Pablo Picasso": {
      image: "",
      quotes: [
        "Every child is an artist. The problem is how to remain an artist once we grow up.",
        "Art is the lie that enables us to realize the truth.",
        "The meaning of life is to find your gift. The purpose of life is to give it away.",
        "Everything you can imagine is real.",
        "Cubism!",
        "Guernica!",
        "Blue Period!",
        "Rose Period!",
        "Abstract art!",
      ],
    },
    "Marie Curie": {
      image: "",
      quotes: [
        "Nothing in life is to be feared, it is only to be understood.",
        "I was taught that the way of progress was neither swift nor easy.",
        "Be less curious about people and more curious about ideas.",
        "Radium discovery!",
        "Nobel Prize winner!",
        "Scientific research!",
        "First woman to win Nobel Prize!",
        "Radioactivity!",
        "Pioneer in physics and chemistry!",
      ],
    },
    "Theodore Roosevelt": {
      image: "",
      quotes: [
        "Speak softly and carry a big stick!",
        "The only man who never makes a mistake is the man who never does anything.",
        "Believe you can and you're halfway there.",
        "Do what you can, with what you have, where you are.",
        "It is hard to fail, but it is worse never to have tried to succeed.",
        "Rough Riders!",
        "Square Deal!",
        "Bull Moose Party!",
        "Conservation!",
      ],
    },
    "Katy Perry": {
      image: "",
      quotes: [
        "Do you ever feel like a plastic bag?",
        "Firework!",
        "Roar!",
        "Dark Horse!",
        "California Gurls!",
        "I Kissed a Girl!",
        "Teenage Dream!",
        "Witness!",
        "Smile!",
      ],
    },
    // Missing Sagittarius Characters
    "Zabuza Momochi": {
      image: "",
      quotes: [
        "Demon of the Hidden Mist!",
        "Silent Killing!",
        "Executioner's Blade!",
        "Water Style: Water Dragon Jutsu!",
        "Hidden Mist Jutsu!",
        "Seven Swordsmen!",
        "Haku, you were too kind!",
        "A shinobi is just a tool!",
        "Water prison jutsu!",
      ],
    },
    Mello: {
      image: "",
      quotes: [
        "I'm better than Near!",
        "Death Note!",
        "Chocolate addiction!",
        "Mafia connections!",
        "Wammy's House!",
        "L's successor!",
        "Kira investigation!",
        "Matt!",
        "Explosive finale!",
      ],
    },
    "Mitsuri Kanroji": {
      image: "",
      quotes: [
        "Love Breathing!",
        "I love food!",
        "Colorful hair!",
        "Flexible blade!",
        "Love Hashira!",
        "Demon Slayer Corps!",
        "Strength through love!",
        "Nichirin sword!",
        "Cute and strong!",
      ],
    },
    "Brad Pitt": {
      image: "",
      quotes: [
        "What's in the box?",
        "Fight Club!",
        "Ocean's Eleven!",
        "Seven!",
        "Once Upon a Time in Hollywood!",
        "World War Z!",
        "Moneyball!",
        "Ad Astra!",
        "Plan B Entertainment!",
      ],
    },
    "Miley Cyrus": {
      image: "",
      quotes: [
        "I came in like a wrecking ball!",
        "Party in the USA!",
        "Hannah Montana!",
        "Can't be tamed!",
        "Flowers!",
        "The Climb!",
        "Malibu!",
        "Plastic Hearts!",
        "Free spirit!",
      ],
    },
    "Winston Churchill": {
      image: "",
      quotes: [
        "We shall never surrender!",
        "Never, never, never give up!",
        "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        "The empires of the future are the empires of the mind.",
        "A pessimist sees the difficulty in every opportunity; an optimist sees the opportunity in every difficulty.",
        "Their finest hour!",
        "Iron Curtain!",
        "Blood, toil, tears and sweat!",
        "V for Victory!",
      ],
    },
    "Walt Disney": {
      image: "",
      quotes: [
        "All our dreams can come true, if we have the courage to pursue them.",
        "It's kind of fun to do the impossible.",
        "The way to get started is to quit talking and begin doing.",
        "Disneyland is a work of love.",
        "Mickey Mouse!",
        "Snow White!",
        "Magic Kingdom!",
        "Imagination!",
        "Happiest place on earth!",
      ],
    },
    "Frank Sinatra": {
      image: "",
      quotes: [
        "I did it my way!",
        "Fly me to the moon!",
        "New York, New York!",
        "That's life!",
        "The best revenge is massive success.",
        "Rat Pack!",
        "Chairman of the Board!",
        "Old Blue Eyes!",
        "Ring-a-ding-ding!",
      ],
    },
    "Ludwig van Beethoven": {
      image: "",
      quotes: [
        "Music should strike fire from the heart of man, and tears from the eyes of woman.",
        "The immortal god divides his time between music and love.",
        "Don't only practice your art, but force your way into its secrets.",
        "Symphony No. 9!",
        "Ode to Joy!",
        "Moonlight Sonata!",
        "Fifth Symphony!",
        "Für Elise!",
        "Deaf composer!",
      ],
    },
    "Jane Austen": {
      image: "",
      quotes: [
        "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
        "There is nothing like staying at home for real comfort.",
        "The little things are infinitely the most important.",
        "Pride and Prejudice!",
        "Sense and Sensibility!",
        "Emma!",
        "Mansfield Park!",
        "Persuasion!",
        "Regency romance!",
      ],
    },
    "Jim Morrison": {
      image: "",
      quotes: [
        "Break on through to the other side!",
        "Light my fire!",
        "Riders on the storm!",
        "The Doors!",
        "People are strange!",
        "Love me two times!",
        "Touch me!",
        "Hello, I love you!",
        "Lizard King!",
      ],
    },
    // Missing Capricorn Characters
    "Misa Amane": {
      image: "",
      quotes: [
        "Light-kun!",
        "Misa-Misa!",
        "Second Kira!",
        "Death Note!",
        "Shinigami Eyes!",
        "Gothic Lolita!",
        "Pop idol!",
        "Rem!",
        "Love and justice!",
      ],
    },
    "Obanai Iguro": {
      image: "",
      quotes: [
        "Serpent Breathing!",
        "Kaburamaru!",
        "Snake Hashira!",
        "Mitsuri-chan!",
        "Demon Slayer Corps!",
        "Twisted blade!",
        "Heterochromia!",
        "Serpent coil!",
        "For the innocent!",
      ],
    },
    "Fumikage Tokoyami": {
      image: "",
      quotes: [
        "Dark Shadow!",
        "Revelry in the dark!",
        "Darkness is my ally!",
        "Black Ankh!",
        "Shadow manipulation!",
        "Dark quirk!",
        "Plus Ultra!",
        "Hero training!",
        "Embrace the darkness!",
      ],
    },
    Sasori: {
      image: "",
      quotes: [
        "Art is eternal!",
        "Puppet master!",
        "Red Sand!",
        "Human puppets!",
        "Akatsuki member!",
        "Iron Sand techniques!",
        "Third Kazekage puppet!",
        "Eternal beauty!",
        "Grandmother Chiyo!",
      ],
    },
    "Denzel Washington": {
      image: "",
      quotes: [
        "My man!",
        "Training Day!",
        "Malcolm X!",
        "The Equalizer!",
        "Flight!",
        "Fences!",
        "He Got Game!",
        "Man on Fire!",
        "Remember the Titans!",
      ],
    },
    "Michelle Obama": {
      image: "",
      quotes: [
        "When they go low, we go high!",
        "Success isn't about how much money you make; it's about the difference you make in people's lives.",
        "There is no limit to what we, as women, can accomplish.",
        "Let's move!",
        "Becoming!",
        "Girls' education!",
        "First Lady!",
        "Barack and I!",
        "Hope and change!",
      ],
    },
    "Kate Middleton": {
      image: "",
      quotes: [
        "The children are our future!",
        "Mental health matters!",
        "Early years development!",
        "Royal duties!",
        "Catherine, Princess of Wales!",
        "Heads Together!",
        "Photography passion!",
        "Family values!",
        "Public service!",
      ],
    },
    "Martin Luther King Jr.": {
      image: "",
      quotes: [
        "I have a dream!",
        "Injustice anywhere is a threat to justice everywhere.",
        "The time is always right to do what is right.",
        "Darkness cannot drive out darkness; only light can do that.",
        "Our lives begin to end the day we become silent about things that matter.",
        "March on Washington!",
        "Civil rights!",
        "Non-violent resistance!",
        "Free at last!",
      ],
    },
    "David Bowie": {
      image: "",
      quotes: [
        "Let's dance!",
        "Space Oddity!",
        "Ziggy Stardust!",
        "Heroes!",
        "Changes!",
        "The Man Who Sold the World!",
        "Diamond Dogs!",
        "Blackstar!",
        "Starman!",
      ],
    },
    "Elvis Presley": {
      image: "",
      quotes: [
        "Thank you, thank you very much!",
        "I'm all shook up!",
        "Love me tender!",
        "Hound dog!",
        "Jailhouse Rock!",
        "Can't help falling in love!",
        "Burning love!",
        "The King!",
        "Graceland!",
      ],
    },
    "Isaac Newton": {
      image: "",
      quotes: [
        "If I have seen further it is by standing on the shoulders of giants.",
        "What goes up must come down!",
        "For every action, there is an equal and opposite reaction.",
        "I can calculate the motion of heavenly bodies, but not the madness of people.",
        "Gravity!",
        "Laws of motion!",
        "Principia Mathematica!",
        "Apple falling!",
        "Scientific revolution!",
      ],
    },
    "Stephen Hawking": {
      image: "",
      quotes: [
        "Intelligence is the ability to adapt to change.",
        "We are just an advanced breed of monkeys on a minor planet.",
        "The greatest enemy of knowledge is not ignorance, it is the illusion of knowledge.",
        "Black holes!",
        "A Brief History of Time!",
        "Theoretical physics!",
        "The universe!",
        "Time travel!",
        "Hawking radiation!",
      ],
    },
    "Dolly Parton": {
      image: "",
      quotes: [
        "9 to 5!",
        "Jolene!",
        "I Will Always Love You!",
        "Coat of Many Colors!",
        "Islands in the Stream!",
        "Here You Come Again!",
        "Working 9 to 5!",
        "Country music queen!",
        "Dollywood!",
      ],
    },
    // Missing Aquarius Characters
    "Obito Uchiha": {
      image: "",
      quotes: [
        "I'm going to create a world where heroes don't need to exist!",
        "Those who break the rules are scum, but those who abandon their friends are worse than scum!",
        "Kamui!",
        "Ten-Tails jinchuriki!",
        "Tobi is a good boy!",
        "Infinite Tsukuyomi!",
        "Rin!",
        "Madara's plan!",
        "Orange mask!",
      ],
    },
    "Konohamaru Sarutobi": {
      image: "",
      quotes: [
        "I'm gonna be Hokage!",
        "Rasengan!",
        "Sexy Jutsu!",
        "Third Hokage's grandson!",
        "Team 7 sensei!",
        "Ninja way!",
        "Sarutobi clan!",
        "Fire Style techniques!",
        "Next generation!",
      ],
    },
    "Sanemi Shinazugawa": {
      image: "",
      quotes: [
        "Wind Breathing!",
        "Wind Hashira!",
        "Genya!",
        "Demon Slayer Corps!",
        "Marechi blood!",
        "Scars and strength!",
        "Protective brother!",
        "Nichirin blade!",
        "Total Concentration!",
      ],
    },
    "Killua Zoldyck": {
      image: "",
      quotes: [
        "Gon, you are light!",
        "Godspeed!",
        "Assassination techniques!",
        "Hunter x Hunter!",
        "Zoldyck family!",
        "Lightning speed!",
        "Nen abilities!",
        "Best friend!",
        "Yo-yo weapons!",
      ],
    },
    "Jennifer Aniston": {
      image: "",
      quotes: [
        "We were on a break!",
        "Friends!",
        "Rachel Green!",
        "The Morning Show!",
        "Marley & Me!",
        "Horrible Bosses!",
        "Cake!",
        "Murder Mystery!",
        "America's sweetheart!",
      ],
    },
    "The Weeknd": {
      image: "",
      quotes: [
        "I can't feel my face!",
        "Blinding Lights!",
        "Starboy!",
        "The Hills!",
        "Earned It!",
        "Call Out My Name!",
        "Save Your Tears!",
        "After Hours!",
        "Dawn FM!",
      ],
    },
    "Abraham Lincoln": {
      image: "",
      quotes: [
        "Four score and seven years ago!",
        "A house divided against itself cannot stand.",
        "Government of the people, by the people, for the people!",
        "Whatever you are, be a good one.",
        "The best way to predict your future is to create it.",
        "Emancipation Proclamation!",
        "Civil War!",
        "Honest Abe!",
        "Gettysburg Address!",
      ],
    },
    "Ronald Reagan": {
      image: "",
      quotes: [
        "Mr. Gorbachev, tear down this wall!",
        "Government is not the solution to our problem; government is the problem.",
        "The greatest leader is not necessarily the one who does the greatest things.",
        "There you go again!",
        "The Gipper!",
        "Morning in America!",
        "Reaganomics!",
        "Hollywood actor!",
        "Conservative icon!",
      ],
    },
    "Bob Marley": {
      image: "",
      quotes: [
        "One love!",
        "No woman, no cry!",
        "Three little birds!",
        "Get up, stand up!",
        "Redemption song!",
        "Buffalo soldier!",
        "Is this love!",
        "Rastafari!",
        "Reggae music!",
      ],
    },
    "Thomas Edison": {
      image: "",
      quotes: [
        "Genius is one percent inspiration, ninety-nine percent perspiration.",
        "I have not failed. I've just found 10,000 ways that won't work.",
        "Opportunity is missed by most people because it is dressed in overalls and looks like work.",
        "Light bulb!",
        "Phonograph!",
        "Motion pictures!",
        "Menlo Park!",
        "Invention factory!",
        "Direct current!",
      ],
    },
    "Charles Darwin": {
      image: "",
      quotes: [
        "It is not the strongest of the species that survives, but the most adaptable.",
        "A man who dares to waste one hour of time has not discovered the value of life.",
        "Ignorance more frequently begets confidence than does knowledge.",
        "Origin of Species!",
        "Evolution!",
        "Natural selection!",
        "Survival of the fittest!",
        "Beagle voyage!",
        "Scientific revolution!",
      ],
    },
    "Ellen DeGeneres": {
      image: "",
      quotes: [
        "Be kind to one another!",
        "Here's to another year of being awesome!",
        "Follow your passion. Stay true to yourself.",
        "Finding Nemo!",
        "The Ellen Show!",
        "Coming out!",
        "Dance party!",
        "Generous giveaways!",
        "LGBTQ+ advocate!",
      ],
    },
    // Missing Pisces Characters
    "Rin Nohara": {
      image: "",
      quotes: [
        "Obito, Kakashi!",
        "Medical ninja!",
        "Team Minato!",
        "Three-Tails jinchuriki!",
        "Hidden Leaf Village!",
        "Sacrifice for village!",
        "Young love!",
        "Tragic fate!",
        "Memories of friendship!",
      ],
    },
    Isaribi: {
      image: "",
      quotes: [
        "Sea creature transformation!",
        "Orochimaru's experiment!",
        "Demon of the Ocean!",
        "Water techniques!",
        "Tragic backstory!",
        "Seeking redemption!",
        "Ocean guardian!",
        "Fish-like abilities!",
        "Hidden power!",
      ],
    },
    "Shinobu Kocho": {
      image: "",
      quotes: [
        "Insect Breathing!",
        "Poison techniques!",
        "Insect Hashira!",
        "Kanao!",
        "Butterfly mansion!",
        "Gentle but deadly!",
        "Demon slayer!",
        "Sister's revenge!",
        "Beautiful butterfly!",
      ],
    },
    "Tamaki Amajiki": {
      image: "",
      quotes: [
        "I want to go home!",
        "Manifest!",
        "Suneater!",
        "Big Three!",
        "Food quirk!",
        "Social anxiety!",
        "Mirio!",
        "Plus Ultra!",
        "Shy hero!",
      ],
    },
    "Gon Freecss": {
      image: "",
      quotes: [
        "I'm gonna find my dad!",
        "Killua!",
        "Hunter x Hunter!",
        "Jajanken!",
        "Nen abilities!",
        "Whale Island!",
        "Hunter License!",
        "Ging Freecss!",
        "Adventure awaits!",
      ],
    },
  };

  const handleCharacterClick = (character) => {
    console.log("Character clicked:", character);

    // Check if character exists in characterData
    if (!characterData[character]) {
      console.error("Character not found in characterData:", character);
      console.log("Available characters:", Object.keys(characterData));
      // Set a generic quote for missing characters
      setSelectedCharacter(character);
      setAvailableQuotes([`Hello! I'm ${character}. Nice to meet you!`]);
      setSelectedQuote(`Hello! I'm ${character}. Nice to meet you!`);
      setShowQuoteModal(true);
      return;
    }

    const characterInfo = characterData[character];
    console.log("Character info:", characterInfo);

    if (!characterInfo.quotes || characterInfo.quotes.length === 0) {
      console.log("No quotes found for character");
      setSelectedCharacter(character);
      setAvailableQuotes([`Hello! I'm ${character}. Nice to meet you!`]);
      setSelectedQuote(`Hello! I'm ${character}. Nice to meet you!`);
      setShowQuoteModal(true);
      return;
    }

    // Get quotes that haven't been used
    const unusedQuotes = characterInfo.quotes.filter(
      (_, index) => !usedQuotes[character]?.includes(index),
    );

    let quotesToShow = unusedQuotes;
    if (unusedQuotes.length === 0) {
      // Reset if all quotes used and show all quotes again
      console.log("All quotes used, resetting");
      setUsedQuotes((prev) => ({ ...prev, [character]: [] }));
      quotesToShow = characterInfo.quotes;
    }

    // Set modal data
    setSelectedCharacter(character);
    setAvailableQuotes(quotesToShow);
    setSelectedQuote(quotesToShow[0]); // Default to first available quote
    setShowQuoteModal(true);
  };

  const handleSendQuote = () => {
    if (selectedQuote && selectedCharacter) {
      // Mark quote as used
      const characterInfo = characterData[selectedCharacter];
      if (characterInfo && characterInfo.quotes) {
        const quoteIndex = characterInfo.quotes.indexOf(selectedQuote);
        if (quoteIndex !== -1) {
          setUsedQuotes((prev) => ({
            ...prev,
            [selectedCharacter]: [
              ...(prev[selectedCharacter] || []),
              quoteIndex,
            ],
          }));
        }
      }

      // Send the quote as a message
      sendMessage(selectedQuote);

      // Close modal
      setShowQuoteModal(false);
      setSelectedCharacter(null);
      setAvailableQuotes([]);
      setSelectedQuote("");
    }
  };

  const handleInsertQuote = () => {
    if (selectedQuote) {
      // Insert quote into message input instead of sending directly
      setMessageInput(selectedQuote);

      // Close modal
      setShowQuoteModal(false);
      setSelectedCharacter(null);
      setAvailableQuotes([]);
      setSelectedQuote("");
    }
  };

  // Emoji picker handlers
  const handleEmojiClick = (emojiData) => {
    setMessageInput((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  // Chat scroll handlers
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  const checkIfUserAtBottom = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      const threshold = 50; // pixels from bottom to consider "at bottom"
      return scrollHeight - scrollTop - clientHeight < threshold;
    }
    return true;
  };

  const handleScroll = () => {
    const atBottom = checkIfUserAtBottom();
    setIsUserAtBottom(atBottom);

    if (atBottom && showNewMessageIndicator) {
      setShowNewMessageIndicator(false);
      setNewMessageCount(0);
    }
  };

  const handleNewMessageIndicatorClick = () => {
    scrollToBottom();
    setShowNewMessageIndicator(false);
    setNewMessageCount(0);
  };

  const AuthPrompt = ({ feature }) => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-8">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🔮</div>
        <h2 className="text-2xl font-bold text-indigo-900 mb-4">
          Sign In Required
        </h2>
        <p className="text-gray-700 mb-6">
          Create an account or sign in to access {feature} and unlock your full
          cosmic potential.
        </p>
        <button
          onClick={onLogin}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
        >
          Sign In / Create Account
        </button>
      </div>
    </div>
  );

  return (
    <main
      className={`flex-1 flex flex-col ${active === "chat" ? "overflow-hidden" : "overflow-auto bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"}`}
    >
      {/* Active Chat Notification */}
      <AnimatePresence>
        {showChatNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg shadow-lg border border-purple-400"
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-medium">Active Chat</span>
              </div>
              <div className="text-sm opacity-90">
                with {matchData?.partner?.name || "Partner"}
              </div>
              <button
                onClick={() => setActive("chat")}
                className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm transition-colors"
              >
                Return to Chat
              </button>
              <button
                onClick={() => setShowChatNotification(false)}
                className="text-white/70 hover:text-white p-1"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {active === "zodiac" && (
        <div className="flex-1 flex flex-col min-h-0">
          <ZodiacCompatibility user={user} onLogin={onLogin} />
        </div>
      )}
      {active === "chat" && (
        <div className="flex-1 flex flex-col min-h-0">
          {user ? (
            <>
              {/* Chat Interface with Sidebar Layout */}
              <div className="flex-1 min-h-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex flex-col md:flex-row relative overflow-hidden">
                {/* Mobile backdrop overlay */}
                {showChatSidebar && (
                  <div
                    className="fixed inset-0 bg-black/60 z-30 md:hidden"
                    onClick={() => setShowChatSidebar(false)}
                  />
                )}

                {/* Chat Sidebar - slide in on mobile, always visible on desktop */}
                <div
                  className={`fixed md:static top-[72px] md:top-auto bottom-0 left-0 z-40 md:z-auto transition-transform duration-300 ease-in-out flex ${
                    showChatSidebar
                      ? "translate-x-0"
                      : "-translate-x-full md:translate-x-0"
                  }`}
                >
                  <ChatSidebar
                    user={user}
                    onNewMatchClick={() => console.log("New match clicked")}
                    onFriendsClick={() => console.log("Friends clicked")}
                    onClose={() => setShowChatSidebar(false)}
                  />
                </div>

                {/* Main Chat Content */}
                <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
                  {/* Mobile sidebar toggle bar */}
                  <button
                    className="md:hidden flex items-center gap-2 bg-slate-800 text-white px-4 py-3 text-sm font-medium border-b border-slate-700 w-full text-left"
                    onClick={() => setShowChatSidebar(true)}
                  >
                    <span className="text-lg">☰</span>
                    <span>Your Chats</span>
                  </button>
                  {isMatched &&
                  matchData &&
                  !chatClosed &&
                  !showMatchFoundModal ? (
                    // Chat Interface - Use the same interface from ZodiacCompatibility
                    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-4 sm:p-6 md:p-8">
                      <div className="max-w-4xl mx-auto w-full flex flex-col flex-1 min-h-0">
                        {/* Chat Header */}
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm flex-shrink-0"
                        >
                          <button
                            onClick={closeChat}
                            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg transition-colors text-sm w-full sm:w-auto justify-center sm:justify-start text-white"
                            title="Close chat and return to queue"
                          >
                            <span>✕</span>
                            <span>Close</span>
                          </button>

                          <div className="text-center flex-1">
                            <h1 className="text-xl sm:text-2xl font-bold">
                              💬 Chatting with{" "}
                              {matchData?.partner?.name || "Partner"}
                            </h1>
                            <p className="text-sm text-purple-200">
                              {matchData?.partner?.sign &&
                                zodiacSymbols[matchData.partner.sign]}{" "}
                              {matchData?.partner?.sign || "Unknown"} •
                              {partnerDisconnected
                                ? " Partner disconnected"
                                : " Real person!"}
                            </p>
                          </div>

                          {partnerDisconnected ? (
                            <button
                              onClick={() => {
                                startNewMatch();
                                // Optionally navigate back to zodiac compatibility
                                setActive("zodiac");
                              }}
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-4 py-2 rounded-lg transition-colors text-sm text-white font-medium"
                            >
                              🔍 Back to Matching
                            </button>
                          ) : (
                            <div className="text-green-400 text-sm">
                              🟢 Connected
                            </div>
                          )}
                        </motion.div>

                        {/* Chat Messages */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="relative flex-1 min-h-0 flex flex-col mb-4"
                        >
                          <div
                            ref={chatContainerRef}
                            onScroll={handleScroll}
                            className="bg-white/5 rounded-xl p-4 flex-1 min-h-0 overflow-y-auto space-y-3"
                          >
                            {messages.map((message) => (
                              <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${
                                  message.type === "sent"
                                    ? "justify-end"
                                    : message.type === "system"
                                      ? "justify-center"
                                      : "justify-start"
                                }`}
                              >
                                <div
                                  className={`max-w-xs sm:max-w-md p-3 rounded-lg ${
                                    message.type === "sent"
                                      ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                                      : message.type === "system"
                                        ? "bg-yellow-500/20 text-yellow-200 text-center text-sm"
                                        : "bg-white/10 text-white"
                                  }`}
                                >
                                  <p className="text-sm sm:text-base">
                                    {message.text}
                                  </p>
                                  <p className="text-xs opacity-70 mt-1">
                                    {message.timestamp}
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                          </div>

                          {/* New Message Indicator */}
                          <AnimatePresence>
                            {showNewMessageIndicator && (
                              <motion.button
                                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 25,
                                }}
                                onClick={handleNewMessageIndicatorClick}
                                className="absolute bottom-6 right-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 transition-all duration-200 z-10"
                              >
                                <span className="text-sm font-medium">
                                  {newMessageCount} new message
                                  {newMessageCount > 1 ? "s" : ""}
                                </span>
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                  />
                                </svg>
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </motion.div>

                        {/* Message Input */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="relative mb-4 flex-shrink-0"
                        >
                          {/* Emoji Picker */}
                          <AnimatePresence>
                            {showEmojiPicker && (
                              <motion.div
                                ref={emojiPickerRef}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute bottom-full mb-2 left-0 z-50"
                              >
                                <EmojiPicker
                                  onEmojiClick={handleEmojiClick}
                                  theme="dark"
                                  width={300}
                                  height={400}
                                  previewConfig={{
                                    showPreview: false,
                                  }}
                                  searchDisabled={false}
                                  skinTonesDisabled={false}
                                  autoFocusSearch={false}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="flex gap-2">
                            <div className="flex-1 relative flex">
                              <input
                                type="text"
                                value={messageInput}
                                onChange={(e) =>
                                  setMessageInput(e.target.value)
                                }
                                onKeyPress={(e) => {
                                  if (
                                    e.key === "Enter" &&
                                    messageInput.trim()
                                  ) {
                                    sendMessage(messageInput.trim());
                                    setMessageInput("");
                                    setIsUserAtBottom(true);
                                    setShowNewMessageIndicator(false);
                                    setNewMessageCount(0);
                                  }
                                }}
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                              />
                              <button
                                onClick={toggleEmojiPicker}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 hover:bg-white/10 rounded-lg transition-colors"
                                type="button"
                              >
                                <span className="text-xl">😀</span>
                              </button>
                            </div>
                            <button
                              onClick={() => {
                                if (messageInput.trim()) {
                                  sendMessage(messageInput.trim());
                                  setMessageInput("");
                                  setIsUserAtBottom(true);
                                  setShowNewMessageIndicator(false);
                                  setNewMessageCount(0);
                                }
                              }}
                              disabled={!messageInput.trim()}
                              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200"
                            >
                              Send
                            </button>
                          </div>
                        </motion.div>

                        {/* Your Zodiac Characters — floating toggle button bottom-left */}
                        <div className="relative">
                          {/* Toggle button */}
                          <button
                            onClick={() =>
                              setShowCharacterPanel(!showCharacterPanel)
                            }
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-purple-300/30 text-white text-sm px-3 py-2 rounded-lg transition-all duration-200"
                          >
                            <span>{zodiacSymbols[user?.zodiacChart?.sun]}</span>
                            <span>
                              Your {user?.zodiacChart?.sun} Characters
                            </span>
                            <svg
                              className={`w-4 h-4 transition-transform duration-200 ${showCharacterPanel ? "rotate-180" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>

                          {/* Expandable panel */}
                          <AnimatePresence>
                            {showCharacterPanel && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.97 }}
                                transition={{ duration: 0.2 }}
                                className="absolute bottom-full mb-2 left-0 right-0 bg-slate-900/95 border border-purple-300/20 rounded-xl p-4 backdrop-blur-sm shadow-2xl z-20"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">
                                      {zodiacSymbols[user?.zodiacChart?.sun]}
                                    </span>
                                    <h3 className="text-sm font-semibold text-purple-200">
                                      Your {user?.zodiacChart?.sun} Characters
                                    </h3>
                                  </div>
                                  <button
                                    onClick={() => setShowCharacterPanel(false)}
                                    className="text-white/50 hover:text-white text-sm p-1 rounded hover:bg-white/10 transition-colors"
                                  >
                                    ✕
                                  </button>
                                </div>

                                {/* Character Carousel */}
                                <div className="character-carousel-container">
                                  <style jsx>{`
                                    .character-carousel-container
                                      :global(.swiper) {
                                      padding: 10px 0;
                                      margin: 0 -8px;
                                    }
                                    .character-carousel-container
                                      :global(.swiper-button-next),
                                    .character-carousel-container
                                      :global(.swiper-button-prev) {
                                      background: rgba(147, 51, 234, 0.7);
                                      backdrop-filter: blur(4px);
                                      border: 1px solid rgba(147, 51, 234, 0.3);
                                      border-radius: 50%;
                                      color: white;
                                      width: 44px;
                                      height: 44px;
                                      margin-top: -22px;
                                      box-shadow: 0 4px 6px -1px
                                        rgba(147, 51, 234, 0.25);
                                      transition: all 0.2s ease;
                                    }
                                    .character-carousel-container
                                      :global(.swiper-button-next:hover),
                                    .character-carousel-container
                                      :global(.swiper-button-prev:hover) {
                                      background: rgba(147, 51, 234, 0.9);
                                      transform: scale(1.1);
                                    }
                                    .character-carousel-container
                                      :global(.swiper-button-next::after),
                                    .character-carousel-container
                                      :global(.swiper-button-prev::after) {
                                      font-size: 16px;
                                      font-weight: bold;
                                    }
                                    .character-carousel-container
                                      :global(.swiper-pagination-bullet) {
                                      background: rgba(168, 85, 247, 0.3);
                                      width: 8px;
                                      height: 8px;
                                      margin: 0 4px !important;
                                      transition: all 0.3s ease;
                                    }
                                    .character-carousel-container
                                      :global(
                                        .swiper-pagination-bullet-active
                                      ) {
                                      background: rgba(168, 85, 247, 1);
                                      transform: scale(1.2);
                                    }
                                    .character-carousel-container
                                      :global(.swiper-pagination) {
                                      position: static !important;
                                      margin-top: 1rem;
                                    }
                                  `}</style>
                                  <Swiper
                                    modules={[Navigation, Pagination]}
                                    spaceBetween={2}
                                    slidesPerView={6}
                                    navigation={allCharacters.length > 6}
                                    pagination={
                                      allCharacters.length > 6
                                        ? { clickable: true }
                                        : false
                                    }
                                    loop={true}
                                    grabCursor={true}
                                    breakpoints={{
                                      320: {
                                        slidesPerView: 2,
                                        spaceBetween: 2,
                                      },
                                      640: {
                                        slidesPerView: 4,
                                        spaceBetween: 2,
                                      },
                                      1024: {
                                        slidesPerView: 6,
                                        spaceBetween: 2,
                                      },
                                    }}
                                  >
                                    {allCharacters.map((character, index) => (
                                      <SwiperSlide
                                        key={`${character}-${index}`}
                                      >
                                        <motion.button
                                          initial={{ opacity: 0, y: 20 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ delay: index * 0.05 }}
                                          whileHover={{
                                            y: -6,
                                            filter: "brightness(1.2)",
                                            scale: 1.03,
                                            transition: { duration: 0.2 },
                                          }}
                                          whileTap={{
                                            scale: 0.95,
                                            transition: { duration: 0.1 },
                                          }}
                                          onClick={() => {
                                            handleCharacterClick(character);
                                            setShowCharacterPanel(false);
                                          }}
                                          className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-300/30 hover:border-purple-400/50 rounded-xl p-4 text-white flex flex-col items-center justify-between h-[140px] w-[140px] shadow-lg shadow-purple-500/10 transition-all duration-300"
                                        >
                                          <div className="rounded-full overflow-hidden bg-gray-700 flex items-center justify-center flex-shrink-0 w-16 h-16">
                                            {characterData[character]?.image ? (
                                              <img
                                                src={
                                                  characterData[character].image
                                                }
                                                alt={character}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  e.target.style.display =
                                                    "none";
                                                  e.target.nextSibling.style.display =
                                                    "flex";
                                                }}
                                              />
                                            ) : null}
                                            <div
                                              className="w-full h-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg"
                                              style={{
                                                display: characterData[
                                                  character
                                                ]?.image
                                                  ? "none"
                                                  : "flex",
                                              }}
                                            >
                                              {character
                                                ?.split(" ")
                                                .map((name) => name[0])
                                                .join("")}
                                            </div>
                                          </div>
                                          <div className="text-center flex-shrink-0 mt-2">
                                            <span
                                              className="font-semibold leading-tight block text-sm"
                                              style={{
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                wordBreak: "break-word",
                                              }}
                                            >
                                              {character}
                                            </span>
                                          </div>
                                        </motion.button>
                                      </SwiperSlide>
                                    ))}
                                  </Swiper>
                                </div>

                                <p className="text-xs text-purple-300/70 mt-3 text-center">
                                  Click any character to share a random quote!
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Queue Interface - When not matched or chat closed
                    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-xl p-8">
                      <div className="text-center max-w-md">
                        <div className="text-6xl mb-6">💬</div>

                        {/* Show reopen chat option if there's an existing match */}
                        {isMatched && matchData && chatClosed ? (
                          <>
                            <h2 className="text-3xl font-bold text-white mb-4">
                              Chat Available
                            </h2>
                            <p className="text-purple-200 mb-8 text-lg">
                              You have an active conversation with{" "}
                              {matchData.partner.name}.
                              {partnerDisconnected
                                ? " (Partner disconnected)"
                                : ""}
                            </p>
                            <div className="flex flex-col gap-4">
                              <button
                                onClick={reopenChat}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                              >
                                💬 Reopen Chat
                              </button>
                              {!partnerDisconnected && (
                                <button
                                  onClick={() => {
                                    if (isQueuing) {
                                      cancelQueue();
                                    } else {
                                      const userData = {
                                        sign: user.zodiacChart.sun,
                                        moon: user.zodiacChart.moon,
                                        rising: user.zodiacChart.rising,
                                        name: user.username,
                                      };
                                      joinQueue(userData);
                                    }
                                  }}
                                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                >
                                  {isQueuing
                                    ? "🔄 Cancel Queue"
                                    : "🌟 Find New Match 🌟"}
                                </button>
                              )}
                              {partnerDisconnected && (
                                <button
                                  onClick={() => {
                                    startNewMatch();
                                    const userData = {
                                      sign: user.zodiacChart.sun,
                                      moon: user.zodiacChart.moon,
                                      rising: user.zodiacChart.rising,
                                      name: user.username,
                                    };
                                    joinQueue(userData);
                                  }}
                                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                >
                                  🔍 Start Fresh Match
                                </button>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <h2 className="text-3xl font-bold text-white mb-4">
                              {isQueuing
                                ? "Finding Your Match..."
                                : "Find Your Cosmic Match"}
                            </h2>
                            <p className="text-purple-200 mb-8 text-lg">
                              {isQueuing
                                ? "We're searching for someone who shares your zodiac energy..."
                                : "Connect with someone who shares your zodiac energy and discover your cosmic compatibility!"}
                            </p>
                            {isQueuing && (
                              <div className="mb-6">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                              </div>
                            )}
                            <button
                              onClick={() => {
                                if (!user) {
                                  onLogin?.();
                                  return;
                                }

                                if (isQueuing) {
                                  cancelQueue();
                                } else {
                                  const userData = {
                                    sign: user.zodiacChart.sun,
                                    moon: user.zodiacChart.moon,
                                    rising: user.zodiacChart.rising,
                                    name: user.username,
                                  };
                                  joinQueue(userData);
                                }
                              }}
                              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            >
                              {isQueuing ? "🔄 Cancel Queue" : "🌟 Queue Up 🌟"}
                            </button>
                            <p className="text-purple-300 mt-4 text-sm">
                              Based on your {user.zodiacChart?.sun || "zodiac"}{" "}
                              sign
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <AuthPrompt feature="Chat & Matching" />
          )}

          {/* Quote Selection Modal */}
          <AnimatePresence>
            {showQuoteModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => setShowQuoteModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, y: 50 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: 50 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-auto border border-purple-400/30 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                        {characterData[selectedCharacter]?.image ? (
                          <img
                            src={characterData[selectedCharacter].image}
                            alt={selectedCharacter}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className="w-full h-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm"
                          style={{
                            display: characterData[selectedCharacter]?.image
                              ? "none"
                              : "flex",
                          }}
                        >
                          {selectedCharacter
                            ?.split(" ")
                            .map((name) => name[0])
                            .join("")}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {selectedCharacter}
                        </h3>
                        <p className="text-purple-300 text-sm">
                          Choose a quote to share
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowQuoteModal(false)}
                      className="text-gray-400 hover:text-white transition-colors p-2"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Quote Selection */}
                  <div className="space-y-4 mb-6">
                    <label className="text-white font-semibold text-sm">
                      Available Quotes:
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availableQuotes.map((quote, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedQuote(quote)}
                          className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                            selectedQuote === quote
                              ? "bg-purple-600/30 border-purple-400 text-white"
                              : "bg-white/5 border-purple-400/20 text-purple-200 hover:bg-white/10 hover:border-purple-400/40"
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{quote}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Quote Preview */}
                  {selectedQuote && (
                    <div className="bg-white/10 rounded-lg p-4 mb-6 border border-purple-400/20">
                      <label className="text-purple-300 text-xs font-semibold">
                        Selected Quote:
                      </label>
                      <p className="text-white mt-1 leading-relaxed">
                        {selectedQuote}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowQuoteModal(false)}
                      className="px-4 py-2 text-purple-300 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleInsertQuote}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
                    >
                      Insert to Input
                    </button>
                    <button
                      onClick={handleSendQuote}
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold"
                    >
                      Send Now
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      {active === "storyteller" && (
        <div className="flex-1 flex flex-col min-h-0">
          <UserProfile
            userProfile={user}
            onEdit={() => {}} // No edit functionality needed in embedded view
            onClose={() => {}} // No close functionality needed in embedded view
            isEmbedded={true}
          />
        </div>
      )}
      {active === "dreammaker" && (
        <div className="flex-1 flex flex-col min-h-0">
          {user ? (
            <div className="flex-1 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-8 flex flex-col items-center justify-center">
              <div className="text-6xl mb-6">🌙</div>
              <h1 className="text-4xl font-bold mb-4 text-white">Dreammaker</h1>
              <p className="text-purple-200 text-lg">
                Bring your dreams to life with AI.
              </p>
            </div>
          ) : (
            <AuthPrompt feature="Dreammaker" />
          )}
        </div>
      )}
      {active === "friends" && (
        <div className="flex-1 flex flex-col min-h-0">
          <Friends user={user} onLogin={onLogin} />
        </div>
      )}
      {active === "notes" && (
        <div className="flex-1 flex flex-col min-h-0">
          {user ? (
            <Notes user={user} />
          ) : (
            <AuthPrompt feature="your personal notes" />
          )}
        </div>
      )}
      {active === "cardgame" && (
        <div className="flex-1 flex flex-col min-h-0">
          <MysticElements user={user} onLogin={onLogin} />
        </div>
      )}

      {/* Match Found Modal */}
      <AnimatePresence>
        {showMatchFoundModal && matchData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6 rounded-2xl border border-purple-300/30 max-w-md w-full text-center shadow-2xl"
            >
              {/* Match Found Header */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                className="text-4xl mb-4"
              >
                ✨
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-white mb-4"
              >
                Match Found!
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-4"
              >
                {/* Zodiac Signs in the Middle */}
                <div className="flex items-center justify-center gap-8 mb-4">
                  <div className="text-center">
                    <div className="text-purple-200 text-sm font-semibold mb-2">
                      {user?.username || "You"}
                    </div>
                    <div className="text-6xl mb-1">
                      {zodiacSymbols[user?.zodiacChart?.sun]}
                    </div>
                    <div className="text-purple-200 text-xs">
                      {user?.zodiacChart?.sun || "Unknown"}
                    </div>
                  </div>

                  <div className="text-purple-300 text-4xl mt-6">💕</div>

                  <div className="text-center">
                    <div className="text-purple-200 text-sm font-semibold mb-2">
                      {matchData.partner?.name || "Partner"}
                    </div>
                    <div className="text-6xl mb-1">
                      {zodiacSymbols[matchData.partner?.sign]}
                    </div>
                    <div className="text-purple-200 text-xs">
                      {matchData.partner?.sign || "Unknown"}
                    </div>
                  </div>
                </div>

                {/* Compatibility Slider */}
                <div className="bg-white/10 p-4 rounded-xl border border-purple-300/30">
                  <div className="text-center mb-3">
                    <div className="text-purple-200 text-sm mb-2">
                      Cosmic Compatibility
                    </div>
                    <div className="text-2xl font-bold text-white mb-3">
                      {matchData.compatibility || 85}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${matchData.compatibility || 85}%` }}
                      transition={{
                        delay: 0.6,
                        duration: 1.5,
                        ease: "easeOut",
                      }}
                      className="h-full rounded-full relative"
                      style={{
                        background: `linear-gradient(90deg, 
                          #ec4899 0%, 
                          #8b5cf6 50%, 
                          #3b82f6 100%)`,
                      }}
                    >
                      {/* Sparkle effect on the progress bar */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-pulse"></div>
                    </motion.div>
                  </div>

                  {/* Compatibility labels */}
                  <div className="flex justify-between mt-2 text-xs text-purple-300">
                    <span>✨</span>
                    <span>🌟</span>
                    <span>💫</span>
                  </div>
                </div>
              </motion.div>

              {/* Join Chat Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMatchFoundModal(false)}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl text-base shadow-lg hover:shadow-xl transition-all duration-300 w-full"
              >
                💬 Join Chat
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
