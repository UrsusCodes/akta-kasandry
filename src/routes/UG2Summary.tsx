import { useEffect, useMemo } from 'react'
import { AnnotatableArticle } from '@/components/comments/AnnotatableArticle'
import { useAuthStore } from '@/stores/auth'
import { useCastStore } from '@/stores/cast'

/**
 * Session summary — "Urodzaj Grozy" (UG 2) — authored from the (fully recorded)
 * transcript + the GM's roster, in the "Znak Życia / Sól w Ranach" house style,
 * with per-section deep-link markers ({sesja:ug2#<id>}) into the transcript
 * viewer. Each player runs two characters (a gangster and an academic); the
 * session moves gangsters → academics → mixed. Utterance ids are real
 * (ug2-current variant). Lives on the demo route until moved to the vault.
 */

const SUMMARY = `# Urodzaj Grozy (UG 2) — streszczenie

**System:** Zew Cthulhu · **Strażnik Tajemnic:** Paweł · **Miejsce:** Boston i Blackwater Creek (na zachód od Arkham), prohibicja, lata 20.

> Gangsterski one-shot, który zaczyna się od bimbru i tortur, a kończy w jaskini nad „świętym źródłem Matki". Każdy gra **dwiema postaciami** — jednym **gangsterem** i jednym **akademikiem** — bo to przeróbka scenariusza, w którym normalnie wybiera się jedną ze stron; MG puścił obie naraz. Gra się kolejno: **gangsterami → akademikami → mieszanie**. I — jak w Sól w Ranach — wszystko prowadzi do **Klubu / Akt Kasandry**.

→ **[Pełna narracja (ciągiem, z cytatami)](/streszczenie-ug2/narracja)**

→ **[▶ Prezentacja filmowa (slajdy + muzyka)](/prezentacja/ug2)**

> Na wstępie MG — **poza fikcją, na „meta" poziomie** — wylicza, czego oczekiwać po sesji (głównie pod kątem pewnego „wewnętrznego" zagrożenia), po czym dodaje: **„jedna z tych rzeczy nie jest prawdą; rozkmińcie która, zanim będzie za późno."** {sesja:ug2#00d78428ad8e} Nieprawdą okazuje się **pierwsze zdanie** — że grają „swoją dziarską, gangsterską grupą". Bo zagrają **też akademikami**. To właśnie jest twist: **dwie drużyny, nie jedna.**

### Obsada (każdy gra dwie postacie)

| Gracz | Gangster | Akademik |
|---|---|---|
| Jakub | **Mortimer „Mort" Flannery** — gruby, siostrzeniec szefa, prawa ręka | **Dr Edwin Thorne** |
| Nika | **James Kelly** — bokser (z bratem) | **Dr Elaine Howard** |
| Rafał | **Joseph Kelly** — silny, brat Jamesa | **Dr Herbert West** |
| Kamil | **Friedrich „Fritz" Mueller** — Niemiec, kierowca/ochroniarz | **Wallace Harvey** — bibliotekarz (magister) |
| Piotr | **Cormac McMiller** — księgowy | **Dr Cecil Cavendish** |

**BN-i:** szef **Declan McBride**; bracia **Damien** i **Brendan Carmody**; pastor-szeryf **Dick Sprouston**; sklepikarz **Nathaniel Baxter**; porwany **profesor Henry Roades** (i jego żona **Abigail**); oraz **Matka** — istota z jaskini.

---

## Akt I — Gangsterzy

### Wezwanie do McBride'a

<img src="/img/ug2/mcbride.jpg" alt="Declan McBride" width="200" align="right" style="margin: 0.3rem 0 0.8rem 1.2rem;" />Wieczór w speakeasy (*Rhymers Club* / *Old State House*). Za kotarą „private" urzęduje **Declan McBride**, szef organizacji. {sesja:ug2#5835c7a73370} Wzywa swoją ekipę „wolnych agentów": **Mortimera** (siostrzeńca), **JJ — braci Kelly**, **Fritza** i księgowego **McMillera**.

McBride stawia na stole **dwie z pozoru identyczne butelki**: jedną z mętnym, obrzydliwym miejscowym bimbrem, drugą — z **ciemnozłotym trunkiem klasy kanadyjskiej** („**To jest po prostu fenomenalne**"). Ktoś z zewnątrz rozprowadza ten złoty towar po mieście, a jeden ze „szczurków" organizacji zaczął handlować nim na własną rękę — i właśnie wisi przesłuchiwany w sąsiednim pokoju.

### Brock i źródło dobrego trunku

W zapleczu, przywiązany do krzesła, z wybitymi zębami na betonowej podłodze, siedzi **Brock**. {sesja:ug2#6a4de39928af} **James** podnosi jeden z zębów i chowa go do kieszeni jako „pamiątkę po ofierze", a przesłuchanie prowadzi z lodowatą precyzją: „**Nie jestem twoim szefem. Jestem twoim katem.**" {sesja:ug2#48a9f61b45ef} Twardy Brock twierdzi, że i tak zginie — ale drużyna znajduje jego czuły punkt, **matkę**, i więzień pęka, podając nazwisko: **Damien Carmody** {sesja:ug2#0aab12e64610} — dawny pięściarz-łobuz z Bostonu (z którym **James** ma starą zadrę: Carmody rozwalił mu kolano po przegranym sparingu), który wrócił do rodzinnej dziury — **Blackwater Creek**, na zachód od Arkham. {sesja:ug2#5ea12999e158} Po wszystkim **Joseph dobija Brocka łomem**, a ciało zostaje obciążone i utopione w zatoce. *(Brock jeszcze wróci — patrz epilog.)*

### Zlecenie

McBride jest jasny: w Blackwater Creek bracia mają **świetną bimbrownię** — dogadać dystrybucję **na wyłączność**, a gdyby się nie dało, „znaleźć" rozwiązanie i wycisnąć informacje. Jedno zastrzeżenie: **nie zniszczyć wytwórni** — żadnych „losowych salw ani lasek dynamitu". Jeśli przemoc — to szybko i czysto.

---

## Akt II — Blackwater Creek (śledztwo)

### Pastor, sklepikarz i farma

![Miasteczko Blackwater Creek](/img/ug2/town.jpg)
*Blackwater Creek — kościół i błotnisty rozjazd.*

<img src="/img/ug2/sprouston.jpg" alt="Dick Sprouston" width="200" align="right" style="margin: 0.3rem 0 0.8rem 1.2rem;" />Blackwater Creek to ponure pustkowie — błoto, słodki zapach rozkładu, parę chałup, kościół i sklep. Z kościoła wychodzi **Dick Sprouston** — miejscowy **pastor, a zarazem szeryf**. {sesja:ug2#66f8c76d776b} Ostrzega przed **braćmi Carmody**: gwałtowni, uzbrojeni, terroryzują okolicę; chętnie zobaczyłby ich „wykorzenionych", a po fakcie zaprasza na wieczorną mszę. Sklepikarz **Nathaniel Baxter** {sesja:ug2#4a5e4f9e16b0} sprzedaje ich złoty trunek (bo nie ma gdzie indziej) i potwierdza, że gorszy jest **młodszy brat, Brendan**.

<img src="/img/ug2/carmody.jpg" alt="Damien Carmody" width="200" align="right" style="margin: 0.3rem 0 0.8rem 1.2rem;" />Na farmie — **pole kukurydzy ze strachem na wróble** i **bimbrownia**. {sesja:ug2#0b660dc80198} Kukurydza jest **„obfita i słodka"**, dają z niej 100+ litrów miesięcznie. {sesja:ug2#759774161672} **Damien Carmody** z ludźmi (strzelba, karabin wojskowy) zgadza się negocjować — zaprasza na jedzenie i trunek.

### Noc na farmie i pierwsza strzelanina

![Farma braci Carmody](/img/ug2/farm_carmody.jpg)
*Farma braci Carmody — nocny zwiad i poranna strzelanina.*

<img src="/img/ug2/boar.jpg" alt="Skażone zwierzę — Dar Macierzy" width="200" align="right" style="margin: 0.3rem 0 0.8rem 1.2rem;" />Negocjacje z **Damienem** stanęły na warunkach **korzystnych dla gangsterów**; bracia Kelly przyjęli to z niechęcią. Przy autach okazało się, że **wielkie szczury przegryzły kable** w silnikach (sprawka **Brendana**, który włada zwierzętami) — a farma odmówiła pomocy, kłamiąc, że nie ma ciężarówki. Drużyna przeczekiwała noc w wozach.

Na warcie **James** dostrzegł stracha na wróble, który **zmieniał pozycję**. **Fritz** poszedł na zwiad: znalazł **ciężarówkę ze sprzętem archeologicznym i książkami** (dobytek zaginionego profesora), a potem zobaczył, jak z pola za domem wychodzi **wychudzona, ponad trzymetrowa postać**, wchodzi tylnymi drzwiami, wszczyna szamotaninę i wraca na pole. *(To Brendan Carmody, przemieniony przez Matkę — i to on tej nocy skręcił kark własnemu Damienowi za handel darem Matki poza jej błogosławieństwem.)*

O świcie gangsterów wyrzucono z farmy ostrzej; Damiena nie było, a najemnicy ogłosili **zerwanie umowy**. Wywiązała się **pierwsza strzelanina**: Fritz wszedł na dach (gdzie czekał już wrogi strzelec), bracia Kelly poszli wręcz (m.in. na drwala z siekierą), **Mortimer padł od ciężkiej rany** (przeżył), a **McMiller o włos nie wysadził całej bimbrowni** przypadkowym strzałem. Gangsterzy **wybili wszystkich najemników**, znaleźli **Damiena ze skręconym karkiem** i **więźnia w podziemiach** (jeszcze nierozpoznanego profesora Roadesa). Farma była ich.

### Czarna maź i spalone kości — Farma Jarveyów

Akademików z **Boston University** (zlecenie dziekana) wysłano po zaginionego profesora archeologii **Henry'ego Roadesa** i jego żonę **Abigail**. W **Blackwater Creek** rozmawiali z **Dickiem Sproustonem**, który subtelnie sugerował sprawstwo braci Carmody; **West** odkupił od dzieciaków **słój, w którym rozpuszczały dżdżownice** — woda **trawi mięso, ale nie kości**. Tropem profesora dotarli na **Farmę Jarveyów**.

![Farma Jarveyów](/img/ug2/farm_jarvey.jpg)
*Farma Jarveyów — z bajorem, przy którym siedział Stary Pete.*

<img src="/img/ug2/pete.jpg" alt="Stary Pete" width="200" align="right" style="margin: 0.3rem 0 0.8rem 1.2rem;" />Na Farmie Jarveyów pod ścianą, w błocie, siedzi **Stary Pete** — alkoholiczny parobek, blady, półprzytomny, a z ust cieknie mu **cienka czarna maź**. {sesja:ug2#3b313bfb1e3f} **Wallace** (bibliotekarz) pobiera próbkę; w domu znajdują niedokończony list „Drogi Ernesti" (do **Ernesta McTavisha** z Boston University). Akademicy trafiają na **porzucone wykopalisko** profesora przy wyschniętym strumieniu i odkopują **masę ludzkich kości** — czaszek i piszczeli **zdeformowanych** (spłaszczonych, rozciągniętych, pod dziwnymi kątami) i noszących **ślady spalenia**, datowanych na **koniec XVII wieku**. {sesja:ug2#0c0cd7d741fe} To pozostałość po **zaginionej purytańskiej sekcie** {sesja:ug2#4d951c55723d} (przywódca **Cayda**), która uciekła z Bostonu i założyła przystań, po czym **zniknęła z historii**. Strumień wpływał kiedyś w las — ku jaskini.

---

## Akt III — Wspólny finał

### Bitwa na farmie

![Brendan Carmody — istota z kukurydzy](/img/ug2/brendan.jpg)
*Brendan Carmody — Dziecię Macierzy, „strach na wróble".*

Negocjacje pękają i krater zamienia się w jatkę: **granaty** {sesja:ug2#2a8b3928b40e}, **lampa naftowa** Fritza, strzelby i karabiny. W środku pojawia się **Brendan Carmody** — przemieniony młodszy brat (Dziecię Macierzy), ten sam „strach na wróble": potworna istota z wydłużającą się ręką. {sesja:ug2#46f5864b8941} **James Kelly** zostaje **przebity na wylot i rozerwany na pół** — a wstrząśnięta **Elaine** rzuca istocie w twarz: „**Zapłacisz mi, kurwo, za to**". {sesja:ug2#7f976a645714} **Cormac McMiller popada w obłęd i ucieka** jednym z aut — z rozgrywki znika (przeżył, pewnie wróci do gangu). Istotę kładzie w końcu **ogień** — płonące cielsko, a koktajl Mołotowa i wybuch odrywają jej głowę.

### Roades i „święte źródło Matki"

<img src="/img/ug2/roades.jpg" alt="Henry Roades" width="200" align="right" style="margin: 0.3rem 0 0.8rem 1.2rem;" />Wśród zamieszania bohaterowie uwalniają **profesora Henry'ego Roadesa** — ale on jest **zniewolony**: błaga, by zanieść go do **świętego źródła Matki** w jaskini, bo „**Matka jest uwięziona w jaskini, ale może uleczyć wszystko**", nawet zabitego brata. {sesja:ug2#3c8768eea70a} {sesja:ug2#e18f5b6715b1} To pułapka kultu: **Matką jest w istocie Abigail Roades** — żona profesora, pochłonięta przez Macierz (awatar związany z wodą). To jej Roades szukał przez całą sprawę.

### Zawalenie jaskini

Do jaskini (w górę rzeki, u źródła tamy zasilającej pola) idzie pieszo mieszana grupa; **Joseph** niesie ciało brata. Roades namawia, by wrzucić Jamesa do źródła — ale Joseph postanawia **pozwolić bratu odejść** i **strzela Roadesowi w głowę**. To budzi **Matkę (Abigail)**: masa mięsa z rozłupaną twarzą. Cios w psychikę jest potężny (**Elaine mdleje**), a **Mortimer** — bo pił skażoną whiskey — **na moment staje się wyznawcą Matki** i przeszkadza. Matka chwyta mackami; ciało Jamesa wpada do wody (powstaje **zombie-James**).

![Matka — Abigail Roades](/img/ug2/mother.jpg)
*Matka — Abigail Roades, awatar w jaskinnym jeziorze.*

W jaskini drużyna **wysadza ładunek**. Eksplozja **wstrząsa wodą i rozrywa istotę na kawałki** {sesja:ug2#c3a7c3ed39af}, a strop zaczyna się walić — **odcinając dostęp wody na długie lata**. Spadające głazy grzebią wnętrze {sesja:ug2#5f24b27c1793}. **Mortimer** zostaje: **Fritz** długo próbuje wyrwać go z transu, w końcu ucieka sam; wybudzony Mortimer, zatrzymany przez zombie-Jamesa, nie zdąża i zostaje przygnieciony — **regeneracja z daru Matki ratuje mu życie, ale zostaje kompletnie niepoczytalny**. Na koniec ocaleli palą farmę i kukurydzę, by skażony alkohol przestał płynąć po okolicy.

---

## Epilog — i znów Kasandra

Dwie sceny domykają sesję:

- **Joseph** — ocalały, lecz **sam, bez brata Jamesa** — siedzi w mieszkaniu i patrzy w sufit; w oknie staje postać o **rozbitej, pokrytej bliznami głowie i rozdwojonym oku**. To **Brock** — informator dobity łomem i utopiony na początku sprawy — który „przeżył" egzekucję dzięki **darowi Matki** (pił skażony trunek, który sam rozprowadzał) i wrócił po Josepha. (Realny powrót czy wyrzut sumienia — MG zostawia niejednoznacznie.)
- Tygodnie później **dr Elaine Howard** wraca do mieszkania i zastaje w swoim fotelu nieznajomego z zaproszeniem: reprezentuje pewien progresywny klub dżentelmenów z wieloma damami w składzie. **„Czy słyszała pani kiedykolwiek o klubie Kasandry?"** {sesja:ug2#a37238c0d8c5}

Tak **Urodzaj Grozy** — podobnie jak Sól w Ranach — wpina się w **Akta / Klub Kasandry**.

---

## Podsumowanie rezultatów

- **Matka (Abigail Roades) zabita / zapieczętowana** — rozerwana wybuchem, a zawalona jaskinia odcina jej źródło wody „na długie, długie lata". To była największa nagroda sesji.
- **Obaj bracia Carmody martwi** — **Damien** (kark skręcony przez brata) i **Brendan** (istota z farmy, spalony). **Bimbrownia i kukurydza spalone** — skażony alkohol przestaje płynąć.
- **Profesora Roadesa nie uratowano** — Joseph zastrzelił go w jaskini. **Pastora Dicka Sproustona** nie rozliczono.
- **Straty gangsterów:** **James Kelly** rozerwany przez Brendana na farmie (ginie). **Mortimer** przygnieciony w zawalonej jaskini — **przeżył dzięki regeneracji z daru Matki, ale jest kompletnie niepoczytalny**. **Joseph Kelly** i **Fritz** przeżyli. **Cormac McMiller** popada w **obłęd i ucieka** (przeżył, znika z rozgrywki — pewnie wróci do gangu).
- **Akademicy przeżyli wszyscy** — z różnie naruszoną psychiką.
- **Hak na przyszłość:** Brock — ożywiony darem Matki — w oknie Josepha; werbunek **dr Elaine Howard** do **Klubu Kasandry**.

---

## Kluczowe wątki i odkrycia

- **„Urodzaj Grozy"** — skażona, zbyt słodka kukurydza i złoty bimber to żniwo karmione przez **Matkę**; czarna maź w wieśniakach to jej ślad.
- **Zaginiona purytańska sekta (XVII w.)** — spalone, zdeformowane kości u źródeł całej sprawy.
- **Matka w jaskini** — mityczna istota związana z wodą (echo „wodnego diabła" z Sól w Ranach); ogień i zawał ją powstrzymują.
- **Dwie grupy, dwie połowy prawdy** — gangsterzy (cel: bracia) i akademicy (cel: Roades) składają historię z dwóch stron.
- **Klub Kasandry** — spinka z resztą kampanii i z **Aktami Kasandry**.

---

## Śmieszne i epickie momenty

> Najlepsze teksty wieczoru — część „w roli", część zza stołu. Każdy odnośnik **↪ transkrypt** prowadzi do tego miejsca w nagraniu.

**Epickie**

- **James** do Brocka: „Nie jestem twoim szefem. Jestem twoim katem." {sesja:ug2#48a9f61b45ef}
- **McBride** wydaje rozkaz, który zemści się ironią: „Nie chcę, żeby jakaś losowa salwa albo niepoważnie rzucona laska dynamitu zakończyła istnienie tego przybytku." {sesja:ug2#7375e02727ca} — kilka godzin później **McMiller** strzela w środku bimbrowni i jest **o jeden pechowy rzut** od wysadzenia wszystkiego.
- **Elaine** nad ciałem Jamesa, prosto do Matki: „Zapłacisz mi, kurwo, za to." {sesja:ug2#7f976a645714}
- **Joseph** dobija płonącą istotę — MG: „…głowa odrywa się w końcu od płonącego ciała i odlatuje w bok." {sesja:ug2#9d718d4382fa}
- **Elaine** o pastorze Sproustonie (którego świadomie zostawiono na później): „Ja go kiedyś dopadnę, kurwa." {sesja:ug2#bb3e7f79e3db}

**Śmieszne**

- **Mortimer**, esteta zbrodni: „bardziej pasjonuje mnie posiadanie czegoś, czego inni nie mają" {sesja:ug2#8c817d940165} — a o łyku złotego trunku: „**Smakuje jak tęcza.**" {sesja:ug2#e3a66bc7b6c7}
- **Joseph**, klasyczne „ostatnie słowa": „Ależ koledzy, to jest tylko las na pustkowiu. Co może się tutaj wydarzyć?" {sesja:ug2#005e17a108ce}
- **Saga słoika** — akademicy i słój z rozpuszczonymi dżdżownicami: „Nie, ten, kto ma słoik, ma wakacje." {sesja:ug2#8f80092ece74} • „Nie, to jest mój słoik, wy decydujecie, gdzie idziemy." {sesja:ug2#d537e5add875}
- **McMiller**, księgowy z niespodzianką: „W walizce mam naładowanego shotguna, just in fucking case." {sesja:ug2#fb03bacf313b}
- **Rafał** o szefie organizacji: „Braciszek jest intimidating as fuck." {sesja:ug2#1868f22eea83}
- **MG** (meta): „następnym razem wezmę sobie umiejętność **insane bullshit**." {sesja:ug2#4b12b5d96fb4}
- I gorzko-śmieszne, gdy kości zaczęły się sypać przy stole: „**Let me die.**" {sesja:ug2#9f70f4b228f4}

---

> _Wersja robocza. Daj znać, co poprawić: imiona, kolejność, akcenty._
`

export function UG2Summary() {
  const user = useAuthStore((s) => s.user)
  const loadCast = useCastStore((s) => s.load)
  const chars = useCastStore((s) => s.chars)
  const cast = useCastStore((s) => s.cast)
  useEffect(() => {
    if (user) void loadCast()
  }, [user, loadCast])
  const speakerOptions = useMemo(
    () => useCastStore.getState().speakerOptionsForPlayer('streszczenie/ug2'),
    // recompute when identity or loaded data changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, chars, cast],
  )
  return (
    <article>
      <AnnotatableArticle pageKey="streszczenie/ug2" speakerOptions={speakerOptions}>{SUMMARY}</AnnotatableArticle>
    </article>
  )
}
