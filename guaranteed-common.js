(() => {
  const words = ['fosco','filha','ferra','fuzil','surfa','surfe','surfo','força','porta','fonte','terra','carro','carta','casal','caixa','campo','canto','custo','festa','firme','fraco','fruta','grupo','janta','jeito','jovem','limpo','lindo','livro','lugar','matar','morto','mundo','norte','nuvem','olhar','pedra','perto','plano','praia','preto','prova','quase','renda','roupa','sabor','santo','sexta','sinal','solto','tempo','tenso','terno','tonto','troca','verde','vidro','viver','volta','focar','focos','forma','forte','frase','ferro','forro','fundo','farto'];
  const merge = (base) => [...new Set([...(Array.isArray(base) ? base : []), ...words])];
  window.TERMO_COMMON_BR = merge(window.TERMO_COMMON_BR);
  window.TERMO_VALID_BR = merge(window.TERMO_VALID_BR);
})();
