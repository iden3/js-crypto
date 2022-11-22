import { PrivateKey, Signature } from '../src';
import { utils } from '../src/ff';
import { utils as bjjUtils } from '../src/babyjub';

describe('eddsa keys(Private, Public, Signature)', () => {
  it('test signature flow', () => {
    const msgBuf = bjjUtils.fromHexString('000102030405060708090000');
    const msg = utils.leBuff2int(msgBuf);
    
    const skBuff = bjjUtils.fromHexString('0001020304050607080900010203040506070809000102030405060708090001');
    
    const privateKey = new PrivateKey(skBuff);
  
    const pubKey = privateKey.public();
    expect(pubKey.p[0].toString()).toEqual('13277427435165878497778222415993513565335242147425444199013288855685581939618');
    expect(pubKey.p[1].toString()).toEqual('13622229784656158136036771217484571176836296686641868549125388198837476602820');
  
    const pPubKey = pubKey.compress();

    const signature = privateKey.signPoseidon(msg);
  
    expect(signature.R8[0].toString()).toEqual('11384336176656855268977457483345535180380036354188103142384839473266348197733');
    expect(signature.R8[1].toString()).toEqual('15383486972088797283337779941324724402501462225528836549661220478783371668959');
    expect(signature.S.toString()).toEqual('1672775540645840396591609181675628451599263765380031905495115170613215233181');
  
    const pSignature = signature.compress();
    expect(bjjUtils.toHexString(pSignature)).toEqual(''+
      'dfedb4315d3f2eb4de2d3c510d7a987dcab67089c8ace06308827bf5bcbe02a2'+
      '9d043ece562a8f82bfc0adb640c0107a7d3a27c1c7c1a6179a0da73de5c1b203');
  
    const uSignature = Signature.newFromCompressed(pSignature);
    
    expect(pubKey.verifyPoseidon(msg, uSignature)).toBeTruthy();
  });
});
