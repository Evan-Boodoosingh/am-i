import Image from "next/image";
import { config } from "@/constants/config";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-4 w-full max-w-xs md:max-w-sm">
       <Image
  src="/images/logo.png"
  alt="Am I? logo"
  width={80}
  height={80}
  className="rounded-2xl w-16 h-16 md:w-24 md:h-24"
/>

        <div className="text-center">
          <h1 className="text-3xl font-medium text-text-primary">
            {config.app.name}
          </h1>
          <p className="text-text-secondary text-sm mt-2">
            {config.app.tagline}
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full mt-8">
          <button className="w-full py-4 rounded-button bg-accent text-white font-medium text-base transition-opacity duration-200 hover:opacity-90 active:opacity-75 cursor-pointer">
            Create room
          </button>
          <button className="w-full py-4 rounded-button font-medium text-base text-accent border border-accent bg-transparent transition-all duration-200 hover:bg-accent hover:text-white active:opacity-75 cursor-pointer">
            Join room
          </button>
          <button className="text-sm mt-2 transition-opacity duration-200 hover:opacity-75 cursor-pointer">
  <span className="text-accent">Sign in</span>
  <span className="text-text-primary"> to save your tally</span>
</button>
        </div>
      </div>
    </main>
  );
}
