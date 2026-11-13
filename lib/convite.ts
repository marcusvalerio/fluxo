// Mensagens pra compartilhar o Fluxo, escritas pelo Fluximetro.
export const SITE = "fluxofinanca.vercel.app"

const CORPO = `Sou um cofrinho que mora dentro do Fluxo, um app que mostra quanto ainda cabe no seu mês, todo dia.

O que eu faço:
- Te mostro quanto dá pra gastar por dia sem apertar
- Você lança gasto do jeito que fala: "ifood 52 e uber 23"
- Antes de comprar, pergunta pra mim se cabe. Eu respondo com sinceridade. Às vezes até demais
- Quando cai o salário, faço uma retrospectiva do mês. Com nota. E julgamento

Tá em fase de testes, então tá tudo liberado e de graça.`

/** Convite geral: pra mandar pra qualquer amigo. */
export const conviteGeral = (de?: string) => `Oi, aqui é o Fluximetro.

${de ? `Quem me apresentou pra você foi ${de}.` : "Alguém que gosta de você me apresentou."} Disse que você ia gostar de mim. Ou viu seu extrato. Não sei, não perguntei.

${CORPO}

Abre ${SITE} no Safari e adiciona à tela de início.

Te espero lá. Traz o iFood, que eu já conheço ele.`

/** Quando o acesso é criado no painel: vai com e-mail e senha temporária. */
export const conviteAcesso = (nome: string, email: string, senha: string) => `Oi, ${nome.split(" ")[0]}. Aqui é o Fluximetro.

Te criaram um acesso ao Fluxo e eu vim pessoalmente avisar. Pessoalmente no sentido de cofrinho.

${CORPO}

Seu acesso:
${SITE}
E-mail: ${email}
Senha temporária: ${senha}

No primeiro acesso você cria a sua senha. Depois adiciona à tela de início pelo Safari.

Te espero lá. Traz o iFood, que eu já conheço ele.`

/** Abre o compartilhar do iPhone; se não der, copia. Devolve o que aconteceu. */
export async function compartilhar(text: string): Promise<"shared" | "copied" | "fail"> {
  try { if (navigator.share) { await navigator.share({ text }); return "shared" } } catch (e) { if ((e as Error).name === "AbortError") return "fail" }
  try { await navigator.clipboard.writeText(text); return "copied" } catch { return "fail" }
}
