import { beforeEach,describe,expect,it } from 'vitest';
import { createProject } from '../src/project/defaults/createProject';
import type { ImageSequenceLayer } from '../src/project/model/project';
import { useEditorStore } from '../src/project/store/editorStore';
import { sequencePoints } from '../src/renderer/sequences/sequenceGeometry';

describe('image sequences',()=>{
 beforeEach(()=>useEditorStore.setState({project:createProject(),selectedLayerId:null,past:[],future:[],transactionStart:null}));
 it('creates a seven-item light-wave sequence',()=>{useEditorStore.getState().addImageSequenceLayer();const layer=useEditorStore.getState().project.layers[0] as ImageSequenceLayer;expect(layer).toMatchObject({type:'image-sequence',repeatCount:7,pathType:'line',wave:{type:'light-wave',duration:3.3,delay:.18}})});
 it('keeps deterministic settings for random wave combinations',()=>{useEditorStore.getState().addImageSequenceLayer();const layer=useEditorStore.getState().project.layers[0] as ImageSequenceLayer;expect(layer.wave).toMatchObject({rotation:25,blur:8,activeBrightness:1.15,randomSeed:37})});
 it('places line points in order and respects spacing',()=>{useEditorStore.getState().addImageSequenceLayer();const layer=useEditorStore.getState().project.layers[0] as ImageSequenceLayer;const compact=sequencePoints({...layer,spacing:10},7),wide=sequencePoints({...layer,spacing:80},7);expect(compact[0].y).toBe(50);expect(compact.at(-1)!.x-compact[0].x).toBeLessThan(wide.at(-1)!.x-wide[0].x)});
 it('creates circular points around the center',()=>{useEditorStore.getState().addImageSequenceLayer();const layer={...(useEditorStore.getState().project.layers[0] as ImageSequenceLayer),pathType:'circle' as const};const points=sequencePoints(layer,4);expect(points[0]).toEqual({x:50,y:12});expect(points).toHaveLength(4)});
 it('distributes items over a custom path and supports reverse',()=>{useEditorStore.getState().addImageSequenceLayer();const base=useEditorStore.getState().project.layers[0] as ImageSequenceLayer,layer={...base,pathType:'custom' as const,pathSettings:{...base.pathSettings,smooth:0,customPoints:[{x:0,y:10},{x:50,y:90},{x:100,y:10}]}};expect(sequencePoints(layer,3)).toEqual([{x:0,y:10},{x:50,y:90},{x:100,y:10}]);expect(sequencePoints({...layer,pathSettings:{...layer.pathSettings,reverse:true}},3)[0]).toEqual({x:100,y:10})});
});
