/**
 * 统计用辅助：User-Agent 解析设备类型、IP 解析国家
 */
import { getHeader } from "h3";
import type { H3Event } from "h3";
import type { DeviceType } from "~/server/db/stats";

export function parseDeviceType(userAgent: string | undefined): DeviceType {
  const ua = (userAgent ?? "").toLowerCase();
  if (/bot|crawler|spider|slurp|headless/i.test(ua)) return "bot";
  if (/ipad|tablet|playbook|silk|kindle/i.test(ua)) return "tablet";
  if (
    /mobile|android|iphone|ipod|webos|blackberry|opera mini|iemobile|windows phone/i.test(
      ua,
    )
  ) {
    return "mobile";
  }
  if (ua.length > 0) return "desktop";
  return "unknown";
}

const PRIVATE_IP =
  /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::1|fc00:|fe80:)/i;

/** 从请求头读取可能已有的国家（Vercel / Cloudflare 等） */
export function getCountryFromHeaders(event: H3Event): string | null {
  const vercel = getHeader(event, "x-vercel-ip-country");
  if (vercel) return vercel;
  const cf = getHeader(event, "cf-ipcountry");
  if (cf && cf !== "XX") return cf;
  return null;
}

/** 通过 IP 查询国家代码（仅公网 IP，私有 IP 返回 XX） */
export async function getCountryFromIP(ip: string | undefined): Promise<string> {
  if (!ip || PRIVATE_IP.test(ip.trim())) return "XX";
  try {
    const res = await $fetch<{ countryCode?: string }>(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=countryCode`,
      { timeout: 3000 },
    );
    return res?.countryCode ?? "XX";
  } catch {
    return "XX";
  }
}
