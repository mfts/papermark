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
      {title ? <meta property="og:title" content={title} /> : null}
      {description ? (
        <meta name="og:description" content={description} />
      ) : null}
      {imageUrl ? <meta name="og:image" content={imageUrl} /> : null}
      {title ? <meta name="twitter:title" content={title} /> : null}
      {description ? (
        <meta name="twitter:description" content={description} />
      ) : null}
      {imageUrl ? <meta name="twitter:image" content={imageUrl} /> : null}
    </Head>
  );
};

export default CustomMetatag;
