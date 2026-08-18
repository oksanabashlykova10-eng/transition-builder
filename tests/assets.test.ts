import { describe,expect,it } from 'vitest';
import { createUrlAsset,formatSize,validateAsset } from '../src/assets/AssetRepository';

describe('asset validation',()=>{
 it('accepts supported label images under 2 MB',()=>{const file=new File([new Uint8Array(1024)],'label.png',{type:'image/png'});expect(()=>validateAsset(file,'label-image')).not.toThrow()});
 it('rejects oversized files with actual and maximum sizes',()=>{const file=new File([new Uint8Array(2*1024*1024+1)],'large.png',{type:'image/png'});expect(()=>validateAsset(file,'label-image')).toThrow(/Этот файл весит 2.0 МБ.*2.0 МБ/)});
 it('rejects unsupported image formats',()=>{const file=new File(['x'],'vector.svg',{type:'image/svg+xml'});expect(()=>validateAsset(file,'label-image')).toThrow(/PNG, JPG, GIF и WebP/)});
 it('normalizes URL assets',()=>{const asset=createUrlAsset('https://example.com/apple.png','image');expect(asset).toMatchObject({source:'url',url:'https://example.com/apple.png',name:'apple.png'})});
 it('formats small sizes for the project indicator',()=>expect(formatSize(127450)).toBe('125 КБ'));
});
