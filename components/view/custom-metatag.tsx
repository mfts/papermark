import Head from "next/head";

const CustomMetatag = ({
  enableBranding,
  title,
  description,
  imageUrl,
  url,
}: {
  enableBranding: boolean;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
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

export default CustomMetatag;
