export function classNames(...classes: string[]) {
  const uniqueClasses = Array.from(new Set(classes.join(" ").split(" ")));
  return uniqueClasses.join(" ");
}

export function getExtension(url: string) {
  // @ts-ignore
  return url.split(/[#?]/)[0].split(".").pop().trim();
}

interface SWRError extends Error {
  status: number;
}

export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, init);

  if (!res.ok) {
    const error = await res.text();
    const err = new Error(error) as SWRError;
    err.status = res.status;
    throw err;
  }

  return res.json();
}
