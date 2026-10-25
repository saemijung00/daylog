import {webcrypto as crypto} from 'node:crypto';
const b64=b=>Buffer.from(b).toString('base64');
export async function encrypt(data,password){
 if(!password||password.length<20)throw Error('20자 이상의 고유한 리포트 암호가 필요합니다');
 const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
 const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:600000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt']);
 const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(data)));
 return {version:1,kdf:'PBKDF2-SHA256',iterations:600000,salt:b64(salt),iv:b64(iv),ciphertext:b64(ciphertext)};
}
