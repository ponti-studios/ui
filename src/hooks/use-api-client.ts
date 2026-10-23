"use client";

import { useCallback, useMemo, useRef, useState } from "react";

export interface UseApiClientOptions {
  /** Base URL prepended to relative endpoints. Defaults to same-origin requests. */
  baseUrl?: string;
  /** Fetch credentials policy. Defaults to the browser's same-origin behavior. */
  credentials?: RequestCredentials;
  /** Injectable Fetch implementation for custom runtimes and deterministic tests. */
  fetcher?: typeof fetch;
}

export interface ApiRequestOptions<T> {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: T | null;
  headers?: HeadersInit;
  stream?: boolean;
  signal?: AbortSignal;
}

interface ApiState {
  isLoading: boolean;
  error: Error | null;
}

function resolveEndpoint(baseUrl: string, endpoint: string) {
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  const base = baseUrl.replace(/\/+$/, "");
  const path = endpoint.replace(/^\/+/, "");
  return base ? `${base}/${path}` : `/${path}`;
}

async function responseErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("json")) {
    const payload: unknown = await response.json().catch(() => null);
    if (payload && typeof payload === "object" && "message" in payload) {
      const message = payload.message;
      if (typeof message === "string" && message.length > 0) return message;
    }
  } else {
    const text = await response.text().catch(() => "");
    if (text.length > 0) return text;
  }
  return `Request failed with status ${response.status}`;
}

/**
 * Same-origin by default, with explicit configuration for applications that
 * need another API host. The hook owns request status only; server state and
 * caching belong in the consuming application's query layer.
 */
export function useApiClient({
  baseUrl = "",
  credentials = "same-origin",
  fetcher = fetch,
}: UseApiClientOptions = {}) {
  const [state, setState] = useState<ApiState>({ isLoading: false, error: null });
  const inFlightCount = useRef(0);

  const fetchApi = useCallback(
    async <T, S>(endpoint: string, options: ApiRequestOptions<T> = {}): Promise<S> => {
      const { method = "GET", body, headers, stream = false, signal } = options;
      inFlightCount.current += 1;
      setState((previous) => ({ ...previous, isLoading: true, error: null }));

      try {
        const requestHeaders = new Headers(headers);
        const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
        const hasBody = body !== undefined && body !== null;

        if (hasBody && !isFormData && !requestHeaders.has("Content-Type")) {
          requestHeaders.set("Content-Type", "application/json");
        }

        const response = await fetcher(resolveEndpoint(baseUrl, endpoint), {
          method,
          headers: requestHeaders,
          body: hasBody ? (isFormData ? (body as BodyInit) : JSON.stringify(body)) : null,
          credentials,
          signal,
        });

        if (!response.ok) {
          throw new Error(await responseErrorMessage(response));
        }

        if (stream) return response as S;
        if (response.status === 204 || response.status === 205) return undefined as S;

        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("json")) return (await response.json()) as S;
        if (response.status === 0 || response.headers.get("content-length") === "0") {
          return undefined as S;
        }
        const text = await response.text();
        return (text.length === 0 ? undefined : text) as S;
      } catch (error) {
        const normalizedError =
          error instanceof Error ? error : new Error("An unknown request error occurred");
        setState((previous) => ({ ...previous, error: normalizedError }));
        throw normalizedError;
      } finally {
        inFlightCount.current = Math.max(0, inFlightCount.current - 1);
        const isLoading = inFlightCount.current > 0;
        setState((previous) => ({ ...previous, isLoading }));
      }
    },
    [baseUrl, credentials, fetcher],
  );

  const api = useMemo(
    () => ({
      get: <S>(endpoint: string, options?: Omit<ApiRequestOptions<never>, "method" | "body">) =>
        fetchApi<never, S>(endpoint, { ...options, method: "GET" }),

      post: <T, S>(endpoint: string, data?: T, options?: Omit<ApiRequestOptions<T>, "method">) =>
        fetchApi<T, S>(endpoint, { ...options, method: "POST", body: data }),

      postStream: <T>(
        endpoint: string,
        data: T,
        options?: Omit<ApiRequestOptions<T>, "method" | "stream">,
      ) => fetchApi<T, Response>(endpoint, { ...options, method: "POST", body: data, stream: true }),

      postFormData: <S>(
        endpoint: string,
        formData: FormData,
        options?: Omit<ApiRequestOptions<FormData>, "method">,
      ) => fetchApi<FormData, S>(endpoint, { ...options, method: "POST", body: formData }),

      put: <T, S>(endpoint: string, data: T, options?: Omit<ApiRequestOptions<T>, "method">) =>
        fetchApi<T, S>(endpoint, { ...options, method: "PUT", body: data }),

      delete: <S>(endpoint: string, options?: Omit<ApiRequestOptions<never>, "method">) =>
        fetchApi<never, S>(endpoint, { ...options, method: "DELETE" }),
    }),
    [fetchApi],
  );

  return { ...api, isLoading: state.isLoading, error: state.error };
}
