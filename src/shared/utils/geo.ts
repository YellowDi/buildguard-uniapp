export type Coordinate = {
  latitude: number
  longitude: number
}

export const ADDRESS_COORDINATES: Record<string, Coordinate> = {
  '浙江省宁波市鄞州区菁华路188号': { latitude: 29.8158, longitude: 121.5966 },
  '广东省广州市黄埔区云埔工业区东路66号': { latitude: 23.1229, longitude: 113.5131 },
  '江苏省苏州市工业园区金鸡湖大道88号': { latitude: 31.3106, longitude: 120.7098 },
  '浙江省宁波市北仑区科创大道66号': { latitude: 29.9182, longitude: 121.8825 },
}

export function resolveCoordinate(address?: string | null): Coordinate | undefined {
  if (!address) return undefined
  return ADDRESS_COORDINATES[address]
}

