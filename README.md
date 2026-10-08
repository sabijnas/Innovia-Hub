# Innovia Hub

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

### AI-feature 
En AI-assitent är implementerad i Innoviahub, den ansvarar för att kunna leta och genomföra bokningar. När användaren skickar en fråga tillsammans med tid och datum skickar frontend en POST-request till controllern. Controllern validerar sedan tidsintervallet och anropar IAvailabilityService för att hitta resurser som är tillängliga. 
<br> 
<br>
AvailabilityService hämtar resurser och bokningar via repositories och kollar om någon bokning överlappar tiden som efterfrågas. Endast aktiva och lediga resurser retuneras. De lediga resurserna serialiseras till JSON och skickas tillsammans med användarens fråga till AI:n. Backend retunerar både AI:ns svar och listan över tillgängliga resurser till frontend. Resurserna visas som bokningsbara alternativ i chatten. När en använadre väljer en resurs skickas ID samt tidsintervallet till boknings-APIet.