import type { NoctyriumState } from "../types";
export type ProtectionStatus="local-only"|"saved-locally"|"syncing"|"protected"|"offline"|"retrying"|"conflict";
export interface SyncMetadata { deviceId:string; accountUserId?:string; baseRevision:number; pending:boolean; pendingIdempotencyKey?:string; lastHash?:string; lastProtectedAt?:string; attempt:number; }
export interface SnapshotEnvelope { schemaVersion:number; contentHash:string; payload:NoctyriumState; deviceId:string; baseRevision:number; idempotencyKey:string; reason:"foundation"|"automatic"|"manual"|"pre_restore"|"restore"; }
export type PushResult={status:"accepted";revision:number;revisionId:string;idempotent:boolean}|{status:"conflict";serverRevision:number;preservedRevisionId:string};
export interface ProtectedRevision { id:string; revision:number; schemaVersion:number; contentHash:string; payload:NoctyriumState; reason:string; createdAt:string; }
export interface SyncTransport { push(envelope:SnapshotEnvelope):Promise<PushResult>; history():Promise<ProtectedRevision[]>; revision(id:string):Promise<ProtectedRevision>; }
