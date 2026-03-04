import Head from "next/head";

const DEFAULT_META_IMAGE = "https://www.papermark.com/_static/meta-image.png";

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
  const resolvedMetaImage = enableBranding && imageUrl ? imageUrl : DEFAULT_META_IMAGE;

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
      <meta property="og:image" content={resolvedMetaImage} key="og-image" />
      <meta name="twitter:image" content={resolvedMetaImage} key="tw-image" />
      <meta name="twitter:card" content="summary_large_image" key="tw-card" />
    </Head>
  );
};

export default CustomMetaTag;
