export default function App() {
  return (
    <main className="min-h-screen bg-teal-deep p-8 text-parchment">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-5xl uppercase tracking-widest text-parchment">
          Akta Kasandry
        </h1>
        <p className="font-body mt-2 text-2xl italic text-gold">
          Rozdarte Sumienie — Boston 1924
        </p>

        <hr className="my-8 border-gold-muted" />

        <h2 className="font-display text-2xl uppercase tracking-wider text-gold">
          Próba polskich znaków
        </h2>
        <p className="font-body mt-3 text-parchment">
          ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ — Świętość, źródło, łańcuch, żółć.
        </p>
        <p className="font-mono mt-2 text-sm text-parchment">
          Special Elite: <code className="bg-ink px-2 py-1">żywioł grozy</code>
        </p>
      </div>
    </main>
  )
}
