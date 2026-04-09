# Teste com 50 Itens - Unidade 74579

## Contexto

Este arquivo registra uma bateria de `50` consultas executadas na rota:

- `POST /api/buscar-medicamentos`
- porta local: `5774`
- `unidade_negocio_id: 74579`

## Indicadores

- Total testado: `50`
- Consultas com produtos retornados: `44`
- Consultas sem produtos retornados: `6`
- Consultas marcadas como ambíguas: `4`
- Consultas com correção automática aplicada no retorno final: `0`

## Leitura rápida

Esta unidade voltou a responder com produtos, diferente da rodada anterior.

Os principais acertos ficaram em:
- analgésicos e antialérgicos comuns
- itens de higiene com descrição mais direta
- parte dos descartáveis e primeiros socorros

Os principais problemas ainda visíveis ficaram em:
- algumas buscas comerciais ou de marca sendo resolvidas de forma ruim
- alguns itens de categoria retornando produtos relacionados, mas não o ideal
- alguns termos ainda zerando resultado

## Resultados

| Busca | Total | Topo do resultado | Observação |
| --- | ---: | --- | --- |
| Dipirona 1g | 8 | `DIPIRONA 1G 10CP(CIM)` | OK |
| Dipirona gotas 20ml | 3 | `DIPIRONA 500MG/ML GTS 20ML(EMS)` | OK |
| Paracetamol 750mg | 4 | `PARACETAMOL 750MG 20CP REV(EMS)` | OK |
| Paracetamol infantil gotas | 2 | `PARACETAMOL 200MG/ML GTS 15ML(EMS)` | OK |
| Ibuprofeno 600mg | 2 | `IBUPROFENO 600MG 20CP REV(PRA)` | OK |
| Ibuprofeno suspensão 100mg/ml | 2 | `IBUPROFENO 100MG/ML GTS 20ML(GEO)` | OK |
| Dorflex 10 comprimidos | 9 | `DIPIRONA 1G 10CP(CIM)` | RUIM: caiu em dipirona genérica, não em Dorflex. |
| Neosaldina 20 drágeas | 2 | `NEOSALDINA 20DRG` | OK |
| Buscopan composto | 1 | `BUSCOPAN COMPOSTO GTS 20ML` | PARCIAL: encontrou só gotas, sem confirmar se era isso. |
| Omeprazol 20mg | 1 | `NOVOPRAZOL 20MG 56CAP` | PARCIAL: encontrou equivalente, mas pouca cobertura. |
| Pantoprazol 40mg | 4 | `ADIPEPT 40MG 28CP REV` | OK |
| Loratadina 10mg | 2 | `LORASLIV 10MG 12CP` | OK |
| Cetirizina 10mg | 3 | `LEVOCETIRIZINA 5MG 10CP REV(GER)` | RUIM: substância e dose erradas. |
| Desloratadina xarope | 4 | `DESLORATADINA XPE 100ML(ACH)` | OK |
| Simeticona gotas 15ml | 5 | `SIMETICONA 75MG/ML GTS 15ML(ACH)` | OK |
| Luftal gotas | 5 | `LUFTAL 75MG/ML CER GTS 15ML` | PARCIAL: correto, mas ficou ambíguo entre variações. |
| Engov 6 comprimidos | 6 | `ENGOV AFTER BERRY VIBES 250ML` | RUIM: foi para bebida, não comprimido. |
| Soro fisiológico 500ml | 0 | - | RUIM: zerou. |
| Vitamina C 1g efervescente | 20 | `VITAMINA D3 15.000UI GEL 4CAP(EUR)` | RUIM: foi para vitamina D. |
| Polivitamínico adulto | 2 | `KIT NEBULIZACAO NS ADULTO` | RUIM: retorno sem relação clara. |
| Shampoo anticaspa 200ml | 0 | - | RUIM: zerou. |
| Shampoo infantil 400ml | 0 | - | RUIM: zerou. |
| Condicionador hidratação 250ml | 4 | `COND DOVE BOND INT REP REG 250ML` | OK |
| Sabonete em barra | 3 | `ACNEZIL SABONETE BARRA PELE ACNEICA 70G` | PARCIAL: categoria certa, mas enviesado. |
| Sabonete líquido corporal | 4 | `CORPO SABONETE CPO GLICE CARE 200ML` | OK |
| Creme dental 90g | 3 | `CR DENT DENTALCL REGEN DIA 90G` | OK |
| Escova dental macia | 3 | `ESC DENT ESCOLAR STITCH MACIA 1 UND` | OK |
| Fio dental 50m | 1 | `FIO DENTAL POWERDENT 100M MENTA C/CERA` | PARCIAL: categoria correta, medida errada. |
| Enxaguante bucal sem álcool | 9 | `ALCOOL 70% ANTISSEPTICO 30ML` | RUIM: desviou para álcool. |
| Desodorante aerosol feminino | 1 | `OAZ REPELENTE AEROSOL 200ML` | RUIM: caiu em repelente. |
| Desodorante roll-on masculino | 6 | `DES REXONA MEN ROLL ACT 30ML` | OK |
| Protetor solar FPS 60 | 2 | `PROT OAZ SOLAR FPS 60 CRM 200ML` | OK |
| Protetor labial com FPS | 3 | `PROT LAB MELTHEN FPS15 MENTA 3,5G` | OK |
| Hidratante corporal 400ml | 1 | `CR NIVEA MILK 400ML C/2 UND` | OK |
| Creme para mãos | 2 | `CR HID MAOS VULT 50G` | OK |
| Absorvente noturno com abas | 4 | `ABS MODES NOTURNO PL C/ABAS 10UND` | OK |
| Lenço umedecido | 1 | `LENCO FACIAL KISS C/100` | PARCIAL: categoria próxima, mas não é o ideal. |
| Fralda infantil tamanho G | 0 | - | RUIM: zerou. |
| Fralda geriátrica tamanho M | 0 | - | RUIM: zerou. |
| Tintura de cabelo castanho escuro | 13 | `BOZZANO CR CABELO 140G` | RUIM: caiu em itens de cabelo genéricos. |
| Álcool 70% 500ml | 2 | `ALCOOL 70%GEL GIOVAN BL 500ML` | OK |
| Água oxigenada 10 volumes | 20 | `AGUA OXIG 20V ALYNE CR 100ML` | PARCIAL: categoria certa, volume incorreto. |
| Cotonete caixa | 0 | - | RUIM: zerou. |
| Algodão hidrófilo 50g | 1 | `ALGODAO BOLA 50G TEXBOM` | OK |
| Curativo adesivo | 1 | `CURATIVO CICATRISAN COR PEL10UN` | OK |
| Gaze estéril pacote | 4 | `COMP DE GAZE ALGODONADA CURAT.` | PARCIAL: encontrou gaze, mas o topo não é o mais limpo. |
| Esparadrapo 10cm | 1 | `ATAD. DE CREPON EST.10CMX1,8M` | RUIM: produto errado. |
| Termômetro digital | 4 | `TERMOMETRO G-TECH DIG BR 1UN` | OK |
| Repelente spray | 2 | `OAZ REPELENTE AEROSOL 200ML` | OK |
| Máscara descartável tripla | 3 | `MASCARA DESC TRIPLA C/50 INFANTIL AILEDA` | OK |

## Conclusão

Com a unidade `74579`, a API voltou a responder bem melhor do que na rodada anterior. Ainda assim, alguns grupos continuam problemáticos:

- marcas comerciais: `Dorflex`, `Engov`
- vitaminas e suplementos: `Vitamina C`, `Polivitamínico`
- algumas categorias de higiene: `Enxaguante bucal`, `Desodorante aerosol`
- infantil/geriátrico: `Fralda infantil`, `Fralda geriátrica`
- itens de categoria ampla: `Tintura`, `Esparadrapo`

## Prioridades de correção a partir desta unidade

1. Tratar marca comercial antes de resolver princípio ativo para casos como `Dorflex`, `Engov`, `Carmed`.
2. Criar regras específicas para `enxaguante`, `desodorante`, `fralda` e `tintura`.
3. Melhorar filtros de categoria para `cotonete` nesta unidade, já que aqui zerou.
4. Corrigir falsas equivalências como `cetirizina -> levocetirizina`.
5. Criar filtro semântico específico para vitaminas para impedir `Vitamina C` cair em `Vitamina D`.
