import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Card types for Conscious (Runner)
const CONSCIOUS_CARDS = {
  LOGIC: {
    symbol: "🧠",
    color: "from-blue-400 to-cyan-500",
    name: "Logic",
    cost: 1,
    strength: 2,
  },
  INTUITION: {
    symbol: "✨",
    color: "from-purple-400 to-pink-500",
    name: "Intuition",
    cost: 2,
    strength: 3,
  },
  MEMORY: {
    symbol: "💭",
    color: "from-green-400 to-emerald-500",
    name: "Memory",
    cost: 1,
    strength: 1,
  },
  FOCUS: {
    symbol: "🎯",
    color: "from-yellow-400 to-orange-500",
    name: "Focus",
    cost: 3,
    strength: 4,
  },
  INSIGHT: {
    symbol: "👁️",
    color: "from-indigo-400 to-purple-500",
    name: "Insight",
    cost: 2,
    strength: 2,
  },
};

// Card types for Subconscious (Corp)
const SUBCONSCIOUS_CARDS = {
  FEAR: {
    symbol: "😰",
    color: "from-red-400 to-red-600",
    name: "Fear",
    cost: 2,
    strength: 3,
  },
  DOUBT: {
    symbol: "❓",
    color: "from-gray-400 to-gray-600",
    name: "Doubt",
    cost: 1,
    strength: 2,
  },
  HABIT: {
    symbol: "🔄",
    color: "from-brown-400 to-orange-600",
    name: "Habit",
    cost: 3,
    strength: 4,
  },
  IMPULSE: {
    symbol: "⚡",
    color: "from-pink-400 to-red-500",
    name: "Impulse",
    cost: 1,
    strength: 1,
  },
  SHADOW: {
    symbol: "🌑",
    color: "from-black to-gray-700",
    name: "Shadow",
    cost: 2,
    strength: 3,
  },
};

// Servers that Subconscious defends
const SERVERS = {
  MEMORY_CORE: {
    name: "Memory Core",
    symbol: "🧬",
    defenseRequired: 5,
    reward: 3,
  },
  EMOTION_HUB: {
    name: "Emotion Hub",
    symbol: "❤️",
    defenseRequired: 4,
    reward: 2,
  },
  DREAM_ARCHIVE: {
    name: "Dream Archive",
    symbol: "🌙",
    defenseRequired: 6,
    reward: 4,
  },
};

