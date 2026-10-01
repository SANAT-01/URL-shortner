"use server";

import { BACKEND_URL } from "@/lib/backend";

export type ShortenState = {
  status: "idle" | "success" | "error";
  message?: string;
  code?: string;
  shortUrl?: string;
  longUrl?: string;
};

export async function shortenUrl(
  _prevState: ShortenState,
  formData: FormData,
): Promise<ShortenState> {
  const longUrl = (formData.get("longUrl") ?? "").toString().trim();

  if (!longUrl) {
    return { status: "error", message: "Enter a URL." };
  }

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/shorten`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: longUrl,
      cache: "no-store",
    });
  } catch {
    return {
      status: "error",
      message: `Could not reach the backend at ${BACKEND_URL}. Is it running?`,
    };
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      status: "error",
      message: data?.error ?? `Request failed (${response.status})`,
    };
  }

  return {
    status: "success",
    code: data.code,
    shortUrl: data.short_url,
    longUrl,
  };
}
