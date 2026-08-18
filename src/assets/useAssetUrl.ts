import { useEffect, useState } from 'react';
import type { AssetReference } from '../project/model/project';
import { getAssetBlob } from './AssetRepository';
export function useAssetUrl(asset?:AssetReference){const[url,setUrl]=useState<string|undefined>(asset?.url);useEffect(()=>{let objectUrl:string|undefined,cancelled=false;if(!asset){setUrl(undefined);return}if(asset.source==='url'){setUrl(asset.url);return}void getAssetBlob(asset.id).then(blob=>{if(blob&&!cancelled){objectUrl=URL.createObjectURL(blob);setUrl(objectUrl)}});return()=>{cancelled=true;if(objectUrl)URL.revokeObjectURL(objectUrl)}},[asset]);return url}
