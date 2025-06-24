Varje funktion har testats i en ny chatt. Testats med Claude 4. Nya chattar har
tagits fram mellan vissa funktioner som 1 -> 2 --> 3. Men inte mellan 3 och 4.

**1. Skapa menystruktur** _Beskrivning_ Används för att skapa upp en
menystruktur med all data direkt i vyn. Peka på templates för en kopia annars
gör AIn sitt eget. _Prompt_ @AIViewCreation.md skapa en ny menystruktur. Den ska
vara båtar. under den kunder och båtar. Kunder ska se ut som @CustomerList.vue.
Båtar har ingen data än. Gör den i vyn.

**2. Använd mockData i json istället för i vyn** _Beskrivning_ Används för att
bryta ut statisk data i vyn till json så relationer och interaktion är möjligt
(radera, ändra, ny) _Prompt_ @AICreateAndUseMockdata.md Nu i list vyn för båtar
vill jag att du använder denna struktur. Båtar ska också ha bredd och
registreringsnummer.

**3. Skapa Detaljvy** _Beskrivning_ Används när man har en list vy och vill
skapa en detaljsida för objekt i den. _Prompt_ Följ denna
@AIDetailsPageCreation.md skapa sen en detaljvy för båtar

**4. Implementera ny [Objekt] knapp** _Beskrivning_ Används när man vill
implementera funktionaliteten av "ny" knappen. Den skapar en variationa av
detaljvyn för att direkt kunna skapa nytt objekt. _Prompt_
@AINewButtonToEditableDetails.md Implementera detta för båt listan.

**5. Skapa komponenter** _Beskrivning_ Använd är en sida har grundläggande
strukturen färdig. Tar automatiskt och identiferar sektioner för lämpliga
komponenter. Lägger dessa antingen under shared/ om de förekommer över flera
sidor eller common/ ifall de används på varje sida. Vanligtvis läggs komponenter
under /components/features/[SIDA]. Exempel
"components/features/boats/BoatCard.vue". _Prompt_ Följ denna för instruktion
@AIBreakOutComponents.md . Gör den för detaljvyn för arbetsorders.
