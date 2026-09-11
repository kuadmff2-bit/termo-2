(() => {
  'use strict';

  const style = document.createElement('style');
  style.textContent = `
    /* A resposta no topo aparece rápida e limpa. */
    .board-answer-label-ui{
      display:none!important;
    }

    .board-answer-reveal-ui{
      min-height:54px!important;
      padding:10px 12px!important;
      gap:0!important;
      display:grid!important;
      place-items:center!important;
      animation:termuAnswerQuick .16s ease-out both!important;
      box-shadow:0 10px 22px rgba(0,0,0,.22)!important;
    }

    .board-answer-word-ui{
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      gap:0!important;
      letter-spacing:0!important;
      line-height:1!important;
      white-space:nowrap!important;
    }

    .board-answer-word-ui>span{
      display:inline-block!important;
      min-width:0!important;
      width:auto!important;
      margin:0 .012em!important;
      padding:0!important;
      opacity:1!important;
      transform:none!important;
      filter:none!important;
      animation:none!important;
      text-shadow:0 2px 8px rgba(0,0,0,.2)!important;
    }

    /* O efeito 3D acontece nas próprias casas do tabuleiro. */
    .row .tile.flip{
      --termu-reveal-bg:var(--absent);
      --termu-reveal-border:var(--absent);
      --termu-reveal-color:#d7dbe2;
      transform-style:preserve-3d!important;
      backface-visibility:hidden!important;
      transform-origin:50% 50%!important;
      animation-name:termuTileReveal3D!important;
      animation-duration:.48s!important;
      animation-timing-function:cubic-bezier(.2,.72,.2,1)!important;
      animation-fill-mode:both!important;
      will-change:transform,background-color,border-color,box-shadow!important;
    }

    .row .tile.correct.flip{
      --termu-reveal-bg:var(--correct);
      --termu-reveal-border:var(--correct);
      --termu-reveal-color:#fff;
    }
    .row .tile.present.flip{
      --termu-reveal-bg:var(--present);
      --termu-reveal-border:var(--present);
      --termu-reveal-color:#fff;
    }
    .row .tile.absent.flip{
      --termu-reveal-bg:var(--absent);
      --termu-reveal-border:var(--absent);
      --termu-reveal-color:#d7dbe2;
    }

    /* Mesma coluna revela junta em todos os tabuleiros. */
    .row .tile.flip:nth-child(1){animation-delay:0ms!important}
    .row .tile.flip:nth-child(2){animation-delay:95ms!important}
    .row .tile.flip:nth-child(3){animation-delay:190ms!important}
    .row .tile.flip:nth-child(4){animation-delay:285ms!important}
    .row .tile.flip:nth-child(5){animation-delay:380ms!important}

    @keyframes termuTileReveal3D{
      0%{
        background:var(--tile-current)!important;
        border-color:var(--tile-current-border)!important;
        color:var(--text)!important;
        transform:perspective(720px) rotateX(0deg) translateZ(0) scale(1);
        box-shadow:0 0 0 rgba(0,0,0,0);
      }
      46%{
        background:var(--tile-current)!important;
        border-color:var(--tile-current-border)!important;
        color:var(--text)!important;
        transform:perspective(720px) rotateX(88deg) translateZ(12px) scale(.97);
        box-shadow:0 12px 18px rgba(0,0,0,.28);
      }
      50%{
        background:var(--termu-reveal-bg)!important;
        border-color:var(--termu-reveal-border)!important;
        color:var(--termu-reveal-color)!important;
        transform:perspective(720px) rotateX(-88deg) translateZ(12px) scale(.97);
        box-shadow:0 12px 18px rgba(0,0,0,.28);
      }
      76%{
        background:var(--termu-reveal-bg)!important;
        border-color:var(--termu-reveal-border)!important;
        color:var(--termu-reveal-color)!important;
        transform:perspective(720px) rotateX(12deg) translateZ(5px) scale(1.025);
        box-shadow:0 8px 14px rgba(0,0,0,.2);
      }
      100%{
        background:var(--termu-reveal-bg)!important;
        border-color:var(--termu-reveal-border)!important;
        color:var(--termu-reveal-color)!important;
        transform:perspective(720px) rotateX(0deg) translateZ(0) scale(1);
        box-shadow:none;
      }
    }

    @keyframes termuAnswerQuick{
      from{opacity:0;transform:translateY(-4px)}
      to{opacity:1;transform:translateY(0)}
    }

    @media(prefers-reduced-motion:reduce){
      .row .tile.flip{
        animation-duration:.01ms!important;
        animation-delay:0ms!important;
      }
      .board-answer-reveal-ui{animation-duration:.01ms!important}
    }
  `;

  document.head.appendChild(style);
})();
