export function randomColor() {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++)
    color += letters[Math.floor(Math.random() * 16)]

  return color
}

export const createIconBlob = (buffer: number[]) => new Blob([new Uint8Array(buffer)], { type: 'image/png' })
