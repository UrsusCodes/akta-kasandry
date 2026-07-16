# Otwórz narzędzia

Ten folder zawiera dwa dodatkowe programy — każdy to zwykła strona internetowa, którą otwiera się lokalnie w przeglądarce, bez internetu i bez instalacji.

- **`transkrypt/`** — pełny tekst nagrania sesji, scena po scenie, z audio (jeśli MG je dołączył). Przydaje się, gdy chcecie sprawdzić dokładnie, co padło w danym momencie — kliknijcie scenę w bocznym panelu, żeby przeskoczyć w nagraniu.
- **`prezentacja/`** — prosty edytor slajdów. Możecie w nim złożyć krótki pokaz ze zdjęć z sesji (własnych albo tych, które MG wrzucił do `Media/`) — przydatne np. do pokazania czegoś reszcie ekipy.

---

## Jak otworzyć (sposób pewny — działa zawsze)

1. Otwórzcie **menedżer plików** systemu (Eksplorator Windows / Finder na Macu) — nie Obsidian.
2. Wejdźcie w ten sam folder co ten plik, czyli `Narzędzia`.
3. Wejdźcie do `transkrypt` albo `prezentacja` i **kliknijcie dwa razy** na `index.html` (transkrypt) lub `edytor.html` (prezentacja).
4. Strona otworzy się w waszej domyślnej przeglądarce.

To zawsze działa — narzędzia to zwykłe pliki na dysku, nie potrzebują Obsidiana.

---

## Sposób wygodniejszy (może zadziałać z poziomu Obsidiana)

Poniższe odnośniki czasem od razu otwierają przeglądarkę po kliknięciu w Obsidianie — a czasem nie, zależnie od wersji programu. Spróbujcie, a jeśli nic się nie stanie, użyjcie sposobu pewnego wyżej.

- [Otwórz transkrypt](transkrypt/index.html)
- [Otwórz edytor prezentacji](prezentacja/edytor.html)

---

## Zanim otworzycie — dwie pułapki

> [!warning] Folder musi być w pełni rozpakowany
> Jeśli dostaliście ten vault jako plik `.zip`, **rozpakujcie go w całości** na dysk, zanim cokolwiek otworzycie. Przeglądarka nie potrafi doczytać towarzyszącego pliku audio, jeśli `index.html` wciąż siedzi w środku zipa.

> [!warning] Dźwięk `.opus` na Macu
> Audio w transkrypcie gra bez problemu w Chrome, Edge i Firefoksie. Na macOS w **Safari** ten format czasem odmawia współpracy — jeśli tak się stanie, otwórzcie stronę w Chrome zamiast Safari.
