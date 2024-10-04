import Head from "next/head";

const CustomMetaTag = ({
  enableBranding,
  title,
  description,
  imageUrl,
  url,
  favicon,
}: {
  enableBranding: boolean;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  favicon: string | null;
  url: string | null;
}) => {
  return (
    <Head>
      {/* meta URL */}
      {url && (
        <>
          <link rel="canonical" href={url} key="canonical" />
          <meta property="og:url" content={url} key="og-url" />
        </>
      )}

      {favicon && (
        <>
          <link rel="icon" type="image/x-icon" href={favicon} key="favicon" />
          {favicon.endsWith(".ico") && (
            <link rel="icon" type="image/x-icon" href={favicon} />
          )}
          {favicon.endsWith(".png") && (
            <link rel="icon" type="image/png" href={favicon} sizes="32x32" />
          )}
          {favicon.endsWith(".svg") && (
            <link rel="icon" type="image/svg+xml" href={favicon} />
          )}
          <link rel="apple-touch-icon" href={favicon} />
        </>
      )}

      {/* meta title */}
      {enableBranding && title && (
        <>
          <title>{title}</title>
          <meta property="og:title" content={title} key="og-title" />
          <meta name="twitter:title" content={title} key="tw-title" />
        </>
      )}

      {/* meta description */}
      {enableBranding && description && (
        <>
          <meta name="description" content={description} key="description" />
          <meta
            property="og:description"
            content={description}
            key="og-description"
          />
          <meta
            name="twitter:description"
            content={description}
            key="tw-description"
          />
        </>
      )}

      {/* meta image */}
      {enableBranding && imageUrl && (
        <>
          <meta property="og:image" content={imageUrl} key="og-image" />
          <meta name="twitter:image" content={imageUrl} key="tw-image" />
        </>
      )}
    </Head>
  );
};

export default CustomMetaTag;
