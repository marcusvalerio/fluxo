// Estilo do ícone do app. Fica num cookie pra o manifesto e o ícone do iPhone saírem certos do servidor.
// Vale na próxima vez que o app for adicionado à tela inicial (o sistema guarda o ícone da instalação).
export type Icone = "claro" | "escuro" | "laranja"
export const ICONES: Icone[] = ["claro", "escuro", "laranja"]
export const asIcone = (v?: string): Icone => (ICONES.includes(v as Icone) ? (v as Icone) : "claro")
export const iconeAtual = (): Icone => { try { return asIcone(document.cookie.match(/(?:^|; )fluxo-icone=(\w+)/)?.[1]) } catch { return "claro" } }
export const setIcone = (v: Icone) => { document.cookie = `fluxo-icone=${v}; path=/; max-age=31536000; samesite=lax` }
