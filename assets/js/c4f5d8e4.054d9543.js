"use strict";(self.webpackChunkxlog=self.webpackChunkxlog||[]).push([[2634],{3971:(e,s,i)=>{i.r(s),i.d(s,{default:()=>E});var a=i(6540),t=i(9201),l=i(8774),n=i(4164);const r={heroBanner:"heroBanner_qdFl",heroContent:"heroContent_mKPX",heroText:"heroText_ryRM",hero__title:"hero__title_sobY",hero__subtitle:"hero__subtitle_AUTZ",buttons:"buttons_AeoN",heroImage:"heroImage_xZN7"},c="projectsSection_QELK",d="sectionTitle_GeVO",o="cardContainer_vAVA",m="cardsWrapper_eNWG",h="cardsPage_TeN7",g="card_jYXH",p="cardImage_T_1l",x="cardBody_zSso",u="paginationDots_xSTP",j="dot_ODUK",_="activeDot_a0SO",N=[{title:"Kubernetes",imageUrl:"img/algolia.1026fe5.640.png",description:"\u5728K8s\u7684\u5b66\u4e60\u8fc7\u7a0b\u4e2d\u7684\u8bb0\u5f55",link:"/k8s"},{title:"Kubernetes",imageUrl:"img/algolia.1026fe5.640.png",description:"\u5728K8s\u7684\u5b66\u4e60\u8fc7\u7a0b\u4e2d\u7684\u8bb0\u5f55",link:"/k8s"},{title:"Kubernetes",imageUrl:"img/algolia.1026fe5.640.png",description:"\u5728K8s\u7684\u5b66\u4e60\u8fc7\u7a0b\u4e2d\u7684\u8bb0\u5f55",link:"/k8s"},{title:"Kubernetes",imageUrl:"img/algolia.1026fe5.640.png",description:"\u5728K8s\u7684\u5b66\u4e60\u8fc7\u7a0b\u4e2d\u7684\u8bb0\u5f55",link:"/k8s"},{title:"Kubernetes",imageUrl:"img/algolia.1026fe5.640.png",description:"\u5728K8s\u7684\u5b66\u4e60\u8fc7\u7a0b\u4e2d\u7684\u8bb0\u5f55",link:"/k8s"},{title:"Kubernetes",imageUrl:"img/algolia.1026fe5.640.png",description:"\u5728K8s\u7684\u5b66\u4e60\u8fc7\u7a0b\u4e2d\u7684\u8bb0\u5f55",link:"/k8s"},{title:"Kubernetes",imageUrl:"img/algolia.1026fe5.640.png",description:"\u5728K8s\u7684\u5b66\u4e60\u8fc7\u7a0b\u4e2d\u7684\u8bb0\u5f55",link:"/k8s"},{title:"Kubernetes",imageUrl:"img/algolia.1026fe5.640.png",description:"\u5728K8s\u7684\u5b66\u4e60\u8fc7\u7a0b\u4e2d\u7684\u8bb0\u5f55",link:"/k8s"},{title:"Kubernetes",imageUrl:"img/algolia.1026fe5.640.png",description:"\u5728K8s\u7684\u5b66\u4e60\u8fc7\u7a0b\u4e2d\u7684\u8bb0\u5f55",link:"/k8s"},{title:"Kubernetes",imageUrl:"img/algolia.1026fe5.640.png",description:"\u5728K8s\u7684\u5b66\u4e60\u8fc7\u7a0b\u4e2d\u7684\u8bb0\u5f55",link:"/k8s"}];var v=i(4848);const k=function(){const[e,s]=(0,a.useState)(1),[i,t]=(0,a.useState)(0),l=Math.ceil(N.length/6);(0,a.useEffect)((()=>{t(100*-(e-1))}),[e]);const n=e=>{const s=6*e,i=s+6;return N.slice(s,i)};return(0,v.jsx)("section",{className:c,children:(0,v.jsxs)("div",{className:"container",children:[(0,v.jsx)("div",{className:d,children:(0,v.jsx)("h2",{children:"\u6211\u7684\u77e5\u8bc6\u5e93"})}),(0,v.jsx)("div",{className:o,children:(0,v.jsx)("div",{className:m,style:{transform:`translateX(${i}%)`,width:100*l+"%"},children:Array.from({length:l}).map(((e,s)=>(0,v.jsx)("div",{className:h,children:n(s).map((e=>(0,v.jsx)("div",{className:g,children:(0,v.jsxs)("div",{onClick:()=>window.location.href=e.link,children:[(0,v.jsx)("div",{className:p,children:(0,v.jsx)("img",{src:e.imageUrl,alt:e.title})}),(0,v.jsxs)("div",{className:x,children:[(0,v.jsx)("h3",{children:e.title}),(0,v.jsx)("p",{children:e.description})]})]})},e.id)))},s)))})}),(0,v.jsx)("div",{className:u,children:(()=>{const i=[];for(let a=1;a<=l;a++)i.push((0,v.jsx)("span",{className:`${j} ${a===e?_:""}`,onClick:()=>{var i;(i=a)!==e&&s(i)}},a));return i})()})]})})};var b=i(6588);const K="recentUpdatesSection_NBE6",f="recentUpdates_R_ZF",U="updateItem_owMb",y="updateHeaderContent_g4Fv",C="updateHeader_kIgK",w="updateDot_wqRv",S="updateDate_g0wx",T="updateContent_ymzk",A="updateTitle_vBxy",I="updateExcerpt_MZq0",B="updateImage_5Vyd",D="readMore_KbWX",M=()=>{const{recentUpdates:e}=(0,b.P_)("docusaurus-plugin-recent-updates")||[];return(0,v.jsxs)("div",{className:K,children:[(0,v.jsx)("h2",{children:"\u6700\u8fd1\u66f4\u65b0"}),(0,v.jsx)("div",{className:f,children:e.map(((e,s)=>(0,v.jsx)("div",{className:U,children:(0,v.jsxs)("div",{className:y,children:[(0,v.jsxs)("div",{className:C,children:[(0,v.jsx)("div",{className:w}),(0,v.jsx)("div",{className:S,children:new Date(e.date).toLocaleString()})]}),(0,v.jsxs)("div",{className:T,children:[(0,v.jsx)("h3",{className:A,children:(0,v.jsx)("a",{href:e.path,children:e.title})}),(0,v.jsx)("p",{className:I,children:e.excerpt}),e.image&&(0,v.jsx)("img",{src:e.image,alt:e.title,className:B}),(0,v.jsx)("a",{href:e.path,className:D,children:"\u67e5\u770b\u539f\u6587"})]})]})},s)))})]})};const E=function(){return(0,v.jsxs)(t.A,{title:"Home",description:"Description of your site",children:[(0,v.jsx)("header",{className:(0,n.A)("hero hero--primary",r.heroBanner),children:(0,v.jsx)("div",{className:"container",children:(0,v.jsxs)("div",{className:r.heroContent,children:[(0,v.jsxs)("div",{className:r.heroText,children:[(0,v.jsx)("h1",{className:"hero__title",children:"\u77e5\u8bc6\u5e93&\u5e2e\u52a9\u4e2d\u5fc3"}),(0,v.jsx)("p",{className:"hero__subtitle",children:"Baklib\u662f\u4e00\u6b3e\u96c6\u5728\u7ebf\u7f16\u8f91+\u5b58\u50a8+\u5c55\u73b0\u5206\u4eab\u4e3a\u4e00\u4f53\u7684\u77e5\u8bc6\u7ba1\u7406\u5de5\u5177\u3002\u652f\u6301Markdown\u3001\u8868\u683c\u3001\u4ee3\u7801\u5757\u7b49\u4e13\u4e1a\u7f16\u8f91\u80fd\u529b\uff0c\u652f\u6301\u591a\u79cd\u683c\u5f0f\u7684\u6587\u6863\u3001\u89c6\u9891\u4e0a\u4f20\uff0c\u8ba9\u4f60\u4e13\u6ce8\u4e8e\u521b\u4f5c\u3002"}),(0,v.jsx)("div",{className:r.buttons,children:(0,v.jsx)(l.A,{className:"button button--secondary button--lg",to:"/docs/intro",children:"\u9a6c\u4e0a\u5f00\u59cb"})})]}),(0,v.jsx)("div",{className:r.heroImage,children:(0,v.jsx)("object",{type:"image/svg+xml",data:"/img/saas-3.svg","aria-label":"SaaS Illustration"})})]})})}),(0,v.jsxs)("main",{className:r.mainContent,children:[(0,v.jsx)(k,{}),(0,v.jsx)(M,{})]})]})}}}]);