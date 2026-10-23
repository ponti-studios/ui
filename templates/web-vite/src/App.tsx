import { Button } from "@ponti-studios/ui/primitives";

export default function App() {
  return (
    <main className="starter-page">
      <header className="starter-header">
        <a aria-label="Project home" className="starter-home" href="/">
          New project
        </a>
        <span className="starter-caption">Built with Ponti UI</span>
      </header>

      <section className="starter-content">
        <p className="starter-eyebrow">A fresh start</p>
        <h1 className="starter-title">Start with the system. Make the product yours.</h1>
        <p className="starter-description">
          Your project already has Ponti tokens, themes, styles, and components. Replace this page
          with the thing you want to make.
        </p>
        <div className="starter-actions">
          <Button>Primary action</Button>
          <Button variant="outline">Secondary action</Button>
        </div>
      </section>

      <footer className="starter-footer">
        Change the shared system through @ponti-studios/ui; keep product-specific choices here.
      </footer>
    </main>
  );
}
