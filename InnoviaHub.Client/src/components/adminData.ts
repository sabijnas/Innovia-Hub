import { useEffect, useState } from "react";
import { getSensors, listenToMeasurements } from "../services/iotService";

export type AdminTab = "dashboard" | "sensors" | "resources" | "members";

export type Sensor = {
  id: string;
  name: string;
  value: string;
  status: string;
  location: string;
  icon: string;
  trend: string;
};

export function useSensors(): {
  sensors: Sensor[];
  error: string | null;
} {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const latest: Record<string, {temp?: number; co2?: number}> = {};

    getSensors().then((loadedSensors) => {
      if (loadedSensors.length === 0 ) {
        throw new Error("Inga sensorer hittades");
      }

      setSensors(loadedSensors);
      setError(null);
    })
    .catch((error) => {
      console.error(error)
      setSensors([]);
      setError("Kunde inte hämta sensorer... Prova att ladda om sidan eller försök igen senare");
    });

    return listenToMeasurements((m) => {
      const id = m.deviceId.toLowerCase();
      const room = (latest[id] ??= {})
      if (m.type === "temperature") room.temp = m.value;
      else if (m.type === "co2") room.co2 = m.value;

      setSensors((prev) => prev.map((s) => s.id.toLocaleLowerCase() !== id ? s : {
        ...s, value: `${room.temp !== undefined ? room.temp.toFixed(1) : "-"}°C · CO₂ ${
          room.co2 !== undefined ? Math.round(room.co2) : "-"} ppm`,
          status: "ok"
      }))
    })
  }, [])
  return {sensors, error};
}

export const adminTabs: { id: AdminTab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Översikt", icon: "◈" },
  { id: "sensors", label: "Sensorer", icon: "⚙" },
  { id: "resources", label: "Resurser", icon: "▪" },
  { id: "members", label: "Medlemmar", icon: "◯" },
];
