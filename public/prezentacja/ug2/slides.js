/* Urodzaj Grozy — presentation data. Loaded before engine.js (shared globals).
   image = full-bleed LOCATION background; portraits = [{img,name}] framed, captioned.
   No long dashes in visible copy. TODO bg = placeholder until the art is generated. */

// Relative paths (../../ from /prezentacja/ug2/) so assets resolve both at the
// dev root and under the /akta-kasandry/ base in production, and inside the iframe.
const TRACKS = {
  docks:   '../../audio/ug2/docks.mp3',
  orchard: '../../audio/ug2/orchard.mp3',
  root:    '../../audio/ug2/root.mp3',
  moss:    '../../audio/ug2/moss.mp3',
};

const IMG = '../../img/ug2/';
const CAST = IMG + 'cast/';

const SLIDES = [
  // ───────────────────────── AKT I — Boston, gangsterka ─────────────────────────
  { kind:'title', image:IMG+'road.jpg', kb:'in', track:'docks', dur:6500,
    title:'Urodzaj Grozy', text:'Zew Cthulhu · Boston i Blackwater Creek · prohibicja, lata 20.' },

  { kind:'cast', track:'docks', dur:9500, act:'Akt I', title:'Gangsterzy McBride’a',
    cast:[
      {img:CAST+'mort.jpg', name:'Mortimer „Mort” Flannery', player:'Jakub'},
      {img:CAST+'james.jpg', name:'James Kelly', player:'Nika'},
      {img:CAST+'joseph.jpg', name:'Joseph Kelly', player:'Rafał'},
      {img:CAST+'fritz.jpg', name:'Friedrich „Fritz” Mueller', player:'Kamil'},
      {img:CAST+'mcmiller.jpg', name:'Cormac McMiller', player:'Piotr'},
    ] },

  { kind:'image', image:IMG+'speakeasy.jpg', kb:'in', track:'docks', dur:7500, act:'Akt I',
    title:'Wieczór w Rhymers Club',
    portraits:[{img:IMG+'mcbride.jpg', name:'Declan McBride'}],
    text:'„Musimy się dowiedzieć, jakie jest źródło. Tego, kto sprzedaje na boku, trzeba przykładnie ukarać.”' },

  // (merge of Brock interrogation + Damien name + McBride's order) — bar background
  { kind:'image', image:IMG+'speakeasy.jpg', kb:'out', track:'docks', dur:8500, act:'Akt I',
    title:'Przesłuchanie',
    portraits:[{img:CAST+'james.jpg', name:'James Kelly'},{img:IMG+'brock.jpg', name:'Brock'}],
    text:'Pobity Brock pęka pod naciskiem Jamesa: „Nie jestem twoim szefem. Jestem twoim katem.” Pada nazwisko: Damien Carmody, były bokser z dawną zadrą Jamesa. Rozkaz McBride’a jest jasny: żadnej losowej salwy ani laski dynamitu.' },

  // ───────────────────────── AKT II — Black Creek → deal ────────────────────────
  { kind:'image', image:IMG+'road.jpg', kb:'left', track:'orchard', dur:6500, act:'Akt II',
    title:'Na zachód od Arkham', text:'Pustkowia, błoto i słodkawy zapach rozkładu, mimo pełni lata.' },

  { kind:'image', image:IMG+'town.jpg', kb:'in', track:'orchard', dur:6500, act:'Akt II',
    title:'Blackwater Creek', text:'Kilka chałup, sklep, kościół, dzieci bawiące się w błocie.' },

  // (merge Sprouston + Baxter)
  { kind:'image', image:IMG+'town.jpg', kb:'out', track:'orchard', dur:7000, act:'Akt II',
    title:'Pastor i sklepikarz',
    portraits:[{img:IMG+'sprouston.jpg', name:'Dick Sprouston'}],
    text:'Pastor i samozwańczy szeryf chciałby braci Carmody „wykorzenionych”. Sklepikarz Baxter sprzedaje ich złoty trunek i ostrzega: gorszy jest młodszy brat, Brendan.' },

  // (merge farm + deal) — atmosphere, no numbers
  { kind:'image', image:IMG+'farm_carmody.jpg', kb:'in', track:'orchard', dur:7000, act:'Akt II',
    title:'Farma Carmodych',
    portraits:[{img:IMG+'carmody.jpg', name:'Damien Carmody'}],
    text:'Morze nienaturalnie słodkiej kukurydzy, strach na wróble, smród zacieru. Damien przyjmuje gości pojednawczo: „Dopijmy się, zjedzmy. Łatwiej będzie przegadać.”' },

  // ────────────────────── AKT III — noc i poranna strzelanina ───────────────────
  // TODO bg: swap to generated rats-in-engine image
  { kind:'image', image:IMG+'farm_carmody.jpg', kb:'in', night:true, track:'root', dur:6000, act:'Akt III',
    title:'Coś tu gnije', text:'Wielkie szczury przegryzają kable w silnikach aut. Drużyna utyka na noc.' },

  // (merge warta + zwiad Fritza) — no "missing professor" framing yet
  { kind:'image', image:IMG+'farm_carmody.jpg', kb:'out', night:true, track:'root', dur:6800, act:'Akt III',
    title:'Warta', text:'James patrzy na stracha na wróble, który zdaje się zmieniać pozycję. Fritz na zwiadzie znajduje zaparkowaną ciężarówkę pełną dziwnego sprzętu i ksiąg.' },

  // TODO bg: swap to generated giant-in-field image
  { kind:'image', image:IMG+'farm_carmody.jpg', kb:'in', night:true, fx:'pulse', track:'root', dur:6500, act:'Akt III',
    title:'Trzymetrowa postać', text:'Wychudzony olbrzym wychodzi z pola, znika w domu. Ze środka dobiega szamotanina, po czym postać wraca na pole.' },

  // (merge świt + strzelanina) — generic brutal fight + gunfight SFX
  { kind:'image', image:IMG+'farm_carmody.jpg', kb:'in', fx:'flash', sfx:'../../audio/ug2/sfx/gunfight.mp3',
    track:'root', dur:8500, act:'Akt III',
    title:'Strzelanina', text:'O świcie pada: „Umowa zerwana.” Wywiązuje się brutalna, brudna walka. Pistolety, karabiny, strzelby, siekiery i gołe pięści.' },

  { kind:'image', image:IMG+'farm_carmody.jpg', kb:'out', track:'root', dur:6500, act:'Akt III',
    title:'Cisza', text:'Wszyscy najemnicy martwi. Damien ze skręconym karkiem. W piwnicy uwięziony człowiek.' },

  // ─────────────────────── AKT IV — przybycie i śledztwo ────────────────────────
  { kind:'cast', track:'orchard', dur:9500, act:'Akt IV', title:'Akademicy z Boston University',
    cast:[
      {img:CAST+'corwin.jpg', name:'Arthur Henry Corwin', player:'Jakub'},
      {img:CAST+'eleine.jpg', name:'Dr Elaine Howard', player:'Nika'},
      {img:CAST+'west.jpg', name:'Dr Herbert West', player:'Rafał'},
      {img:CAST+'wallace.jpg', name:'Wallace Harvey', player:'Kamil'},
      {img:CAST+'cavendish.jpg', name:'Dr Cecil Cavendish', player:'Piotr'},
    ] },

  { kind:'image', image:IMG+'town.jpg', kb:'in', track:'orchard', dur:6000, act:'Akt IV',
    title:'Zlecenie dziekana', text:'Odnaleźć zaginionego profesora archeologii Henry’ego Roadesa i jego żonę Abigail.' },

  { kind:'image', image:IMG+'town.jpg', kb:'out', track:'orchard', dur:6500, act:'Akt IV',
    title:'Sprouston',
    portraits:[{img:IMG+'sprouston.jpg', name:'Dick Sprouston'}],
    text:'Pastor subtelnie sugeruje, że to bracia Carmody stoją za zniknięciem profesora.' },

  { kind:'image', image:IMG+'jar.jpg', kb:'in', track:'orchard', dur:6000, act:'Akt IV',
    title:'Słój', text:'Dwoje dzieci rozpuszcza robaki w słoju z wodą. Zaintrygowany West odkupuje słój.' },

  { kind:'image', image:IMG+'farm_jarvey.jpg', kb:'out', track:'orchard', dur:6000, act:'Akt IV',
    title:'Farma Jarveyów', text:'Tu wcześniej nocował profesor. Gości ich rodzina Jarveyów.' },

  { kind:'image', image:IMG+'farm_jarvey.jpg', kb:'in', track:'orchard', dur:6500, act:'Akt IV',
    title:'Czarna maź',
    portraits:[{img:IMG+'pete.jpg', name:'Stary Pete'}],
    text:'Alkoholiczny parobek siedzi w błocie, blady i półprzytomny. Z ust cieknie mu cienka czarna maź.' },

  { kind:'image', image:IMG+'farm_jarvey.jpg', kb:'out', fx:'pulse', track:'orchard', dur:6800, act:'Akt IV',
    title:'Brutus',
    portraits:[{img:IMG+'boar.jpg', name:'Brutus'}],
    text:'Farmowy knur Brutus rozrósł się potwornie i oszalał z agresji. Krwawe starcie wśród zabudowań. Gospodarz ranny, żona odwozi go do szpitala.' },

  { kind:'image', image:IMG+'farm_jarvey.jpg', kb:'in', track:'orchard', dur:7000, act:'Akt IV',
    title:'Niewysłany list od profesora',
    text:'List do Ernesta McTavisha: „Jaskinia nie jest mitem. To będzie największe odkrycie mojej kariery, a Abigail jest u mego boku.”' },

  // (28 ↔ 29 swapped: dig first, then camp)
  { kind:'image', image:IMG+'dig.jpg', kb:'in', track:'orchard', dur:7000, act:'Akt IV',
    title:'Wykopalisko', text:'Masa zdeformowanych, spalonych kości z końca XVII wieku. Pozostałość po kolonii odłamu purytan, która zaginęła.' },

  { kind:'image', image:IMG+'camp_roades.jpg', kb:'out', track:'orchard', dur:6000, act:'Akt IV',
    title:'Obóz profesora', text:'Porzucony obóz Roadesa na drodze okrążającej las.' },

  // ──────────────────── AKT V — połączenie drużyn, druga walka ──────────────────
  { kind:'image', image:IMG+'dam.jpg', kb:'left', track:'root', dur:6500, act:'Akt V',
    title:'Ta jedna farma', text:'Akademicy ruszają na zakazaną farmę Carmodych. Okrążają las i przechodzą przez prowizoryczną tamę.' },

  // (merge spotkanie + negocjacje) — dam crossing + both teams converge
  { kind:'image', image:IMG+'farm_carmody.jpg', kb:'in', track:'root', dur:8000, act:'Akt V',
    title:'Spotkanie',
    portraits:[
      {img:CAST+'mort.jpg', name:'Mortimer'},{img:CAST+'james.jpg', name:'James'},
      {img:CAST+'joseph.jpg', name:'Joseph'},{img:CAST+'fritz.jpg', name:'Fritz'},
      {img:CAST+'mcmiller.jpg', name:'McMiller'},{img:CAST+'corwin.jpg', name:'Corwin'},
      {img:CAST+'eleine.jpg', name:'Elaine'},{img:CAST+'west.jpg', name:'West'},
      {img:CAST+'wallace.jpg', name:'Wallace'},{img:CAST+'cavendish.jpg', name:'Cavendish'},
    ],
    text:'Na farmie braci obie drużyny wpadają na siebie, mierzą się wzrokiem i podejmują nieufne negocjacje.' },

  { kind:'image', image:IMG+'farm_carmody.jpg', kb:'out', fx:'pulse', track:'root', dur:7000, act:'Akt V',
    title:'Dziecię Macierzy',
    portraits:[{img:IMG+'brendan.jpg', name:'Brendan Carmody'}],
    text:'Z bimbrowni wychodzi ten sam strach na wróble z nocnej warty: przemieniony Brendan.' },

  { kind:'image', image:IMG+'farm_carmody.jpg', kb:'in', fx:'flash', track:'root', dur:6000, act:'Akt V',
    title:'Druga walka', text:'Granaty, lampa naftowa, koktajle Mołotowa. Tym razem obie drużyny walczą razem.' },

  // (merge śmierć Jamesa + ogień) — Joseph speaks the vow
  { kind:'image', image:IMG+'james_death.jpg', kb:'in', fx:'flash', track:'root', dur:7500, act:'Akt V',
    title:'Śmierć Jamesa',
    portraits:[{img:IMG+'james_bw.jpg', name:'James Kelly'}],
    text:'Wydłużona ręka przebija Jamesa na wylot i rozrywa na pół. Joseph, do istoty: „Zapłacisz za to.” Płonąca lampa w końcu kładzie potwora.' },

  { kind:'image', image:IMG+'farm_carmody.jpg', kb:'out', track:'root', dur:7000, act:'Akt V',
    title:'Zniewolony profesor',
    portraits:[{img:IMG+'roades.jpg', name:'Henry Roades'}],
    text:'Uwolniony, lecz zniewolony, błaga: „Zanieście mnie do źródła Matki. Ona uleczy wszystko, nawet twojego brata.”' },

  // ───────────────────────────── AKT VI — jaskinia ─────────────────────────────
  { kind:'image', image:IMG+'forest.jpg', kb:'in', track:'moss', dur:6000, act:'Akt VI',
    title:'Ku jaskini', text:'Joseph niesie ciało brata. Wspinaczka po mokrych kamieniach w górę rzeki.' },

  { kind:'image', image:IMG+'cave_entrance.jpg', kb:'out', track:'moss', dur:6500, act:'Akt VI',
    title:'Jaskinia źródłem strumienia', text:'To stąd wypływa woda, którą bracia spiętrzyli tamą, by poić skażone pola.' },

  { kind:'image', image:IMG+'cave_interior.jpg', kb:'in', track:'moss', dur:6500, act:'Akt VI',
    title:'Wnętrze', text:'Wypłukane koryto między stromymi skarpami, a w głębi czarne jezioro.' },

  // (merge pokusa + Joseph strzela)
  { kind:'image', image:IMG+'cave_interior.jpg', kb:'out', fx:'flash', track:'moss', dur:7000, act:'Akt VI',
    title:'Pokusa', text:'Roades namawia, by wrzucić ciało Jamesa do wody. Joseph postanawia pozwolić bratu odejść i strzela Roadesowi w głowę.' },

  { kind:'image', image:IMG+'mother.jpg', kb:'in', fx:'pulse', track:'moss', dur:7000, act:'Akt VI',
    title:'Matka, Abigail Roades', text:'Z wody wynurza się obrzydliwa masa mięsa z twarzą rozłupaną na pół. To zaginiona żona profesora.' },

  // tło z poprzedniego ujęcia Matki + portrety Elaine i Mortimera
  { kind:'image', image:IMG+'mother.jpg', kb:'out', fx:'pulse', track:'moss', dur:6800, act:'Akt VI',
    title:'Wyznawca',
    portraits:[{img:CAST+'eleine.jpg', name:'Dr Elaine Howard'},{img:CAST+'mort.jpg', name:'Mortimer Flannery'}],
    text:'Elaine pada zemdlona od samego widoku. Mortimer, który pił skażony trunek, na chwilę staje się wyznawcą Matki i obraca się przeciw drużynie.' },

  { kind:'image', image:IMG+'cave_interior.jpg', kb:'in', fx:'pulse', track:'moss', dur:6500, act:'Akt VI',
    title:'Walka o dynamit', text:'Mackowate kończyny chwytają i wciągają do wody. Ciało Jamesa wpada do jeziora.' },

  { kind:'image', image:IMG+'explosion.jpg', kb:'in', fx:'flash', track:'moss', dur:6800, act:'Akt VI',
    title:'Eksplozja', text:'Strop się wali, odcinając wodę na długie lata. Mortimer przygnieciony przeżyje dzięki darowi Matki, lecz kompletnie niepoczytalny.' },

  { kind:'image', image:IMG+'escape.jpg', kb:'out', fx:'flash', track:'moss', dur:6500, act:'Akt VI',
    title:'Ucieczka', text:'Ocaleni palą bimbrownię i pole kukurydzy. Skażony trunek nie popłynie więcej po okolicy.' },

  { kind:'image', image:IMG+'brock_window.jpg', kb:'in', fx:'pulse', track:'moss', dur:7500, act:'Epilog',
    title:'W oknie',
    text:'Za oknem w Bostonie Josepha obserwuje osoba, którą zabił na początku. Czeka na moment zemsty.' },

  { kind:'end', track:'moss', dur:10000, act:'Epilog',
    title:'KLUB KASANDRY',
    portraits:[{img:CAST+'eleine.jpg', name:'Dr Elaine Howard'},{q:true, name:'Niespodziewany gość'}],
    text:'Niespodziewane zaproszenie dla Elaine.' },
];
