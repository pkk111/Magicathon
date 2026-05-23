export async function shareMemeUrl(memeId: string) {
  const url = `${window.location.origin}/m/${memeId}`
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Check out this meme!', url })
      return
    } catch { /* user cancelled, fall through to clipboard */ }
  }
  try {
    await navigator.clipboard.writeText(url)
  } catch { /* clipboard unavailable */ }
}
