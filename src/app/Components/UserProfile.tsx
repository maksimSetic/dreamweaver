import React from "react";
import { motion } from "framer-motion";
import {
  zodiacSymbols,
  getZodiacDescription,
} from "../utils/zodiacCalculations";
import { UserProfileProps } from "../types/auth";

const UserProfile: React.FC<UserProfileProps> = ({
  userProfile,
  onEdit,
  onClose,
  isEmbedded = false,
}) => {
  if (!userProfile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={
          isEmbedded
            ? "flex-1 p-4 sm:p-6 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"
            : "flex-1 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 sm:p-6"
        }
      >
        <div className="max-w-md mx-auto bg-black/30 backdrop-blur-md rounded-xl p-6 text-center">
          <div className="text-6xl mb-4">🌟</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Welcome to Dreamweaver
          </h2>
          <p className="text-gray-300 mb-6">
            Create your profile to discover your cosmic blueprint and connect
            with compatible souls.
          </p>
          <button
            onClick={onEdit}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
          >
            Create Your Profile
          </button>
        </div>
      </motion.div>
    );
  }

  const { username, zodiacChart } = userProfile;
  const { sun, moon, rising, birthInfo } = zodiacChart;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={
        isEmbedded
          ? "flex-1 p-6 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"
          : "flex-1 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6"
      }
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-3">
          <h1
            className={`text-2xl sm:text-3xl font-bold ${
              isEmbedded ? "text-white" : "text-white"
            }`}
          >
            Your Cosmic Profile
          </h1>
          <div className="flex gap-3">
            <button
              onClick={onEdit}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Edit Profile
            </button>
            {!isEmbedded && (
              <button
                onClick={onClose}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className={
            isEmbedded
              ? "bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-xl p-6 mb-8 shadow-lg border border-purple-300/30"
              : "bg-black/30 backdrop-blur-md rounded-xl p-6 mb-8"
          }
        >
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-white">
                {username.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2
              className={`text-2xl font-bold mb-2 ${
                isEmbedded ? "text-white" : "text-white"
              }`}
            >
              {username}
            </h2>
            <p className={isEmbedded ? "text-gray-300" : "text-gray-300"}>
              Born on {new Date(birthInfo.date).toLocaleDateString()} in{" "}
              {birthInfo.location}
            </p>
          </div>
        </motion.div>

        {/* Zodiac Chart */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {/* Sun Sign */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={
              isEmbedded
                ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-md rounded-xl p-6 border border-yellow-500/30 shadow-lg"
                : "bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-md rounded-xl p-6 border border-yellow-500/30"
            }
          >
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">
                {zodiacSymbols[sun as keyof typeof zodiacSymbols]}
              </div>
              <h3
                className={`text-xl font-bold ${
                  isEmbedded ? "text-yellow-300" : "text-yellow-300"
                }`}
              >
                Sun Sign
              </h3>
              <p
                className={`text-2xl font-bold ${
                  isEmbedded ? "text-white" : "text-white"
                }`}
              >
                {sun}
              </p>
            </div>
            <p
              className={`text-sm leading-relaxed ${
                isEmbedded ? "text-gray-300" : "text-gray-300"
              }`}
            >
              {getZodiacDescription(sun, "sun")}
            </p>
          </motion.div>

          {/* Moon Sign */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={
              isEmbedded
                ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30 shadow-lg"
                : "bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30"
            }
          >
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">
                {zodiacSymbols[moon as keyof typeof zodiacSymbols]}
              </div>
              <h3
                className={`text-xl font-bold ${
                  isEmbedded ? "text-blue-300" : "text-blue-300"
                }`}
              >
                Moon Sign
              </h3>
              <p
                className={`text-2xl font-bold ${
                  isEmbedded ? "text-white" : "text-white"
                }`}
              >
                {moon}
              </p>
            </div>
            <p
              className={`text-sm leading-relaxed ${
                isEmbedded ? "text-gray-300" : "text-gray-300"
              }`}
            >
              {getZodiacDescription(moon, "moon")}
            </p>
          </motion.div>

          {/* Rising Sign */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className={
              isEmbedded
                ? "bg-gradient-to-br from-green-500/20 to-teal-500/20 backdrop-blur-md rounded-xl p-6 border border-green-500/30 shadow-lg"
                : "bg-gradient-to-br from-green-500/20 to-teal-500/20 backdrop-blur-md rounded-xl p-6 border border-green-500/30"
            }
          >
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">
                {zodiacSymbols[rising as keyof typeof zodiacSymbols]}
              </div>
              <h3
                className={`text-xl font-bold ${
                  isEmbedded ? "text-green-300" : "text-green-300"
                }`}
              >
                Rising Sign
              </h3>
              <p
                className={`text-2xl font-bold ${
                  isEmbedded ? "text-white" : "text-white"
                }`}
              >
                {rising}
              </p>
            </div>
            <p
              className={`text-sm leading-relaxed ${
                isEmbedded ? "text-gray-300" : "text-gray-300"
              }`}
            >
              {getZodiacDescription(rising, "rising")}
            </p>
          </motion.div>
        </div>

        {/* Birth Chart Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={
            isEmbedded
              ? "bg-gradient-to-br from-purple-900/80 via-blue-900/80 to-indigo-900/80 backdrop-blur-md rounded-xl p-6 border border-purple-300/30 shadow-lg"
              : "bg-black/30 backdrop-blur-md rounded-xl p-6"
          }
        >
          <h3
            className={`text-xl font-bold mb-4 flex items-center ${
              isEmbedded ? "text-white" : "text-white"
            }`}
          >
            <span className="mr-2">✨</span>
            Your Cosmic Blueprint
          </h3>
          <div
            className={`leading-relaxed ${
              isEmbedded ? "text-gray-300" : "text-gray-300"
            }`}
          >
            <p className="mb-4">
              Your unique astrological signature reveals a fascinating cosmic
              blend. As a{" "}
              <strong
                className={isEmbedded ? "text-yellow-300" : "text-yellow-300"}
              >
                {sun} Sun
              </strong>
              , you radiate the core essence of {sun.toLowerCase()} energy,
              driving your fundamental identity and life purpose.
            </p>
            <p className="mb-4">
              Your{" "}
              <strong
                className={isEmbedded ? "text-blue-300" : "text-blue-300"}
              >
                {moon} Moon
              </strong>{" "}
              illuminates your emotional landscape, showing how you process
              feelings and what you need for inner security and comfort.
            </p>
            <p>
              With{" "}
              <strong
                className={isEmbedded ? "text-green-300" : "text-green-300"}
              >
                {rising} Rising
              </strong>
              , you present yourself to the world with the energy of{" "}
              {rising.toLowerCase()}, influencing first impressions and your
              natural approach to new experiences.
            </p>
          </div>
        </motion.div>

        {/* Birth Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={
            isEmbedded
              ? "mt-6 bg-gradient-to-br from-purple-800/40 to-indigo-800/40 backdrop-blur-md rounded-xl p-4 border border-purple-400/20"
              : "mt-6 bg-black/20 backdrop-blur-md rounded-xl p-4"
          }
        >
          <h4
            className={`text-lg font-semibold mb-2 ${
              isEmbedded ? "text-white" : "text-white"
            }`}
          >
            Birth Information
          </h4>
          <div
            className={`grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm ${
              isEmbedded ? "text-gray-300" : "text-gray-300"
            }`}
          >
            <div>
              <span
                className={
                  isEmbedded ? "text-gray-400 font-semibold" : "text-gray-400"
                }
              >
                Date:
              </span>
              <br />
              {new Date(birthInfo.date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div>
              <span
                className={
                  isEmbedded ? "text-gray-400 font-semibold" : "text-gray-400"
                }
              >
                Time:
              </span>
              <br />
              {birthInfo.time}
            </div>
            <div>
              <span
                className={
                  isEmbedded ? "text-gray-400 font-semibold" : "text-gray-400"
                }
              >
                Location:
              </span>
              <br />
              {birthInfo.location}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default UserProfile;
