export const GLOBE_RADIUS = 1.3;
const CENTER_LONGITUDE = 20;

export function globePoint(
  longitude: number,
  latitude: number,
  radius = GLOBE_RADIUS,
): [number, number, number] {
  const lon = ((longitude - CENTER_LONGITUDE) * Math.PI) / 180;
  const lat = (latitude * Math.PI) / 180;
  return [
    radius * Math.cos(lat) * Math.sin(lon),
    radius * Math.sin(lat),
    radius * Math.cos(lat) * Math.cos(lon),
  ];
}

export const globeLabels = [
  ...Array.from("0415672389", (text, index) => ({
    text,
    hemisphere: "north" as const,
    longitude:
      CENTER_LONGITUDE + (index % 5) * 72 - 144 + (index >= 5 ? 36 : 0),
    latitude: index < 5 ? 52 : 25,
  })),
  ...Array.from("ГДАЕЖЗБВИЙ", (text, index) => ({
    text,
    hemisphere: "south" as const,
    longitude:
      CENTER_LONGITUDE + (index % 5) * 72 - 144 + (index >= 5 ? 36 : 0),
    latitude: index < 5 ? -25 : -52,
  })),
];

export function arcPoints(ring: number[][], radius: number) {
  const points: [number, number, number][] = [];
  for (let index = 0; index < ring.length - 1; index++) {
    const [lon, lat] = ring[index];
    const [nextLon, nextLat] = ring[index + 1];
    let difference = nextLon - lon;
    if (difference > 180) difference -= 360;
    if (difference < -180) difference += 360;
    const steps = Math.max(
      1,
      Math.ceil(Math.max(Math.abs(difference), Math.abs(nextLat - lat)) / 2),
    );
    for (let step = 0; step <= steps; step++)
      points.push(
        globePoint(
          lon + (difference * step) / steps,
          lat + ((nextLat - lat) * step) / steps,
          radius,
        ),
      );
  }
  return points;
}
