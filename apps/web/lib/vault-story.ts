import 'server-only';
// Future private chapters belong here or in a server-authorized content source.
// Send them only after the riddle succeeds; never embed them in the public page.
export type VaultStory={title:string;subtitle:string;chapters:{id:string;title:string;body:string}[]};
export function getVaultStory():VaultStory{return {title:'How I fell in love with you',subtitle:'A little story. A thousand feelings.',chapters:[]}}
