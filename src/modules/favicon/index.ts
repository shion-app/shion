export const enum FaviconService {
  Google,
  IconHorse,
}

export function getFaviconUrl(service: FaviconService, domain: string) {
  switch (service) {
    case FaviconService.Google:
      return `http://www.google.com/s2/favicons?domain=${domain}`
    default:
      return `https://icon.horse/icon/${domain}`
  }
}
