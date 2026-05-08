@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
  
  --color-brand-bg: #F3F4F6;
  --color-brand-ink: #111827;
  --color-brand-line: #D1D5DB;
  --color-brand-accent: #059669;
  --color-brand-warning: #D97706;
  --color-brand-danger: #DC2626;
}

@layer base {
  body {
    @apply antialiased text-brand-ink bg-brand-bg font-sans;
  }
}

/* Technical Component Patterns */
@layer components {
  .tech-card {
    @apply bg-white border border-brand-line rounded-sm shadow-sm;
  }
  
  .tech-label {
    @apply text-[11px] uppercase font-semibold text-zinc-500 tracking-wider;
  }
  
  .tech-value {
    @apply font-mono font-bold tracking-tight;
  }
  
  .tech-table-header {
    @apply bg-zinc-50 border-b-2 border-brand-line text-[11px] uppercase font-bold text-zinc-500 py-3 px-4;
  }
}

/* Custom Scrollbar Styles */
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

::-webkit-scrollbar-track {
  @apply bg-zinc-100;
}

::-webkit-scrollbar-thumb {
  @apply bg-zinc-300 rounded-none hover:bg-zinc-500 transition-colors cursor-pointer;
  border: 1px solid #e4e4e7;
}

::-webkit-scrollbar-thumb:active {
  @apply bg-zinc-600;
}
