import{ComponentSystem as g}from"sweettooth";function s(o){return function(n){return function(i){const t=typeof i=="string"?{name:i}:i,u=t.name||"",c=ExtractHookName,e=c.replace(/[A-Z]/g,a=>`-${a.toLowerCase()}`),T={name:`naming-${e}`,beforeCreate:a=>({...a,meta:{...a.meta,hookName:u,processedName:c,kebabName:e}})},d=t.lifecycle?{name:`lifecycle-${e}`,...t.lifecycle}:void 0;return{reactive:o.create({...t,id:e,plugins:[T,...d?[d]:[]]}),meta:{originalName:u,processedName:c,kebabName:e,framework:n}}}}}const m=new g,l=s(m)("react"),H=s(m)("solid"),x=s(m)("vue");function N(){const o=l("useCounter");console.log(o.meta);const f=l({name:"useUserProfile",initialValue:null,lifecycle:{beforeCreate:r=>(console.log(`Creating hook: ${r.meta.hookName}`),r)}}),n=l({name:"useUserData",initialValue:{id:"",name:""}});return{counterHook:o,userHook:f,typedHook:n}}export{s as createEnhancedHookFactory,l as createReactHook,H as createSolidHook,x as createVueHook};
