import{K as e,i as s}from"./IdurarOs-2nFZV4nX.js";import"./index-fQzVIFut.js";const r=new e("antFadeIn",{"0%":{opacity:0},"100%":{opacity:1}}),m=new e("antFadeOut",{"0%":{opacity:1},"100%":{opacity:0}}),l=function(a){let i=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;const{antCls:o}=a,n=`${o}-fade`,t=i?"&":"";return[s(n,r,m,a.motionDurationMid,i),{[`
        ${t}${n}-enter,
        ${t}${n}-appear
      `]:{opacity:0,animationTimingFunction:"linear"},[`${t}${n}-leave`]:{animationTimingFunction:"linear"}}]};export{l as i};
