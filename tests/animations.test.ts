import { describe,expect,it } from 'vitest';
import { animationDefinitions,animationName,createAnimation,usedAnimationModules } from '../src/renderer/animations/animationRegistry';

describe('animation registry',()=>{
 it('provides the primary text and image animations',()=>expect(animationDefinitions.map(item=>item.type)).toEqual(expect.arrayContaining(['blink','pulse','float','shake','vibration','fade','swing','bounce','flicker','glitch'])));
 it('creates an editable animation configuration',()=>{const animation=createAnimation('blink');expect(animation).toMatchObject({type:'blink',enabled:true,settings:{duration:1.5,strength:.45}})});
 it('uses stable exported keyframe names',()=>expect(animationName('pulse')).toBe('tb-pulse'));
 it('keeps all advanced settings and export modules',()=>{const sweep=createAnimation('light-sweep'),scanline=createAnimation('scanline-glitch'),neon=createAnimation('neon-pulse');expect(sweep.settings).toMatchObject({direction:'left-to-right',pingPong:false,sweepWidth:24,softness:35});expect(scanline.settings).toMatchObject({scanlineHeight:5,rgbSplit:5,glitchDuration:.32});expect(neon.settings).toMatchObject({primaryColor:'#ff48dc',secondaryColor:'#54e8ff',scalePulse:true})});
 it('requests only advanced modules actually used by export',()=>expect(usedAnimationModules([createAnimation('light-sweep'),createAnimation('neon-pulse')])).toEqual(['light-sweep','neon-pulse']));
});
