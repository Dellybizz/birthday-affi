import type { NextConfig } from "next";
const publicSiteUrl=(process.env.NEXT_PUBLIC_WEB_URL||'https://wiffeyyyy-os.vercel.app').trim().replace(/\/+$/,'');
const nextConfig: NextConfig = {
 transpilePackages: ["@wiffeyyyy/ui"],
 async rewrites(){
  // Bundled experience photos belong to the public app, while /media stays private here.
  if(!publicSiteUrl)return [];
  const url=new URL(publicSiteUrl);
  if(!['https:','http:'].includes(url.protocol))return [];
  return [{source:'/puzzles/:path*',destination:url.origin+'/puzzles/:path*'}];
 }
};
export default nextConfig;
