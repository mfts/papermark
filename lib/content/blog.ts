import matter from "gray-matter";
import path from "path";
import fs from "fs/promises";
import { cache } from "react";

// `cache` is a React 18 feature that allows you to cache a function for the lifetime of a request.
// this means getPosts() will only be called once per page build, even though we may call it multiple times
// when rendering the page.
export const getPosts = cache(async () => {
  const postsDir = path.join(process.cwd(), 'content/blog/')
  const posts = await fs.readdir(postsDir);

  console.log("posts", posts)
  return Promise.all(
    posts
      .filter((file) => path.extname(file) === ".mdx")
      .map(async (file) => {
        const filePath = path.join(process.cwd(), `content/blog/${file}`)
        const postContent = await fs.readFile(filePath, "utf8");
        const { data, content } = matter(postContent);

        // if (data.published === false) {
        //   return null;
        // }

        return { data, body: content }; // TODO: type this post object
      }),
  );
});

export async function getPost(slug: string) {
  const posts = await getPosts();
  console.log("posts", posts)
  return posts.find((post: any) => post.data.slug === slug);
}
