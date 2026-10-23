import { Button } from "@ponti-studios/ui/primitives";

export default function App() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8 sm:px-10">
      <header className="flex items-center justify-between border-b border-border pb-5">
        <a aria-label="Project home" className="text-sm font-semibold tracking-tight" href="/">
          New project
        </a>
        <span className="text-xs text-muted-foreground">Built with Ponti UI</span>
      </header>

      <section className="flex flex-1 flex-col items-start justify-center gap-6 py-20">
        <p className="text-sm font-medium text-muted-foreground">A fresh start</p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
          Start with the system. Make the product yours.
        </h1>
        <p className="max-w-xl text-lg leading-8 text-muted-foreground">
          Your project already has Ponti tokens, themes, styles, and components. Replace this page
          with the thing you want to make.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button>Primary action</Button>
          <Button variant="outline">Secondary action</Button>
        </div>
      </section>

      <footer className="border-t border-border py-4 text-xs text-muted-foreground">
        Change the shared system through @ponti-studios/ui; keep product-specific choices here.
      </footer>
    </main>
  );
}
