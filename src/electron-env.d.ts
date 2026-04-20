export {}

declare global {
  interface Window {
    disGatewayDesktop?: {
      apiBase: string | null
      platform: string
    }
  }
}
