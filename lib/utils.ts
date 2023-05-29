export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export function getExtension(url: string) {
  // @ts-ignore
  return url.split(/[#?]/)[0].split(".").pop().trim();
}
