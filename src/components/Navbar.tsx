
import { Code2, Gamepad2, Terminal, User } from 'lucide-react';

export const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Terminal className="w-6 h-6 text-blue-500" />
            <span className="text-xl font-bold text-white">DevPortfolio</span>
          </div>
          <div className="hidden md:block">
            <div className="flex items-baseline space-x-8">
              <a href="#about" className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors">
                <User className="w-4 h-4" />
                <span>About</span>
              </a>
              <a href="#gamedev" className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors">
                <Gamepad2 className="w-4 h-4" />
                <span>Game Dev</span>
              </a>
              <a href="#devops" className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors">
                <Code2 className="w-4 h-4" />
                <span>DevOps & Automation</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
