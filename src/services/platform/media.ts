export async function chooseImages(count = 9): Promise<string[]> {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (result) => {
        const paths = Array.isArray(result.tempFilePaths)
          ? result.tempFilePaths
          : typeof result.tempFilePaths === 'string'
            ? [result.tempFilePaths]
            : []
        resolve(paths)
      },
      fail: reject,
    })
  })
}

export async function chooseMedia(count = 9): Promise<string[]> {
  return new Promise((resolve, reject) => {
    uni.chooseMedia({
      count,
      mediaType: ['image', 'video'],
      sourceType: ['album', 'camera'],
      success: (result: any) => {
        resolve((result.tempFiles ?? []).map((item: { tempFilePath: string }) => item.tempFilePath))
      },
      fail: reject,
    })
  })
}

export function previewImages(urls: string[], current?: string) {
  if (!urls.length) return
  uni.previewImage({
    urls,
    current: current ?? urls[0],
  })
}
