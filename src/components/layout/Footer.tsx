import { Linkedin, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <p className="text-xs text-slate-400">
          &copy; {new Date().getFullYear()} MyStoryFormation.
        </p>
        <div className="flex gap-4 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
          <a
            href="#"
            className="text-slate-600 hover:text-blue-700 transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin className="h-[18px] w-[18px]" />
          </a>
          <a
            href="#"
            className="text-slate-600 hover:text-blue-700 transition-colors"
            aria-label="Instagram"
          >
            <Instagram className="h-[18px] w-[18px]" />
          </a>
        </div>
      </div>
    </footer>
  );
}
