export function makePhoneCall(phone?: string) {
  if (!phone) return
  uni.makePhoneCall({ phoneNumber: phone })
}

export function openLocation(options: {
  latitude?: number
  longitude?: number
  name?: string
  address?: string
}) {
  if (options.latitude == null || options.longitude == null) {
    uni.showToast({
      title: '缺少坐标信息',
      icon: 'none',
    })
    return
  }
  uni.openLocation({
    latitude: options.latitude,
    longitude: options.longitude,
    name: options.name,
    address: options.address,
    scale: 16,
  })
}

