import { NotionAPI } from "notion-client";

// Cloudflare 403s requests to www.notion.so that carry no User-Agent, and
// neither undici nor notion-client sets one. It has to look like a browser.
// https://github.com/NotionX/react-notion-x/issues/710
const notion = new NotionAPI({
  ofetchOptions: {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    },
  },
});

export default notion;
