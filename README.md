# Innovia Hub

## Om projektet 
Innovia Hub är ett system för att hantera resurser och bokningar. Systemet gör det möjligt för en användare att söka efter tillgängliga resurser och genomföra bokningar under önskade tidsintervall. 

Projektet består av ett frontendgränssnitt i React, ett backend-API och en PostgreSQL-databas. Systemet inehåller även en AI-assistent som hjälper användaren att hitta tillgängliga resurser utifrån frågor, datum och tid. 

## Tekniker och ramverk 
- **C# och .NET 10** - backend och API
- **ASP.NET CORE** - hantering av HTTP-anrop och API-endpoints
- **Entity Framework Core** - kommunikation med databasen och hantering av databasmigrationer 
- **PostgreSQL** - lagring av resurser och bokningar 
- **React och Vite** - frontend och utvecklingsserver
- **TypeScript** - frontendlogik 
- **Node.js och npm** - installation av beroenden och körning av frontend 
- **Docker och Docker Compose** - uppstart av databasen i en container
- **AI-integration** - hantering av användarfrågor och presentation av tillgängliga bokningsalternativ i chatt

## Förutsättningar

- .NET SDK 10
- Node.js och npm
- Docker Desktop

## Starta projektet

Kör kommandona från projektets rotmapp.

### 1. Starta databasen

Skapa en .env-fil i projektets rotmapp med följande innehåll:

Ersätt `<container_name>`, `<database_name>`, `<username>` och `<password>` med dina egna värden.

```env
CONTAINER_NAME=<container_name>
DATABASE=<database_name>
USERNAME=<username>
PASSWORD=<password>
```

```powershell
docker compose up -d
```

### 2. Konfigurera API:t

API:t använder PostgreSQL på port `5433` och kräver en connection string. Sätt variablerna i samma terminalfönster som API:t ska startas i:

Ersätt `<database_name>`, `<username>` och `<password>` med dina värden från .env-filen i connection stringen.
`ADMIN_EMAIL` och `ADMIN_PASSWORD` är valfria och används för att skapa den första administratören.

```powershell
$env:SQL_ConnectionString = "Host=localhost;Port=5433;Database=<database_name>;Username=<username>;Password=<password>"
$env:ADMIN_EMAIL = ""
$env:ADMIN_PASSWORD = ''
```

> **Krav på `ADMIN_PASSWORD`**
>
> Lösenordet måste innehålla:
> - minst 6 tecken
> - en stor bokstav (A–Z)
> - en liten bokstav (a–z)
> - en siffra (0–9)
> - ett specialtecken (t.ex. `!` eller `#`)
>
> Exempel: `Exempel1234!`
> 
> **Tips:** använd enkla citattecken (`'...'`) runt lösenord i PowerShell,
> så tolkas inte `$` som en variabel.

Kör migrationerna och starta API:t:

```powershell
dotnet ef database update --project InnoviaHub.DataAccess --startup-project InnoviaHub.Api
dotnet run --project InnoviaHub.Api --launch-profile http
```

API:t körs på `http://localhost:5193`. OpenAPI/Scalar finns på `http://localhost:5193/scalar` i utvecklingsläge.

### 3. Starta klienten

Skapa en `.env`-fil i `InnoviaHub.Client` med följande innehåll:

```env
VITE_API_URL=http://localhost:5193
```

Öppna ett nytt terminalfönster:

```powershell
Set-Location InnoviaHub.Client
npm install
npm run dev
```

Klienten körs normalt på `http://localhost:5173`.

## Egen utveckling

#### AI-Assistent 
Jag har vidareutvecklat systemet med en AI-assistent som hjälper en användare att hitta tillgängliga resurser och gå vidare med bokningar via ett chattgränssnitt. Syftet med AI-assistenten är att göra det enklare och mer intiutivt för användaren att hitta och boka resurser. Arbetet har omfattat följande:
- Integrerat AI-assistenten med backendens API
- Implementerat ett flöde där användarens fråga, datum och tidsintervall används för att söka efter tillgängliga resurser
- Använt IAvailabilityService för att kontrollera resursers tillgänglighet och upptäcka överlappande bokningar
- Kopplat samman AI-assistentens svar med faktiska bokningsalternativ i frontend 
- Implementerat ett flöde där användaren kan välja en resurs och skicka vidare resursens ID och tidsintervall till boknings-API:t

**KRAV FÖR ANVÄNDNING AV AI-ASSISTENT** En giltig openAI API-nyckel krävs. Användningen av API:t kan medföra kostningar beroende på ditt konto och användning. 
- Skapa och hämta en API-nyckel via OpenAI platform
- Konfiguera den i en .env fil i roten i InnoviaHub.Api med följande variabel OPEN_API_KEY = "din-nyckel"
- Starta API:et enligt instruktion ovan

Backend läser API-nyckeln i Program.cs och använder den för kommunikation med OpenAI. Spara aldrig din persionliga API-nyckel i Git-repot. Kontrollera att .env-filen finns med i .gitignore

#### IoT sensorer (temperatur och koldioxid)
Jag har vidareutvecklat en IoT-lösning för att samla in och presentera temperatur och koldioxiddata i Innovia Hub. Lösningen använder tio simulerade IoT-enheter av modellen Acme CO2-Temp med serienummer dev-101 till dev-110. Arbetet har omfattat följande:
- **Registering av enheter** Registerat en tenant och tio IoT-enheter i DeviceRegistry via REST API
- **Utveckling av simulering** Ändrat Edge.Simulator så att samtliga tio enheter genererar och publicerar simulerade temperatur och CO2 värden via MQTT var tioende sekund 
- **Felsökning av datainsamling** Inditifierat och åtgärdat ett cacheproblem i DeviceRegistryClient i Ingest.Gateway, där flera enheter felaktigt kopplades till samma enhets-ID
- **Korrigering av cachehantering** Ändrat cache-nyckeln så att varje kombination av tenant och enhetens serienummer hanteras separat 
- **Integration med InnoviaHub** Ersatt hårdkodade exempelvärden på sensorsidan med enhetsinformation från DeviceRegistry och uppdaterade sensormätvärden 
- **Konfiguration av CORS** Anpassat CORS-policyerna för att möjliggöra kommunikation mellan frontend och relevanta backendtjänster i utvecklingsmiljö

**OBS!** IoT-lösningen ligger i ett separat repository och kräver att dess tillhörande tjänster konfigueras och startas. Integrationen är avsedd för utveckling och demostration och är inte färdig för produktion. 