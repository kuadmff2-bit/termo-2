(() => {
  'use strict';

  const style = document.createElement('style');
  style.textContent = `
    .board-answer-reveal-ui{
      perspective:900px!important;
      box-shadow:0 14px 30px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.08)!important;
    }

    .board-answer-word-ui{
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      gap:0!important;
      letter-spacing:0!important;
      white-space:nowrap!important;
      perspective:760px!important;
      transform-style:preserve-3d!important;
      line-height:1!important;
    }

    .board-answer-word-ui > span{
      display:inline-block!important;
      min-width:0!important;
      width:auto!important;
      margin:0 .015em!important;
      padding:0!important;
      opacity:0;
      transform-origin:50% 50%;
      transform-style:preserve-3d;
      backface-visibility:hidden;
      animation-name:termuAnswerReveal3DV2!important;
      animation-duration:.92s!important;
      animation-timing-function:cubic-bezier(.18,.78,.18,1)!important;
      animation-fill-mode:forwards!important;
      text-shadow:0 2px 0 rgba(0,0,0,.16),0 7px 14px rgba(0,0,0,.28)!important;
      will-change:transform,opacity,filter;
    }

    @keyframes termuAnswerReveal3DV2{
      0%{
        opacity:0;
        transform:perspective(700px) rotateY(-105deg) rotateX(18deg) translateZ(-34px) translateX(-10px) scale(.82);
        filter:brightness(.55) blur(1.5px);
      }
      42%{
        opacity:1;
        transform:perspective(700px) rotateY(18deg) rotateX(-5deg) translateZ(18px) translateX(1px) scale(1.08);
        filter:brightness(1.18) blur(0);
      }
      68%{
        transform:perspective(700px) rotateY(-7deg) rotateX(2deg) translateZ(7px) scale(1.025);
      }
      84%{
        transform:perspective(700px) rotateY(3deg) translateZ(2px) scale(1.01);
      }
      100%{
        opacity:1;
        transform:perspective(700px) rotateY(0) rotateX(0) translateZ(0) translateX(0) scale(1);
        filter:brightness(1) blur(0);
      }
    }

    @media (prefers-reduced-motion:reduce){
      .board-answer-word-ui > span{
        animation-duration:.01ms!important;
        animation-delay:0ms!important;
      }
    }
  `;
  document.head.appendChild(style);

  function syncReveal(root = document) {
    root.querySelectorAll?.('.board-answer-word-ui').forEach(word => {
      [...word.children].forEach((letter, index) => {
        letter.style.animationDelay = `${index * 210}ms`;
      });
    });
  }

  syncReveal();

  const observer = new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches('.board-answer-word-ui') || node.querySelector('.board-answer-word-ui')) {
          syncReveal(node.matches('.board-answer-word-ui') ? node.parentElement || node : node);
        }
      }
    }
  });

  observer.observe(document.body, { childList:true, subtree:true });
})();
