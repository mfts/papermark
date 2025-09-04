import { NotionAPI } from "notion-client";

const notion = new NotionAPI({
  kyOptions: {
    hooks: {
      beforeRequest: [
        (request, options) => {
          const url = request.url.toString();

          if (url.includes("/api/v3/syncRecordValues")) {
            return new Request(
              url.replace(
                "/api/v3/syncRecordValues",
                "/api/v3/syncRecordValuesMain",
              ),
              options,
            );
          }

          return request;
        },
      ],
    },
  },
});
export default notion;
