import Head from "next/head";

const CustomMetatag = ({
  title,
  description,
  imageUrl,
}: {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
}) => {
  return (
    <Head>
      {title ? <title>{title}</title> : null}
      {description ? (
        <meta property="description" content={description} key="description" />
      ) : null}
      {title ? (
        <meta property="og:title" content={title} key="og-title" />
      ) : null}
      {description ? (
        <meta
          name="og:description"
          content={description}
          key="og-description"
        />
      ) : null}
      {imageUrl ? (
        <meta name="og:image" content={imageUrl} key="og-image" />
      ) : null}
      {title ? (
        <meta name="twitter:title" content={title} key="tw-title" />
      ) : null}
      {description ? (
        <meta
          name="twitter:description"
          content={description}
          key="tw-description"
        />
      ) : null}
      {imageUrl ? (
        <meta name="twitter:image" content={imageUrl} key="tw-image" />
      ) : null}
    </Head>
  );
};

export default CustomMetatag;
