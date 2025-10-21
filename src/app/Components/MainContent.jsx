import ZodiacCompatibility from "../Components/Features/ZodiacCompatibility";
import Notes from "../Components/Features/Notes";
import MysticElements from "../Components/Features/MysticElements";

export default function MainContent({ active, user, onLogin }) {
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
    <main className="flex-1 p-6 md:p-10 overflow-auto">
      {active === "zodiac" && (
        <div>
          <ZodiacCompatibility user={user} onLogin={onLogin} />
        </div>
      )}
      {active === "storyteller" && (
        <div>
          {user ? (
            <div>
              <h1 className="text-3xl font-bold mb-6 text-indigo-900">
                Your Profile
              </h1>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-indigo-900">
                      {user.username}
                    </h2>
                    <p className="text-gray-600">
                      {user.zodiacChart.sun} ☉ {user.zodiacChart.moon} ☽{" "}
                      {user.zodiacChart.rising} ↗
                    </p>
                  </div>
                </div>
                <p className="text-gray-700">
                  Welcome to your cosmic profile! Visit the full profile page to
                  explore your complete astrological chart and discover your
                  unique cosmic blueprint.
                </p>
              </div>
            </div>
          ) : (
            <AuthPrompt feature="your profile" />
          )}
        </div>
      )}
      {active === "dreammaker" && (
        <div>
          {user ? (
            <div>
              <h1 className="text-3xl font-bold mb-6 text-indigo-900">
                Dreammaker
              </h1>
              <p className="text-gray-700 text-lg">
                Bring your dreams to life with AI.
              </p>
            </div>
          ) : (
            <AuthPrompt feature="Dreammaker" />
          )}
        </div>
      )}
      {active === "notes" && (
        <div>
          {user ? (
            <Notes user={user} />
          ) : (
            <AuthPrompt feature="your personal notes" />
          )}
        </div>
      )}
      {active === "cardgame" && (
        <div>
          <MysticElements user={user} onLogin={onLogin} />
        </div>
      )}
    </main>
  );
}
