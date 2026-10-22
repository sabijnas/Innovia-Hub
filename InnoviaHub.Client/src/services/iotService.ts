import type { Sensor } from "../components/adminData";
import * as singalR from "@microsoft/signalr"

const REGISTRY_URL = "http://localhost:5101";
const HUB_URL = "http://localhost:5103/hub/telemetry";
const TENANT_SLUG = "innovia";

type Device = 
{
    id: string;
    tenantId: string;
    roomId: string | null;
    serial: string;
    model: string;
    status: string;
}

type Tenant = {
    id: string;
}

const sensorLocations: Record<string, string> = {
    "dev-101": "Korridor zon A",
    "dev-102": "Kontorsyta zon A",
    "dev-103": "Kontorsyta zon B",
    "dev-104": "Entré",
    "dev-105": "Kök",
    "dev-106": "Lounge zon A",
    "dev-107": "Lounge zon B",
    "dev-108": "Korridor zon B",
    "dev-109": "Korridor zon C",
    "dev-110": "Kontorsyta zon C",
}

//Hämtar enheter från DeviceRegistry och gör om till Sensorer
export async function getSensors(): Promise<Sensor[]> {
    const tenantResponse = await fetch(`${REGISTRY_URL}/api/tenants/by-slug/${TENANT_SLUG}`);
    if (!tenantResponse.ok) throw new Error("Kunde inte hämta tenant");
    const tenant = await tenantResponse.json() as Tenant;

    const devicesResponse = await fetch(`${REGISTRY_URL}/api/tenants/${tenant.id}/devices`);
    if (!devicesResponse.ok) throw new Error("Kunde inte hämta enheter");
    const devices = await devicesResponse.json() as Device[];

    return devices 
    .sort((a, b) => a.serial.localeCompare(b.serial)).map((x) => ({
        id: x.id,
        name: x.serial,
        value: "Väntar på data...",
        status: "ok",
        location: sensorLocations[x.serial.toLocaleLowerCase()] ?? "Okänd plats",
        icon: "🌡",
        trend: "-"
    }));
}

/* Lyssnar på nya värden via singalR, retunerar funktion som stänger anslutning 
när den inte längre behövs */
export function listenToMeasurements(onMeasurment: (m: { deviceId: string; type: string, value: number}) => void) 
{
    const connection = new singalR.HubConnectionBuilder()
    .withUrl(HUB_URL)
    .withAutomaticReconnect()
    .build();

    connection.on("measurementReceived", onMeasurment);
    connection.onreconnected(() => connection.invoke("JoinTenant", TENANT_SLUG));

    connection 
    .start()
    .then(() => connection.invoke("JoinTenant", TENANT_SLUG))
    .catch((e) => console.error("Realtime.Hub", e));

    return () => {
        connection.stop();
    }
}