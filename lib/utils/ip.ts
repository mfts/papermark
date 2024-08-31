export function getIpAddress(headers: {
  [key: string]: string | string[] | undefined;
}): string {
  if (typeof headers["x-forwarded-for"] === "string") {
    return (headers["x-forwarded-for"] ?? "127.0.0.1").split(",")[0];
  }
  return "127.0.0.1";
}