function MysticElements() {
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [gamePhase, setGamePhase] = useState("setup"); // setup, conscious_turn, subconscious_turn, run_attempt, game_over
  const [currentTurn, setCurrentTurn] = useState(1);

  // Player resources
  const [consciousHand, setConsciousHand] = useState([]);
  const [subconsciousHand, setSubconsciousHand] = useState([]);
  const [consciousCredits, setConsciousCredits] = useState(5);
  const [subconsciousCredits, setSubconsciousCredits] = useState(5);
  const [consciousScore, setConsciousScore] = useState(0);
  const [subconsciousScore, setSubconsciousScore] = useState(0);

  // Game elements
  const [servers, setServers] = useState({});
  const [selectedCards, setSelectedCards] = useState([]);
  const [targetServer, setTargetServer] = useState(null);
  const [lastAction, setLastAction] = useState(null);
  const [winner, setWinner] = useState(null);

  // Initialize decks and deal cards
  const createDecks = () => {
    const consciousDeck = [];
    const subconsciousDeck = [];

    // Create Conscious deck (3 of each card type)
    Object.entries(CONSCIOUS_CARDS).forEach(([key, card]) => {
      for (let i = 0; i < 3; i++) {
        consciousDeck.push({ id: `${key}_${i}`, type: key, ...card });
      }
    });

    // Create Subconscious deck (3 of each card type)
    Object.entries(SUBCONSCIOUS_CARDS).forEach(([key, card]) => {
      for (let i = 0; i < 3; i++) {
        subconsciousDeck.push({ id: `${key}_${i}`, type: key, ...card });
      }
    });

    return {
      conscious: consciousDeck.sort(() => Math.random() - 0.5),
      subconscious: subconsciousDeck.sort(() => Math.random() - 0.5),
    };
  };

  // Initialize servers with defenses
  const initializeServers = () => {
    const initialServers = {};
    Object.entries(SERVERS).forEach(([key, server]) => {
      initialServers[key] = {
        ...server,
        defenses: [],
        isProtected: false,
      };
    });
    return initialServers;
  };

  // Start new game
  const startGame = () => {
    const decks = createDecks();

    // Deal initial hands
    setConsciousHand(decks.conscious.splice(0, 5));
    setSubconsciousHand(decks.subconscious.splice(0, 5));

    // Initialize game state
    setServers(initializeServers());
    setConsciousCredits(5);
    setSubconsciousCredits(5);
    setConsciousScore(0);
    setSubconsciousScore(0);
    setGamePhase("conscious_turn");
    setCurrentTurn(1);
    setSelectedCards([]);
    setTargetServer(null);
    setLastAction(null);
    setWinner(null);
    setGameStarted(true);
  };

  // Card selection
  const toggleCardSelection = (cardId) => {
    if (selectedCards.includes(cardId)) {
      setSelectedCards(selectedCards.filter((id) => id !== cardId));
    } else {
      setSelectedCards([...selectedCards, cardId]);
    }
  };

  // Play a card (install program for Conscious or install defense for Subconscious)
  const playCard = (cardId) => {
    if (gamePhase === "conscious_turn") {
      const card = consciousHand.find((c) => c.id === cardId);
      if (card && consciousCredits >= card.cost) {
        setConsciousCredits(consciousCredits - card.cost);
        setConsciousHand(consciousHand.filter((c) => c.id !== cardId));
        setLastAction({
          type: "install",
          player: "conscious",
          card: card.name,
        });
      }
    } else if (gamePhase === "subconscious_turn") {
      const card = subconsciousHand.find((c) => c.id === cardId);
      if (card && subconsciousCredits >= card.cost && targetServer) {
        setSubconsciousCredits(subconsciousCredits - card.cost);
        setSubconsciousHand(subconsciousHand.filter((c) => c.id !== cardId));

        // Add defense to server
        const newServers = { ...servers };
        newServers[targetServer].defenses.push(card);
        setServers(newServers);
        setLastAction({
          type: "defend",
          player: "subconscious",
          card: card.name,
          server: SERVERS[targetServer].name,
        });
      }
    }
    setSelectedCards([]);
  };

  // Attempt a run on a server
  const attemptRun = (serverKey) => {
    const server = servers[serverKey];
    const totalDefense = server.defenses.reduce(
      (sum, defense) => sum + defense.strength,
      0,
    );

    // Calculate Conscious attack strength (simplified - using credits as attack strength)
    const attackStrength = consciousCredits;

    if (
      attackStrength >= totalDefense &&
      attackStrength >= server.defenseRequired
    ) {
      // Successful run
      setConsciousScore(consciousScore + server.reward);
      setLastAction({
        type: "successful_run",
        player: "conscious",
        server: server.name,
        reward: server.reward,
      });

      // Clear server defenses
      const newServers = { ...servers };
      newServers[serverKey].defenses = [];
      setServers(newServers);

      // Spend credits for the run
      setConsciousCredits(Math.max(0, consciousCredits - totalDefense));

      // Check win condition
      if (consciousScore + server.reward >= 7) {
        setWinner("Conscious");
        setGamePhase("game_over");
        return;
      }
    } else {
      // Failed run
      setLastAction({
        type: "failed_run",
        player: "conscious",
        server: server.name,
      });
    }

    // End turn
    endTurn();
  };

  // End current turn
  const endTurn = () => {
    if (gamePhase === "conscious_turn") {
      setGamePhase("subconscious_turn");
      setSubconsciousCredits(subconsciousCredits + 1); // Gain credits
    } else {
      setGamePhase("conscious_turn");
      setConsciousCredits(consciousCredits + 1); // Gain credits
      setCurrentTurn(currentTurn + 1);

      // Check turn limit
      if (currentTurn >= 10) {
        if (consciousScore > subconsciousScore) {
          setWinner("Conscious");
        } else if (subconsciousScore > consciousScore) {
          setWinner("Subconscious");
        } else {
          setWinner("Tie");
        }
        setGamePhase("game_over");
      }
    }
    setSelectedCards([]);
    setTargetServer(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-3 md:p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
          🧠 Conscious vs Subconscious 🌙
        </h1>
        <p className="text-gray-700 text-lg mb-6">
          Netrunner-style psychological warfare! Conscious infiltrates,
          Subconscious defends.
        </p>

        {!gameStarted && gamePhase !== "game_over" ? (
          <motion.button
            onClick={startGame}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Begin Infiltration
          </motion.button>
        ) : gamePhase === "game_over" ? (
          <div className="text-center mb-6">
            <div className="text-4xl font-bold mb-4">
              {winner === "Tie" ? "🤝 Stalemate!" : `🏆 ${winner} Prevails!`}
            </div>
            <div className="text-xl mb-4">
              Access Points: Conscious: {consciousScore} | Subconscious:{" "}
              {subconsciousScore}
            </div>
            <motion.button
              onClick={startGame}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              New Infiltration
            </motion.button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 md:gap-6 mb-6 text-center text-sm md:text-base">
            <div className="bg-cyan-100 p-4 rounded-lg">
              <div className="text-2xl font-bold text-cyan-800">
                🧠 Conscious
              </div>
              <div className="text-lg">Credits: {consciousCredits}</div>
              <div className="text-lg">Access Points: {consciousScore}/7</div>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="text-xl font-bold">Turn {currentTurn}/10</div>
              <div className="text-lg font-semibold text-purple-600">
                {gamePhase === "conscious_turn"
                  ? "Conscious Turn"
                  : "Subconscious Turn"}
              </div>
              {lastAction && (
                <div className="text-sm mt-2 p-2 bg-white rounded">
                  {lastAction.type === "successful_run" &&
                    `🎯 ${lastAction.player} infiltrated ${lastAction.server} (+${lastAction.reward})`}
                  {lastAction.type === "failed_run" &&
                    `❌ ${lastAction.player} failed to access ${lastAction.server}`}
                  {lastAction.type === "install" &&
                    `⚡ ${lastAction.player} installed ${lastAction.card}`}
                  {lastAction.type === "defend" &&
                    `🛡️ ${lastAction.player} defended ${lastAction.server} with ${lastAction.card}`}
                </div>
              )}
            </div>
            <div className="bg-purple-100 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-800">
                🌙 Subconscious
              </div>
              <div className="text-lg">Credits: {subconsciousCredits}</div>
              <div className="text-lg">Defense Score: {subconsciousScore}</div>
            </div>
          </div>
        )}
      </div>

      {gameStarted && gamePhase !== "game_over" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* Servers Section */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4 text-center text-gray-800">
              🏛️ Subconscious Servers 🏛️
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(servers).map(([serverKey, server]) => (
                <motion.div
                  key={serverKey}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    targetServer === serverKey
                      ? "border-purple-400 bg-purple-100"
                      : "border-gray-300 bg-white hover:border-purple-300"
                  }`}
                  onClick={() => {
                    if (gamePhase === "subconscious_turn") {
                      setTargetServer(
                        targetServer === serverKey ? null : serverKey,
                      );
                    } else if (gamePhase === "conscious_turn") {
                      attemptRun(serverKey);
                    }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{server.icon}</div>
                    <div className="font-bold text-lg">{server.name}</div>
                    <div className="text-sm text-gray-600 mb-2">
                      {server.description}
                    </div>
                    <div className="text-sm">
                      <div>Defense Required: {server.defenseRequired}</div>
                      <div>Reward: {server.reward} points</div>
                      <div>Defenses: {server.defenses.length}</div>
                    </div>
                    {server.defenses.length > 0 && (
                      <div className="mt-2">
                        {server.defenses.map((defense, idx) => (
                          <div
                            key={idx}
                            className="text-xs bg-purple-200 rounded px-2 py-1 m-1 inline-block"
                          >
                            🛡️ {defense.name} ({defense.strength})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Current Player's Hand */}
          <div className="mb-8">
            <h3
              className={`text-2xl font-bold mb-4 text-center ${
                gamePhase === "conscious_turn"
                  ? "text-cyan-800"
                  : "text-purple-800"
              }`}
            >
              {gamePhase === "conscious_turn"
                ? "🧠 Conscious Programs"
                : "🌙 Subconscious Defenses"}
            </h3>
            <div className="flex justify-center gap-4 flex-wrap">
              {(gamePhase === "conscious_turn"
                ? consciousHand
                : subconsciousHand
              ).map((card) => (
                <motion.div
                  key={card.id}
                  onClick={() => playCard(card.id)}
                  className={`relative w-32 h-48 rounded-xl cursor-pointer transition-all ${
                    selectedCards.includes(card.id)
                      ? "ring-4 ring-yellow-400 transform -translate-y-2"
                      : "hover:transform hover:-translate-y-1"
                  } ${
                    (gamePhase === "conscious_turn" &&
                      consciousCredits >= card.cost) ||
                    (gamePhase === "subconscious_turn" &&
                      subconsciousCredits >= card.cost &&
                      targetServer)
                      ? "opacity-100"
                      : "opacity-50"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div
                    className={`w-full h-full bg-gradient-to-br ${
                      gamePhase === "conscious_turn"
                        ? "from-cyan-400 to-blue-600"
                        : "from-purple-400 to-pink-600"
                    } rounded-xl shadow-lg flex flex-col items-center justify-center text-white p-2`}
                  >
                    <div className="text-3xl mb-2">{card.icon}</div>
                    <div className="text-sm font-bold text-center">
                      {card.name}
                    </div>
                    <div className="text-xs mt-1">Cost: {card.cost}</div>
                    <div className="text-xs">Strength: {card.strength}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center mb-8 space-x-4">
            {gamePhase === "subconscious_turn" && targetServer && (
              <div className="text-sm mb-2 text-purple-600">
                🎯 Selected Server: {SERVERS[targetServer].name}
              </div>
            )}
            <motion.button
              onClick={endTurn}
              className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              End Turn
            </motion.button>
          </div>

          {/* Game Instructions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-gray-200 mb-6"
          >
            <h3 className="text-xl font-bold mb-4 text-center text-gray-800">
              How to Play
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-cyan-50 rounded-lg">
                <h4 className="font-bold text-cyan-800 mb-2">
                  🧠 Conscious (Runner)
                </h4>
                <ul className="space-y-1 text-gray-700">
                  <li>• Install programs by clicking cards</li>
                  <li>• Run on servers by clicking them</li>
                  <li>• Need enough credits to break defenses</li>
                  <li>• Win by reaching 7 access points</li>
                </ul>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="font-bold text-purple-800 mb-2">
                  🌙 Subconscious (Corp)
                </h4>
                <ul className="space-y-1 text-gray-700">
                  <li>• Select a server first</li>
                  <li>• Install defenses on selected server</li>
                  <li>• Protect your valuable data</li>
                  <li>• Win by preventing access</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Spell Combinations Guide */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white/80 backdrop-blur-lg rounded-xl p-6 border border-gray-200"
          >
            <h3 className="text-xl font-bold mb-4 text-center text-gray-800">
              Card Types
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-bold text-cyan-800 mb-2">
                  🧠 Conscious Programs
                </h4>
                {Object.entries(CONSCIOUS_CARDS).map(([key, card]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 p-2 bg-cyan-50 rounded-lg mb-1"
                  >
                    <span>{card.icon}</span>
                    <span className="font-semibold">{card.name}</span>
                    <span className="text-cyan-600">
                      ({card.cost}₵, {card.strength}💪)
                    </span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="font-bold text-purple-800 mb-2">
                  🌙 Subconscious Defenses
                </h4>
                {Object.entries(SUBCONSCIOUS_CARDS).map(([key, card]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg mb-1"
                  >
                    <span>{card.icon}</span>
                    <span className="font-semibold">{card.name}</span>
                    <span className="text-purple-600">
                      ({card.cost}₵, {card.strength}🛡️)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default MysticElements;
