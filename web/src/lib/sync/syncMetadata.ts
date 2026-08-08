import type { SyncMetadata } from "./syncTypes";
const KEY="axom.sync.metadata.v1";
export function deviceId():string { const meta=read(); if(meta.deviceId)return meta.deviceId; const id=crypto.randomUUID(); write({...meta,deviceId:id}); return id; }
export function read():SyncMetadata { try { const raw=localStorage.getItem(KEY); return raw?{...defaults(),...JSON.parse(raw)}:defaults(); } catch{return defaults();} }
export function write(value:SyncMetadata){localStorage.setItem(KEY,JSON.stringify(value));}
export function clearAccountSync(){const id=read().deviceId;write({...defaults(),deviceId:id});}
function defaults():SyncMetadata{return{deviceId:"",baseRevision:0,pending:false,attempt:0};}
