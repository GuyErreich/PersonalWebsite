import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { GameDevSection } from '../components/GameDevSection';
import { DevOpsSection } from '../components/DevOpsSection';
import { Footer } from '../components/Footer';

export const Home = () => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-900 text-gray-100 font-sans selection:bg-blue-500/30">
      <Navbar />
      <main>
        <Hero />
        <GameDevSection />
        <DevOpsSection />
      </main>
      <Footer />
    </div>
  );
};
