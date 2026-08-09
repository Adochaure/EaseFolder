export default function Footer() {
  return (
    <footer
      id="footer"
      className="mx-auto max-w-4xl border-dotted border-[#dad8d8] px-4 py-8 sm:px-6 md:border-x"
    >
      <div className="flex flex-col items-center justify-between gap-3 border-t border-dotted border-[rgba(0,114,143,0.35)] pt-6 text-center sm:flex-row sm:text-left">
        <p className="text-sm text-zinc-700 sm:text-[15px]">
          © 2026 EaseFolder. Build, refine, and ship folder structures faster.
        </p>
        <a
          href="https://github.com/Adochaure/EaseFolder"
          aria-label="GitHub"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(0,114,143,0.18)] bg-white/70 text-[rgba(0,114,143,1)] transition hover:bg-white"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-5 w-5 fill-current"
          >
            <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.72.5.09.68-.22.68-.49v-1.72c-2.78.62-3.37-1.36-3.37-1.36-.46-1.2-1.11-1.52-1.11-1.52-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.35 1.11 2.92.85.09-.66.35-1.11.63-1.36-2.22-.26-4.55-1.14-4.55-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05.8-.23 1.66-.35 2.51-.36.85.01 1.71.13 2.51.36 1.91-1.32 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.33 4.79-4.56 5.05.36.32.68.95.68 1.91v2.84c0 .27.18.59.69.49A10.28 10.28 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
          </svg>
        </a>
      </div>
    </footer>
  );
}
