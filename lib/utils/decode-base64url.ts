export function decodeBase64Url(base64url: string) {
  base64url = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64url.length % 4) {
    base64url += "=";
  }
  return decodeURIComponent(
    Array.prototype.map
      .call(atob(base64url), function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join(""),
  );
}
