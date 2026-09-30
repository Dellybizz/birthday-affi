export type AdminRole="owner"|"editor"|"viewer";
export const rolePermissions:Record<AdminRole,string[]>={
owner:["site:read","site:write","site:publish","site:settings","media:write","users:write","audit:read"],
editor:["site:read","site:write","media:write","audit:read"],
viewer:["site:read","audit:read"]
};
export function can(role:AdminRole,permission:string){return rolePermissions[role]?.includes(permission)??false;}
