import { useEffect, useMemo } from 'react'
import { AnnotatableArticle } from '@/components/comments/AnnotatableArticle'
import { useAuthStore } from '@/stores/auth'
import { useCastStore } from '@/stores/cast'

/**
 * Session summary — "Rozdarte Sumienie" (RS) — the campaign's main
 * scenario, corrected by the players from the digest draft handed out in
 * the session vault. Cast/name corrections and mechanical typo fixes were
 * applied per the GM's canon review; the transcript link and vault-only
 * artefacts ({sesja:} markers, [!question] callouts, YAML frontmatter) were
 * stripped for the site. Lives inline under the case folder (no separate
 * top-level route, mirrors the UG2 "Galeria" pattern).
 */

const SUMMARY = `# Rozdarte Sumienie (RS) — streszczenie

**System:** Zew Cthulhu · **Strażnik Tajemnic:** Paweł · **Miejsce:** Boston, 1924 (prohibicja)

> Otwiera się główny scenariusz kampanii. Seria morderstw w Bostonie: ofiary przebite wąskim ostrzem (rapierem) i naznaczone **wypalonym symbolem** na ciele. Śledczy z różnych światów — aktorka, lekarz, antykwariusz, okultysta i prywatny detektyw — schodzą się nad jedną sprawą i odkrywają, że wszystkie zwłoki łączy **rzadki tomik poezji**, który „przemienia" swoich czytelników. Trop prowadzi od bostońskich księgarni przez nowojorski hotel aż po ufortyfikowaną willę pod miastem. Tytuł nie jest przypadkowy: cała rzecz kręci się wokół **duszy, którą można rozerwać na części**.

> Na starcie MG rozgrywa **cold open**: w gabinecie ktoś rzuca się na **Martina Mastersa** — ostrze przebija fotel, ofiara sięga po pogrzebacz, zostaje powalona i nakłuta na metalową rączkę. Kilka minut później Masters jest już „denatem", a bohaterowie — każdy z innej strony — trafiają nad jego ciało.

### Obsada

| Gracz | Postać |
| ----- | ----- |
| Nika  | **Lilian Whiteley** — aktorka teatralna, przyjaciółka Mastersa (dostała od niego rapier) |
| Piotr | **dr Steven Price** — majętny lekarz, specjalista od chorób zakaźnych, lekarz Mastersa; |
| Kamil | **Jake Wallis** — antykwariusz z własnym sklepem, znajomy Mastersa |
| Jakub | James "jimmy" Hardy — prywatny detektyw, były policjant, dawniej współpracował z inspektorem Fiskiem, wyleciał ze służby |
| Rafał | Quentin Stanford — okultysta, wycofany społecznie; zafacynowany zakazanymi sztukami |

**BN-i:**
Zamordowany pisarz grozy **Martin Masters** (pod pseudonimem **„Johnson"**);
Inspektor **Peter Fisk** - weteran wielkiej wojny
Odludek-kolekcjoner **Aleksander Kent** z posiadłości **Greyholme** i jego kamerdyner **Silas Stark**;
Martwy poeta **Vincent (Wiktor) Hale**, autor przeklętego tomu;
Sławny podróżnik-pisarz **Jackson Elias**;
Nieprzyjemny handlarz **Gundberg**
Antykwariusz **Hermes**;
Wydawnictwo **Ginlows & Sons**;
Gangsterzy **Mortimer** i **James** oraz powiązani z nimi złodzieje **Gruby Tom** i **Chudy Tom** Ze speakeasy **Rhymers Club**;
Twórca pieczęci **Otto Brandt**;
Kolejne ofiary z listy — **Woodworth**, **Smith**, **Jacobson**.

---

## Akt I — Śledztwo (Boston)

### Przesłuchanie u inspektora Fiska

![Inspektor Peter Fisk](/img/rozdarte-sumienie/cast/fisk.jpg)

Inspektor **Fisk** przyciska **Lilian Whiteley** o jej relację z denatem. Lilian przyznaje bliską znajomość i to, że dostała od Mastersa **rapier** — akurat wtedy, gdy zamordowano go długim, wąskim ostrzem. Detektyw (Jakub) próbuje ustalić pewne fakty dzięki wtykom na komisariacie, ale nakrywa go jego dawny przełożony Inspektor Fisk. Jimmy wywleka swoje żale do policji i „ukręcone śledztwo" w sprawie Quincy'ego. Fisk godzi się na współpracę, ale twardo: **liczą się dowody, nie spekulacje**.

### Seria morderstw i pierwsze tropy

Śledczy ustalają, że to nie pojedyncze zabójstwo: podobne zgony padły w **sierpniu i wrześniu**. Masters był pisarzem obracającym się wokół grozy i okultyzmu, posiadaczem **rzadkich, drogocennych tomów**. Na jego ciele znajduje się **świeże, poważne oparzenie — wypalone tuż po śmierci.** Piętno przedstawia piktogram płomienia. Symbol jest jednocześnie „niszczący, ale i oczyszczający, przemieniający — elementem zmiany". Grupa dzieli się zadaniami: policja, antykwariaty, biblioteki, kontakty.

### Antykwariaty: tom Hale'a i kolekcjoner Kent

![Cornhill — bostońska ulica księgarzy](/img/rozdarte-sumienie/cornhill-ksiegarnie.jpg)

Trop książkowy prowadzi na **Cornhill** — bostońską ulicę księgarzy. Chodzi o **zebrane wiersze** dawno zmarłego poety **Vincenta (Wiktora) Hale'a** — o którym krążyły plotki, że składał „dziewice lub kurczaki w ofierze". Tom istnieje w garstce egzemplarzy; poluje na nie odludek **Aleksander Kent**, który „żyje w posiadłości pod Bostonem" i „porozumiewa się wyłącznie listownie". To kolekcjoner, który zbiera całe serie - zależy mu na zebraniu wszystkich wydrukowanych egzemplarzy książki Hale'a - czyli 7 sztuk. Drugim graczem na rynku jest nieprzyjemny handlarz **Gundberg**, który miał dwa egzemplarze książki, ale zostały mu one skradzione.

---

## Akt II — Tom, teoria i gangsterzy

### Alcot — świadek ze speakeasy

![Speakeasy Rhymers Club](/img/rozdarte-sumienie/rhymers-club.jpg)

Kluczowym świadkiem okazuje się znajomy Lillian, aktor Alcot — który przyznaje, że widział Mastersa w **nielegalnym barze**, gadającego z „podejrzanymi typami". Bohaterowie przyciskają go i dostają namiar na Rhymers club - podejrzaną spelunę pełną mętów i gangsterów.

### "Włamanie" do domu Mastersa

Lillian i Jimmy postanawiają się rozejrzeć w domu Mastersa. Wchodzą za dnia, otwierają posesję znalezionym kluczem, więc "to nie włamanie". Lilian i detektyw wchodzą do mieszkania Mastersa. W gablocie **brakuje jednego rapiera** — narzędzia zbrodni. Znajdują też klucz, kopertę z pieniędzmi (wyliczone 13 dolarów i 45 centów) i **notatki**, które zabierają do analizy. W oczy rzuca im się również szarozółty pył na podłodze, ale nie zabierają próbek. Nerwy przy wyjściu — po ulicy przechadza się posterunkowy — ale ekipa wymyka się czysto.

### Tablica teorii: Kent i siedem tomów

![Tablica z poszlakami — siedem tomów, siedem właścicieli](/img/rozdarte-sumienie/kryjowka-nowy-jork.jpg)
*Poszlaki zebrane w jedną całość: siedem egzemplarzy, siedem właścicieli, martwi po kolei.*

Nad „tablicą" antykwariusz układa cały łańcuch dystrybucji ksiązek Hale'a. Wydawnictwo **Ginlows & Sons** rozprowadziło **siedem egzemplarzy**, pięć trafiło do **Hermesa**, dwa dalej do **Gundberga**, jeden do Mastersa — a właściciele **giną po kolei**. Pada pierwsza wielka hipoteza: **Aleksander Kent zbiera pełną kolekcję** i mógł zlecić morderstwa, żeby odzyskać brakujące tomy. Doktor Price kontruje inną teorią — **dwie grupy**: jedna czerpie z tego, co jest w księgach, druga „piętnuje" pierwszych, bo nie zgadza się, by mieli do tego dostęp. Czas pokaże, że obydwaj byli w błędzie.

### Speakeasy Rhymers Club

![Wnętrze speakeasy Rhymers Club](/img/rozdarte-sumienie/rhymers-club.jpg)

Trop skradzionych tomów prowadzi do speakeasy **Rhymers Club**, gdzie rządzi wyjątkowo szpetny gangster **Mortimer Flannery**. Jego "prawą ręką" i ochroniarzem jest **James** **Kelly** — olbrzymi mężczyzna, po którym widać, że nie stroni od przemocy. Boss przyznaje, że nie jest koneserem literatury, ale wynajął **Grubego i Chudego Toma** do okradzenia Gunberga. Jake oraz Jimmy płacą 100 dolarów za kontakt do złodzieja, który zna ich kryjówkę. Tym samym wydają cały budżet przeznaczony na potencjalne odkupienie tomiku poezji Hale'a. Mimo że kwota jest fortuną, obiecują drugie tyle następnego dnia. Na szczęście Dr Price jest w stanie pokryć te wydatki.

---

## Akt III — Nowy Jork i potwór

### Jackson Elias w hotelu

![Jackson Elias](/img/rozdarte-sumienie/cast/jackson-elias.jpg)

Quentin postanawia skonsultować sprawę Hale'a ze znajomym okultystą. Okazuje się, że autor prawdopodobnie przemycił w swoich dziełach fragmenty znacznie mroczniejszej księgi - skompletowanie księgozbioru pozwoli na odtworzenie złowrogiej księgi. Bohaterowie dowiadują się, że specjalistą od twórczości Hale'a jest... kolekcjoner Kent. Jednakże dostanie się do niego jest niemożliwe, chyba że pomoże im w tym **Jackson Elias** - daleki "znajomy" Kenta. To podróżnik, pisarz i awanturnik, który nie dość, że zna Kenta, to kolegował się z Masteresem oraz sam ma pewne doświadczenia z kultami. Bohaterowie muszą się spieszyć - Eliasa trudno złapać, ale aktualnie przebywa w Nowym Jorku. Intryga się zagęszcza.

Lillian, Quentin i Dr Price jadą pociągiem do **Nowego Jorku**. Lillian zauważa, że są śledzeni przez podejrzanych mężczyzn. Na miejscu hotelowym lobby króluje **Jackson Elias** — słynny podróżnik i pisarz, który „nie pisze fikcji, tylko prawdę, którą znajdzie". Elias raczy ich opowieściami o kultach i ruinach w Peru, i rzuca im motto: „**w sercu każdego człowieka jest dzikość**". Pisze list intencyjny do Kenta, aby ten udostępnił bohaterom zbiory dotyczące Hale'a - powołuje się przy tym na stary dług. Price i Lillian są pod ogromnym wrażeniem Jacksona jako uczynnego i przyjaznego człowieka. Obydwoje mają wrażenie, ze to jedyna prawdziwie dobra i przyjazna postać, na którą natrafili od śmierci Mastersa. Quentin z kolei postanawia go okraść. W jego lepkie rączki trafia tajemniczy gliniany amulet. Po powrocie do Bostonu, bohaterowie wysyłają list do Kenta i otrzymują zaproszenie do jego posiadłości - Greyholme.

### Kryjówka: tom, mapy i lista ofiar

W międzyczasie Jimmy oraz Jake udają się pod adres podany przez złodzieja. Odkrywają tam **wynajętą kryjówkę** - wszystko wskazuje na to, że należała ona do Mastersa. W środku znajdują: szpadę, **egzemplarz tomu**, mapy, **tajemnicza pieczęć** i **notatnik-kartoteka** — szczegółowy, morderczy „stalking" właścicieli książek wraz z adresami. Na liście figurują **Smith, Jacobson, Woodworth**, **Kent**— i sam **Masters**. Zabójca poluje po kolei. Detektyw i antykwariusz dochodzą do wniosku, że o ile Masters wynajął kryjówkę, o tyle korzysta z niej jego morderca. Zabierają ze sobą dokumenty oraz narzędzie do piętnowania i odchodzą w pośpiechu. Według notatek Woodworth, który rzadko bywa w mieście przybył do niego... godzinę temu. Jimmy i Jake postanawiają go ostrzec przed mordercą.

### Śmierć Woodwortha i potwór

![Kostnica — ciało Woodwortha](/img/rozdarte-sumienie/kostnica.jpg)
*Za późno — świeże zwłoki i jeszcze ciepłe piętno.*

Ekipa pędzi do **Woodwortha**, który godzinę wcześniej wrócił statkiem z ostatnim tomem. Zastają go martwego, ze świeżo wypalonym ognistym piętnem na klatce. Wtedy wchodzi zabójca: „**duży mężczyzna w masce gazowej. Wygląda jak potwór**" — z ogromnym ostrzem niczym bagnet i w długim płaszczu. Detektyw pruje z Colta (**„obrażenia symboliczne"**), pomieszczenie wypełnia się **żółto-szarym gazem**. Jimmy i Jake cudem unikają większych obrażeń i decydują się na ucieczkę. Bohaterowie wybiegają z willi Woodwortha, w panice krzyczą „wybuch gazu!" i starają się wtopić w powoli rosnący tłumek gapiów. Morderca nie rusza za nimi między ludzi. Jimmy zauważa, że ma na rękawie tajemniczy szaro-żółty pył. Jimmy boi się konfrontacji z Fiskiem i ucieka.

### Inspektor Fisk i teoria Lilian

Na miejsce zjeżdża **inspektor Fisk** — „który zawsze ma pytania" — a Jake musi się tłumaczyć, czemu wybiegł z domu ze świeżym trupem. Antykwariusz cudem wykręca się od aresztu kłamiąc policji w żywe oczy. Zostawia jednak swój adres.

Po wszystkich wydarzeniach grupa dochodzi do wniosku, że Masters nie musiał być tylko ofiarą, ale mógł być aktywnym wspólnikiem mordercy.

### Wieczorne najście

Późnym wieczorem Dr Price słyszy, że ktoś dobija się do jego drzwi. Okazuje się, że to Jake oraz Jimmy. Dwójka jest śledzona i boi się o własny los. Ludźmi, którzy ich śledzą najprawdopodobniej są policjantami po cywilu. W międzyczasie okazuje się, że antykwariat Jake'a został okradziony, a złodziej ukradł tomik Hale'a z sejfu. Na szczęście Jake miał narzędzie do piętnowania przy sobie.

Goście proszą o ciepłą herbatę, posiłek i schronienie. Dawno nie jedli niczego ciepłego i boją się wracać do domów.

To wszystko przelewa czarę goryczy Price'a, który poniósł już duże nakłady finansowe w związku z działaniami bohaterów. Lekarz boi się, że afera z policją doprowadzi do skazy na jego reputacji i przekreśli jego szanse na nagrodę Nobla w przyszłości. Następuje długa i elokwentna tyrada, w której Dr Price zaprasza ich do intensywnej refleksji nad własnym zachowaniem, diagnozuje u nich ciężki przypadek ociężałości umysłowej i aplikuje im lekarstwo w postaci werbalnej eksterminacji.

Cała trójka postanawia jechać autem do Pill Hill - dzielnicy na obrzeżach Bostonu, gdzie Doktor ma drugie lokum.

---

## Akt IV — Greyholme i Król w Żółci

### Posiadłość Kenta

![Posiadłość Greyholme](/img/rozdarte-sumienie/greyholme.jpg)

Wszyscy bohaterowie jadą do rezydencji Kenta. Kamerdyner **Silas Stark** wpuszcza ich do **Greyholme** dopiero po rewizji - nikomu nie udaje się przemycić broni. W środku uderza jeden szczegół: żadna z gablot z drogocennymi zbiorami nie jest zamknięta na klucz. Kent ewidentnie nie boi się złodziei. Sam Kent okazuje się być niewidomy - poza wartością kolekcjonerską książki nie ma pożytku z książek. Bohaterowie uzyskują dostęp do wszystkich zasobów związanych z Hale'm i udają się do pomieszczenia poświęconemu pisarzowi.

Na ścianie wisi wielki **portret** — i okazuje się, że **Aleksander Kent i Vincent Hale są łudząco podobni.** To pierwszy twardy sygnał **reinkarnacji**.

### Czytanie „Zebranych wierszy"

![Wizja Króla w Żółci — karta z tomu Hale'a](/img/rozdarte-sumienie/tom-04-wizja-krola-dusza.webp)
*„Karkosa nie jest miastem — Karkosa jest stanem."*

Grupa siada wokół tomu podczas gdy Quentin czyta go po łacinie i tłumaczy na bieżąco. Zapiski mówią o **Królu w Żółci**, o **Karkosie** i o duszy, która „nie jest jedna" — jest „dzielna jak ziarno granatu", podzielna w nieskończoność. Bohaterowie dowiadują się o okultystycznych praktykach, złowrogich rytuałach oraz o celu piętnowania zwłok. Lillian oraz Dr Price nie chcą słuchać wywodów Quentina - Lillian nie podoba się okultystyczna otoczka, Dr Price nie wierzy w nic poza nauką.

### Naczynie i siedem fragmentów

Historia i notatki składają się w spójny, koszmarny mechanizm: każdy egzemplarz **piętnuje** czytelnika i czyni go **fragmentem naczynia**; „odwrotne zastosowanie" (zabójstwo + wypalona pieczęć) **oczyszcza naczynie i uwalnia fragment** do odzyskania. Cel: **zebrać wszystkie siedem w jednej osobie** — by ktoś mógł się **reinkarnować** lub uzyskać moc. Grupa liczy egzemplarze i z przerażeniem odkrywa dwie rzeczy: **sami właśnie przeczytali tom** więc mogą być naznaczeni. Okazuje się też, że 6 książek mógł przechwycić jako „dowody" **inspektor Fisk** — być może to on jest „człowiekiem w masce". Dr Price informuje grupę, ze osad, który znaleźli w domu Mastersa, a później na rękawie Jimmego to pozostałość granatu dymnego - powszechnie używanego podczas wielkiej wojny, której Fisk jest weteranem...

---

## Epilog — naznaczeni i ścigani

Sesja zamyka się na dwóch nutach zawieszenia:

- **Flashback:** **Otto Brandt** kończy wytwarzać pieczęć, pakuje ją, a przesyłka wędruje pocztą — ciężarówką, potem rowerem — do **starej, opuszczonej farmy w Woodchester na północ od Bostonu**, daleko poza mapą. Paczka jest umieszczona w skrzynce pocztowej. Nazwisko na skrzynce brzmi znajomo: Peter Fisk.
- **Bohaterowie są teraz naznaczeni** (przeczytali tom) i **ścigani** — jeśli policja Fiska działa dla kultu, to oni sami stali się „wrogiem publicznym".

*Tytuł kampanii — „Rozdarte Sumienie" — zaczyna się spinać z mechaniką sesji: z **duszą, którą można rozerwać na fragmenty**.*

---

## Podsumowanie rezultatów

- **Nikt z BN-ów kluczowych nie zginął z ręki graczy** — sprawa jest wciąż otwarta. Zginął za to na ich oczach **Woodworth** (przebity i naznaczony). Wcześniej zginęli **Martin Masters**, **Smith** i **Jacobson**.
- **Zabójca wymknął się** — bohaterowie uciekli, on nie ruszył za nimi w tłum.
- **Zdobyto:** jeden **egzemplarz tomu**, **notatnik-kartoteka** z listą ofiar i adresami, pieczęć do piętnowania oraz **gliniany amulet** (od Jacksona Eliasa/z kryjówki), klucz i notatki Mastersa.
- **Rozpoznana mechanika kultu:** siedem egzemplarzy = siedem fragmentów duszy; morderstwo + pieczęć „odzyskuje" fragment; cel — reinkarnacja/opętanie/przelanie duszy do nowego ciała
- **Nowy stan graczy:** możliwe, że są **naznaczeni** (przeczytali tom) a na pewno **ścigani** przez Fiska

---

## Kluczowe wątki i odkrycia

- **Przeklęty tom Hale'a** — „Zebrane wiersze" Vincenta (Wiktora) Hale'a: siedem egzemplarzy, każdy piętnuje czytelnika.
- **Dusza podzielna** — dusza „jak ziarno granatu", rozbijana na fragmenty i zbierana w jedno naczynie; to sedno tytułowego „rozdartego sumienia".
- **Reinkarnacja** — Czy Kent to Hale? (bliźniacze portrety); ktoś dąży do powrotu lub ożywienia kogoś/czegoś przez zebranie wszystkich siedmiu części.
- Zabójca - Fisk - Inspektor z doświadczeniem bojowym, możliwościami oraz wyposażeniem

---

## Śmieszne i epickie momenty

> Najlepsze teksty wieczoru — część „w roli", część zza stołu.

**Epickie**

- Antykwariusz spina całą zagadkę: „**pan Aleksander Kent jest osobą, która zbiera wszystkie tomy w pełną kolekcję**… jeśli zlecił zabójstwo pozostałych, ma już sześć kopii".
- Wejście zabójcy — MG: „**Wybucha granat! Do pomieszczenia wchodzi duży, potężny mężczyzna. Wygląda jak potwór. Rzućcie na poczytalność.**"
- Jackson Elias, filozofia podróżnika: „moje podróże nauczyły mnie, że **w sercu każdego człowieka jest dzikość**".
- Z tomu, prosto w Króla: „**Aby ujrzeć króla, nie potrzeba podróży** — połóż przed sobą lustro polerowane do połysku i siedź godzinę, nie myśląc".
- Cel całej intrygi w jednym zdaniu: „**Żeby jedna osoba mogła zgromadzić wszystkie**"

**Śmieszne**

- Rafał do koronera w kostnicy, kiedy przyłapano go na podsłuchiwaniu: **"Szukam łazienki. Bardzo chce mi się siku"**
- Rafał: "**Doktorze Price, obawiam się, że koroner właśnie doniósł komuś, ze interesujemy się tym ciałem!"**
- Piotr: **"Zupełnie mnie to nie dziwi"**
- Supermoc doktora Price'a — Kamil: „What's your super power?"  Piotr: „Money."
- Jackson Elias o sobie: „**If I didn't have double standards, I wouldn't have standards at all.**"
- Diagnoza gatunkowa sceny konfrontacji — Kamil: „**Why do I hear boss music?**"
- Antykwariusz-egoista: „**Interesuje mnie tylko posiadanie na własną korzyść.**"
- Lilian rozwiązuje problem dowodów: „**Palę te dokumenty w kominku, jebać to!**"
- Prawnicza gimnastyka przy włamaniu: „**No, it's not breaking and entering if you don't break something.**"
- Kamil: **"Może herbatką nas pan poczęstuje, dawno nie jedliśmy niczego ciepłego"**

---

## Pytania i wątpliwości

> Poniższe pytania zostają otwarte. Większość to **luki w rozumieniu** — miejsca, gdzie taśma (parę równoległych rozmów, mikrofon „Sala", gra w podgrupach) nie mówi jasno, co się wydarzyło; wasze odpowiedzi to realne poprawki. Jedno na końcu to **otwarta zagadka** w fikcji, której MG może nigdy nie rozstrzygnąć. Każde pytanie stoi osobno: kliknij to, które was nurtuje, i dopiszcie swoje. Jeśli jesteście pewni, że coś naprawdę padło albo wydarzyło się przy stole — oznaczcie **[PEWNE]**; jeśli to teoria — **[SPEKULACJA]**.

Czy Aleksander Kent jest reinkarnacją Vincenta Hale'a, a inspektor Fisk „człowiekiem w masce" stojącym za piętnowaniem? To wasza główna teoria z finału — bliźniacze portrety Kenta i Hale'a oraz droga egzemplarzy przez policyjne „dowody" ją karmią. To zagadka wewnątrz fikcji: traktujcie odpowiedzi jak teorie, nie fakty — MG może zostawić ją nierozstrzygniętą aż do rozwiązania sprawy.

---

> _Streszczenie poprawione przez graczy po sesji — imiona postaci, kolejność scen i przebieg wydarzeń zweryfikowane względem nagrania. Kolejne uwagi mile widziane._
`

export function RSSummary() {
  const user = useAuthStore((s) => s.user)
  const loadCast = useCastStore((s) => s.load)
  const chars = useCastStore((s) => s.chars)
  const cast = useCastStore((s) => s.cast)
  useEffect(() => {
    if (user) void loadCast()
  }, [user, loadCast])
  const speakerOptions = useMemo(
    () => useCastStore.getState().speakerOptionsForPlayer('streszczenie/rozdarte-sumienie'),
    // recompute when identity or loaded data changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, chars, cast],
  )
  return (
    <article>
      <AnnotatableArticle pageKey="streszczenie/rozdarte-sumienie" speakerOptions={speakerOptions}>{SUMMARY}</AnnotatableArticle>
    </article>
  )
}
