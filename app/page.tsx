import ChatUI from './components/ChatUI';

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b border-neutral-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Gemini 2.0 Studio
            </h1>
            <p className="text-neutral-400 text-sm mt-1">Infinite Predictions • Apache 2.0 License</p>
          </div>
          <div className="px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
            Edge Runtime Active
          </div>
        </header>

        <ChatUI />
      </div>
    </main>
  );
}
