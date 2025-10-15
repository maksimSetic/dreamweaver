import ZodiacCompatibility from "../Components/Features/ZodiacCompatibility";
import Notes from "../Components/Features/Notes";

export default function MainContent({ active }) {
  return (
    <main className="flex-1 p-10 overflow-auto">
      {active === "zodiac" && (
        <div>
          <ZodiacCompatibility />
        </div>
      )}
      {active === "storyteller" && (
        <div>
          <h1 className="text-3xl font-bold mb-6 text-indigo-900">
            Storyteller
          </h1>
          <p className="text-gray-700 text-lg">
            Create and explore stories here.
          </p>
        </div>
      )}
      {active === "dreammaker" && (
        <div>
          <h1 className="text-3xl font-bold mb-6 text-indigo-900">
            Dreammaker
          </h1>
          <p className="text-gray-700 text-lg">
            Bring your dreams to life with AI.
          </p>
        </div>
      )}
      {active === "notes" && (
        <div>
          <Notes />
        </div>
      )}
    </main>
  );
}
