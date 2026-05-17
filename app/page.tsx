import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-12 flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="w-full max-w-5xl relative z-10">
        <ChatInterface />
      </div>
    </main>
  );
}