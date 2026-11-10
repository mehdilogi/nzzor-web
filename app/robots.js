// app/robots.js — served at https://nzzor.com/robots.txt
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/account", "/booking", "/partner", "/api/"],
      },
    ],
    sitemap: "https://nzzor.com/sitemap.xml",
    host: "https://nzzor.com",
  };
}
