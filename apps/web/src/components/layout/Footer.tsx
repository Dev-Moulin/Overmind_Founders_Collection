export function Footer() {
  return (
    <footer className="px-6 py-4 border-t border-white/10 bg-black/20 backdrop-blur-sm">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/60">
        <div className="flex items-center gap-2">
          <span>Built on</span>
          <a
            href="https://www.intuition.systems/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-400 hover:text-primary-300 transition-colors"
          >
            INTUITION
          </a>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/Dev-Moulin/intuition-founders-totem"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://base.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Base
          </a>
        </div>
      </div>
    </footer>
  );
}
