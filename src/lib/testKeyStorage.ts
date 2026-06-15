const prefix = "loglens-test-key";

export function saveTestApiKey(serviceId: string, apiKey: string) {
  sessionStorage.setItem(`${prefix}:${serviceId}`, apiKey);
}

export function getTestApiKey(serviceId: string): string | null {
  return sessionStorage.getItem(`${prefix}:${serviceId}`);
}
