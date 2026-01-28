/**
 * Authenticated fetch using NextAuth session
 * NextAuth handles authentication via cookies, so we don't need to add headers
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  // NextAuth handles authentication via cookies automatically
  // No need to add authorization headers
  return fetch(url, {
    ...options,
    credentials: 'include', // Include cookies for NextAuth session
  });
}

export async function authenticatedFormData(url: string, formData: FormData) {
  return authenticatedFetch(url, {
    method: 'POST',
    body: formData,
  });
}

export async function authenticatedJson(url: string, options: { method?: string; body?: any } = {}) {
  const method = options.method || (options.body ? 'POST' : 'GET');
  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (options.body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(options.body);
  }
  
  return authenticatedFetch(url, fetchOptions);
}
