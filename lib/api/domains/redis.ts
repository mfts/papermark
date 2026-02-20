import { redis } from "@/lib/redis";

const DOMAIN_REDIRECT_PREFIX = "domain:redirect";

function getRedisKey(domain: string): string {
  return `${DOMAIN_REDIRECT_PREFIX}:${domain.toLowerCase()}`;
}

export async function getDomainRedirectUrl(
  domain: string,
): Promise<string | null> {
  return redis.get<string>(getRedisKey(domain));
}

export async function setDomainRedirectUrl(
  domain: string,
  redirectUrl: string | null,
): Promise<void> {
  const key = getRedisKey(domain);
  if (redirectUrl) {
    await redis.set(key, redirectUrl);
  } else {
    await redis.del(key);
  }
}

export async function deleteDomainRedirectUrl(domain: string): Promise<void> {
  await redis.del(getRedisKey(domain));
}
