import React, { useState } from "react";
import { motion } from "framer-motion";
import { AuthFormProps } from "../types/auth";

const AuthForm: React.FC<AuthFormProps> = ({ onAuth, onCancel }) => {
  const [isLogin, setIsLogin] = useState(true); // Default to sign-in instead of sign-up
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    birthDate: "",
    birthTime: "",
    birthLocation: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!isLogin) {
      if (!formData.birthDate) {
        newErrors.birthDate = "Birth date is required for zodiac calculations";
      }
      if (!formData.birthTime) {
        newErrors.birthTime = "Birth time is required for accurate rising sign";
      }
      if (!formData.birthLocation.trim()) {
        newErrors.birthLocation =
          "Birth location is required for rising sign calculation";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    onAuth({
      username: formData.username,
      password: formData.password,
      isLogin,
      rememberMe,
      birthDate: formData.birthDate,
      birthTime: formData.birthTime,
      birthLocation: formData.birthLocation,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-black/30 backdrop-blur-md rounded-xl p-6 sm:p-8 border border-white/20"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">✨</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {isLogin ? "Welcome Back" : "Join Stargazer"}
          </h1>
          <p className="text-gray-300">
            {isLogin
              ? "Sign in to access your cosmic profile"
              : "Create your account to discover your zodiac blueprint"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                errors.username
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-600 focus:ring-purple-500"
              }`}
              placeholder="Enter your username"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-400">{errors.username}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                errors.password
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-600 focus:ring-purple-500"
              }`}
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password}</p>
            )}
          </div>

          {/* Birth Information (Registration only) */}
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-4"
            >
              <div className="pt-4 border-t border-gray-600">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <span className="mr-2">🌟</span>
                  Birth Information
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  This information will be used to calculate your Sun, Moon, and
                  Rising signs
                </p>
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Birth Date
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:ring-2 transition-all ${
                    errors.birthDate
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-600 focus:ring-purple-500"
                  }`}
                />
                {errors.birthDate && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.birthDate}
                  </p>
                )}
              </div>

              {/* Birth Time */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Birth Time
                </label>
                <input
                  type="time"
                  name="birthTime"
                  value={formData.birthTime}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white focus:outline-none focus:ring-2 transition-all ${
                    errors.birthTime
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-600 focus:ring-purple-500"
                  }`}
                />
                {errors.birthTime && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.birthTime}
                  </p>
                )}
              </div>

              {/* Birth Location */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Birth Location
                </label>
                <input
                  type="text"
                  name="birthLocation"
                  value={formData.birthLocation}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.birthLocation
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-600 focus:ring-purple-500"
                  }`}
                  placeholder="City, Country"
                />
                {errors.birthLocation && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.birthLocation}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Remember Me Checkbox (only for login) */}
          {isLogin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center space-x-2"
            >
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="rememberMe" className="text-sm text-gray-300">
                Remember me
              </label>
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 mt-6"
          >
            {isLogin ? "Sign In" : "Create Account"}
          </button>

          {/* Guest Login Button */}
          <button
            type="button"
            onClick={() => {
              onAuth({
                username: "Guest",
                password: "",
                isLogin: false,
                isGuest: true,
                birthDate: "1990-01-01",
                birthTime: "12:00",
                birthLocation: "New York, NY",
              });
            }}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300 mt-3"
          >
            Continue as Guest
          </button>
        </form>

        {/* Toggle between login/register */}
        <div className="mt-6 text-center">
          <p className="text-gray-300">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrors({});
              setFormData({
                username: "",
                password: "",
                birthDate: "",
                birthTime: "",
                birthLocation: "",
              });
            }}
            className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
          >
            {isLogin ? "Create Account" : "Sign In"}
          </button>
        </div>

        {/* Cancel Button */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthForm;
