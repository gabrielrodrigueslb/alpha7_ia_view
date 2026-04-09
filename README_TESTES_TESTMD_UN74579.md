# Teste dos Produtos do test.md - Unidade 74579

## Indicadores

- Total testado: `100`
- Consultas com produtos: `85`
- Consultas sem produtos: `15`
- Consultas com correção automática: `0`
- Consultas ambíguas: `14`

## Resultados

| Busca | Total | Corrigido | Método | Top 3 |
| --- | ---: | --- | --- | --- |
| dipirona 1g | 8 | - | principio_ativo_concentracao + descricao + principio_ativo_por_ids_concentracao + filtro_atributos_concentracao:1g | DIPIRONA 1G 10CP(CIM) <br> DIPIRONA 1G 10CP(EMS) <br> DIPIRONA 1G 20CP(PRA) |
| dipirona gotas | 8 | - | principio_ativo_forma + descricao + principio_ativo_por_ids_forma + filtro_atributos_forma:gotas/gts/gt/drops | ABERALGINA 500MG/ML GTS 20ML <br> ATROVERAN DIP 500MG/ML GTS 20ML <br> DIPIMED 500MG/ML GTS 10ML |
| dipirona infantil gotas | 7 | - | principio_ativo_forma + descricao + principio_ativo_por_ids_forma + filtro_atributos_forma:gotas/gts/gt/drops | ABERALGINA 500MG/ML GTS 20ML <br> DIPIMED 500MG/ML GTS 10ML <br> DIPIMED 500MG/ML GTS 20ML |
| paracetamol 750 | 5 | - | principio_ativo_sem_filtros + descricao + principio_ativo_por_ids_sem_filtros | PARACETAMOL 750MG 20CP REV(EMS) <br> PARACETAMOL 750MG 20CP(GLO) <br> PARACETAMOL 750MG 20CP(MED) |
| paracetamol infantil gotas | 2 | - | principio_ativo_forma + descricao + filtro_atributos_forma:gotas/gts/gt/drops | PARACETAMOL 200MG/ML GTS 15ML(EMS) <br> PARACETAMOL BEBE 100MG GTS 15(EMS) |
| tylenol infantil | 4 | - | descricao | MASC OMRON INFANTIL NEB MSL 1UN <br> MASCARA DESC INFANTIL C/10 HEL <br> MASCARA DESC INFANTIL C/10 TUR |
| ibuprofeno 600 | 2 | - | principio_ativo_sem_filtros + descricao + principio_ativo_por_ids_sem_filtros | IBUPROFENO 600MG 20CP REV(PRA) <br> IBUPROFENO 600MG 20CP REV(VIT) |
| ibuprofeno infantil | 6 | - | principio_ativo_sem_filtros + descricao + principio_ativo_por_ids_sem_filtros | IBUPROFENO 100MG/ML GTS 20ML(MED) <br> ALIVIUM 100MG/ML GTS 20ML <br> IBUPRIL 100MG/ML GTS 20ML |
| advil infantil | 6 | - | descricao + principio_ativo_resolvido_descricao + principio_ativo_por_ids_sem_filtros | ALIVIUM 100MG/ML GTS 20ML <br> IBUPRIL 100MG/ML GTS 20ML <br> IBUPRIL 50MG/ML GTS 30ML |
| dorflex com 10 | 12 | - | descricao + principio_ativo_resolvido_descricao + principio_ativo_por_ids_sem_filtros | DORFLEX DIP 1G 10CP <br> ABERALGINA 500MG/ML GTS 20ML <br> ANADOR 1G 10CP |
| neosaldina | 3 | - | descricao + principio_ativo_por_ids_sem_filtros | NEOSALDINA ENV 10DRG <br> DORALGINA ENV 4DRG <br> DORFLEX MAX 8CP |
| buscopan composto | 1 | - | descricao + principio_ativo_resolvido_descricao + principio_ativo_por_ids_sem_filtros | BUSCOPAN COMPOSTO GTS 20ML |
| luftal gotas | 5 | - | descricao + principio_ativo_resolvido_descricao + principio_ativo_por_ids_forma + filtro_atributos_forma:gotas/gts/gt/drops | LUFTAL 75MG/ML CER GTS 15ML <br> LUFTAL 75MG/ML CER GTS 30ML <br> LUFTAL 75MG/ML GTS INF 15ML |
| simeticona gotas | 6 | - | principio_ativo_forma + descricao + principio_ativo_por_ids_forma + filtro_atributos_forma:gotas/gts/gt/drops | SIMETICONA 75MG/ML GTS 10ML(ACH) <br> SIMETICONA 75MG/ML GTS 10ML(AIR) <br> SIMETICONA 75MG/ML GTS 15ML(ACH) |
| omeprazol 20 | 1 | - | principio_ativo_sem_filtros + descricao + principio_ativo_por_ids_sem_filtros + fallback_principio_ativo_ids + principio_ativo_por_ids_sem_filtros | NOVOPRAZOL 20MG 56CAP |
| pantoprazol 40 | 2 | - | principio_ativo_sem_filtros + descricao + principio_ativo_por_ids_sem_filtros | PANTOPRAZOL 40MG 28CP REV L.R(EUR) <br> PANTOPRAZOL 40MG 42CP REV L.R(GER) |
| loratadina 10mg | 2 | - | principio_ativo_concentracao + descricao + principio_ativo_por_ids_concentracao + filtro_atributos_concentracao:10mg | LORASLIV 10MG 12CP <br> LORATAMED 10MG 12CP |
| desloratadina xarope | 5 | - | principio_ativo_forma + descricao + principio_ativo_por_ids_forma | DESLORATADINA XPE 100ML(ACH) <br> DESLORATADINA XPE 100ML(EUR) <br> DESLORATADINA XPE 100ML(PRA) |
| cetirizina | 3 | - | principio_ativo_sem_filtros + descricao + principio_ativo_por_ids_sem_filtros | LEVOCETIRIZINA 5MG 10CP REV(GER) <br> ZALERV 5MG 10CP REV <br> ZINA ODT 5MG C/10 COMP  |
| allegra 120 | 3 | - | descricao + principio_ativo_resolvido_descricao + principio_ativo_por_ids_sem_filtros | ALLEGRA 120MG 10CP REV <br> FEXOFENADINA 120MG 10CP REV(MED) <br> FEXOFENADINA 120MG 10CP REV(RAN) |
| polaramine xarope | 1 | - | descricao + principio_ativo_resolvido_descricao + principio_ativo_por_ids_forma + fallback_principio_ativo_ids + principio_ativo_por_ids_forma | HISTAMIN 0,4MG/ML XPE 100ML |
| nimesulida 100 | 2 | - | principio_ativo_sem_filtros + descricao + principio_ativo_por_ids_sem_filtros | NIMESULIDA 100MG 12CP(EMS) <br> NIMESULIDA 100MG 12CP(GER) |
| amoxicilina 500 | 20 | - | principio_ativo_sem_filtros + descricao + principio_ativo_por_ids_sem_filtros | AMOXICILINA+CLAV POT 500+125MG 21CP R(SAN) <br> AMOXICILINA 400MG/5ML 100ML(GER) <br> AMOXICILINA 500MG 21CAP GEL D(EMS) |
| azitromicina 500 | 2 | - | principio_ativo_sem_filtros + descricao + principio_ativo_por_ids_sem_filtros | AZITROMICINA 500MG 3CP REV(EUR) <br> AZITROMICINA 500MG 3CP REV(MED) |
| soro fisiologico 500ml | 0 | - | descricao | - |
| soro de nariz | 3 | - | principio_ativo_sem_filtros + descricao + principio_ativo_por_ids_sem_filtros | MARESIS BABY 0,9% 360 SP 100ML <br> NASONEW 0,9% SPR 50ML <br> RINOSORO XT 0,9% GTS NAS 30ML |
| vitamina c efervescente | 20 | - | principio_ativo_sem_filtros + descricao + principio_ativo_por_ids_sem_filtros | VITAMINA D3 15.000UI GEL 4CAP(EUR) <br> VITAMINA D3 50.000UI 4CAP MOLE(NEO) <br> VITAMINA D3 50.000UI 8CAP MOLE(NEO) |
| polivitaminico adulto | 2 | - | principio_ativo_sem_filtros + descricao | KIT NEBULIZACAO NS ADULTO <br> NEUTROFER COLINA DHA 60CAP |
| lavitan mulher | 1 | - | descricao | LAVITAN 50+ MULHER 60CP |
| engov | 6 | - | descricao + principio_ativo_por_ids_sem_filtros | ENGOV AFTER BERRY VIBES 250ML <br> ENGOV AFTER CITRUS 250ML <br> ENGOV AFTER PINK LEMON 250ML |
| epocler | 2 | - | descricao + principio_ativo_resolvido_descricao + principio_ativo_por_ids_sem_filtros + fallback_principio_ativo_ids + principio_ativo_por_ids_sem_filtros | DRAMIN 50MG ENV 1CAP GEL MOLE <br> DRAMIN CAPSGEL 50MG 10CAP |
| sal de fruta eno | 20 | - | principio_ativo_sem_filtros + descricao + principio_ativo_por_ids_sem_filtros | SAL DE FRUTA ENO GUAR 100G <br> SAL DE FRUTA ENO GUAR 2ENV 5G <br> SAL DE FRUTA ENO LIM 2ENV 5G |
| dramim | 3 | - | principio_ativo_sem_filtros | BENALET MEL+LIMAO 12PAST <br> ENDCOFF MEL+LIM 12PAST <br> ENDCOFF MENTA 12PAST |
| melatonina | 8 | - | principio_ativo_sem_filtros + descricao + principio_ativo_por_ids_sem_filtros | MELATONINA 200MG 90CP OROD <br> MELATONINA 500DOSES 20ML <br> MELATONINA MARACUJA 30ML  |
| xarope pra tosse infantil | 20 | - | principio_ativo_sem_filtros + descricao + principio_ativo_por_ids_sem_filtros | ACICLOVIR 200MG 30CP(PRA) <br> ACICLOVIR 50MG/G CR DERM 10G(PRA) <br> ACICLOVIR 200MG 25CP(PHA) |
| pastilha pra garganta | 20 | - | principio_ativo_sem_filtros + descricao + principio_ativo_por_ids_sem_filtros | ACICLOVIR 200MG 30CP(PRA) <br> ACICLOVIR 50MG/G CR DERM 10G(PRA) <br> ACICLOVIR 200MG 25CP(PHA) |
| pomada pra assadura | 2 | - | principio_ativo_sem_filtros + descricao + principio_ativo_por_ids_sem_filtros | ACICLOVIR 50MG/G CR DERM 10G(PRA) <br> ACICLOVIR 50MG/G CR DERM 10G(GER) |
| hipoglos | 3 | - | descricao | HIPOGLOS CR PROT AMEND 80G <br> HIPOGLOS CR PROT ORIG 40G <br> HIPOGLOS POM ASSAD TRANSP 30G |
| bepantol derma | 4 | - | descricao | BEPANTOL DERMA CAB SOL 50ML <br> BEPANTOL DERMA LAB REG 7,5ML <br> BEPANTOL DERMA SPRAY HIDRATANTE 50ML |
| pomada pra queimadura | 2 | - | principio_ativo_sem_filtros + descricao + principio_ativo_por_ids_sem_filtros | ACICLOVIR 50MG/G CR DERM 10G(PRA) <br> ACICLOVIR 50MG/G CR DERM 10G(GER) |
| shampoo anticaspa | 0 | - | descricao + filtro_categoria_nao_medicamento_descricao + filtro_categoria_nao_medicamento | - |
| shampoo antiqueda | 0 | - | descricao + filtro_categoria_nao_medicamento_descricao + filtro_categoria_nao_medicamento | - |
| shampoo infantil johnsons | 0 | - | descricao + filtro_categoria_nao_medicamento_descricao + filtro_categoria_nao_medicamento | - |
| condicionador hidratacao | 6 | - | descricao + filtro_atributos_forma:condicionador/cond/conditioner | V. CABELOS COND REC. DE HIDRATACAO 325ML <br> COND DOVE HIDRAT HIALU VIT 190ML <br> COND DOVE HIDRAT HIALU VIT 370ML |
| mascara capilar hidratacao | 6 | - | descricao + filtro_categoria_nao_medicamento_descricao + filtro_categoria_nao_medicamento | MASCARA CIR VABENE TR BRA 50UN <br> MASCARA CIR VABENE TR ROS 50UN <br> MASCARA DESC INFANTIL C/10 HEL |
| sabonete em barra dove | 5 | - | descricao + filtro_atributos_forma:sabonete/sab/soap | ACNEZIL SABONETE BARRA PELE ACNEICA 70G <br> ACNEZIL SABONETE BARRA PELE OLEOSA 70G <br> CORPO SABONETE CPO GLICE CARE 200ML |
| sabonete liquido corporal | 4 | - | descricao + filtro_atributos_forma:sabonete/sab/soap | CORPO SABONETE CPO GLICE CARE 200ML <br> CORPO SABONETE CPO GLICE FRESH 200ML <br> SAB LIQUIDO SNOOPY 200ML |
| sabonete intimo | 4 | - | descricao + filtro_atributos_forma:sabonete/sab/soap | ACNEZIL SABONETE BARRA PELE ACNEICA 70G <br> ACNEZIL SABONETE BARRA PELE OLEOSA 70G <br> CORPO SABONETE CPO GLICE CARE 200ML |
| creme dental colgate | 1 | - | descricao + filtro_atributos_forma:creme/cr/cremes/cream | CR DENT COLGATE LUM WH CAR 70G |
| creme dental sensodyne | 3 | - | descricao + filtro_atributos_forma:creme/cr/cremes/cream | CR DENT DENTALCL GEL BATM 100G <br> CR DENT DENTALCL GEL PEPPA 100 <br> CR DENT DENTALCL PEP TUT-FR 50 |
| escova dental macia | 3 | - | descricao | ESC DENT ESCOLAR STITCH MACIA 1 UND <br> ESC DENT INF MASHA+COPO MACIA 1UN <br> ESC DENT JUVENIL STITCH L2P1 MACIA |
| fio dental | 1 | - | descricao + filtro_categoria_nao_medicamento_descricao + filtro_categoria_nao_medicamento | FIO DENTAL POWERDENT 100M MENTA C/CERA |
| enxaguante bucal sem alcool | 9 | - | descricao + filtro_categoria_nao_medicamento_descricao + filtro_categoria_nao_medicamento | ALCOOL 70% ANTISSEPTICO 30ML <br> ALCOOL 70%GEL ASEPLYNE 92G <br> ALCOOL 70%GEL ASEPLYNE AL VE 1L |
| desodorante aerosol feminino | 1 | - | descricao | OAZ REPELENTE AEROSOL 200ML |
| desodorante roll on masculino | 6 | - | descricao | DES REXONA MEN ROLL ACT 30ML <br> DES REXONA MEN ROLL V8 50ML <br> DES REXONA ROLL ACT EMOT 50ML |
| hidratante corporal nivea | 8 | - | descricao | CR BARB NIVEA ORIG 65G <br> CR BARB NIVEA SENS 65G <br> CR FAC NIVEA ANTISS 100G |
| creme para maos | 2 | - | descricao + filtro_categoria_nao_medicamento_descricao + filtro_categoria_nao_medicamento | CR HID MAOS VULT 50G <br> CR MONANGE MAOS Q10/VIT E 75G |
| protetor solar fps 60 | 2 | - | descricao | PROT OAZ SOLAR FPS 60 CRM 200ML <br> KIT SUNLESS PROT F50 120G + KIDS FPS60 120G |
| protetor solar infantil | 4 | - | descricao | PROT OAZ SOLAR FPS50 BABY SHARK CR 125ML <br> PROT OAZ SOLAR FPS50 BOB ESPONJ CR 125ML <br> PROT SOLAR SUNLESS KIDS F50 120G |
| protetor labial com fps | 3 | - | descricao | PROT LAB MELTHEN FPS15 MENTA 3,5G <br> PROT LAB MELTHEN FPS15 MOR 3,5G <br> PROT LAB MELTHEN FPS15 TRAD 3,5G |
| absorvente noturno com abas | 4 | - | descricao | ABS MODES NOTURNO PL C/ABAS 10UND <br> ABS LADYSOFT MAX SUAVE C/ABAS 16UN <br> ABS LADYSOFT NOT SUAVE C/ABAS 16UN |
| absorvente diario | 15 | - | descricao | ABS ALWAYS NO G SUA AB 10UN <br> ABS ALWAYS NO LON SUA AB 8UN <br> ABS ALWAYS NOT 28CM SEC AB 16U |
| lenco umedecido bebe | 1 | - | descricao + filtro_categoria_nao_medicamento_descricao + filtro_categoria_nao_medicamento | LENCO DE BOLSO KISS C/10 |
| fralda pampers g | 0 | - | descricao + filtro_categoria_nao_medicamento_descricao + filtro_categoria_nao_medicamento | - |
| fralda infantil m | 0 | - | descricao + filtro_categoria_nao_medicamento_descricao + filtro_categoria_nao_medicamento | - |
| fralda geriatrica m | 0 | - | descricao | - |
| cotonete caixa | 0 | - | descricao + filtro_categoria_nao_medicamento_descricao + filtro_categoria_nao_medicamento | - |
| algodao hidrofilo | 8 | - | descricao + filtro_categoria_nao_medicamento_descricao + filtro_categoria_nao_medicamento | ALGODAO HIDROF ROLO 500G TEXBOM <br> ALGODAO BOLA 50G TEXBOM <br> ALGODAO CREMER DISC 100UN |
| agua oxigenada 10 volumes | 20 | - | descricao | AGUA OXIG 20V ALYNE CR 100ML <br> AGUA OXIG 30V ALYNE CR 100ML <br> AGUA OXIG 40V ALYNE CR 100ML |
| removedor de esmalte | 0 | - | nenhum método encontrou resultados | - |
| acetona | 10 | - | principio_ativo_sem_filtros + descricao | REMOV ALYNE S/ACETONA MOR 100M <br> OMCILON A ORABASE 1MG/G 10G <br> TRIANCINOLONA 1MG/G POM 10G(EMS) |
| esmalte vermelho | 2 | - | principio_ativo_sem_filtros | IVERMECTINA 6MG 4CP(GER) <br> IVERMECTINA 6MG 4CP(NEO) |
| tinta de cabelo castanho escuro | 13 | - | principio_ativo_sem_filtros + descricao | BOZZANO CR CABELO 140G <br> CABELOS CO WASH OND/CACHOS/CRESPOS 25 <br> CABELOS CR CAP DEFRIZANTE LISOS 100ML |
| tinta loiro claro | 6 | - | principio_ativo_sem_filtros + descricao | CHIP CLARO TURBO C/REC 1UN <br> CLARO CHIP TC SN FLEX 1UN <br> CLARITROMICINA 250MG/5ML 60ML(EMS) |
| alcool 70 500ml | 1 | - | descricao + filtro_categoria_nao_medicamento_descricao + filtro_categoria_nao_medicamento + filtro_atributos_medida:500ml | ALCOOL GEL HYGEA 70% 500ML |
| curativo band aid | 3 | - | descricao + filtro_categoria_nao_medicamento_descricao + filtro_categoria_nao_medicamento | CUR BAND-AID SKIN-FL 25UN <br> CUR BAND-AID TR 40UN <br> CUR BAND-AID TR VAR 30UN |
| gaze esteril | 6 | - | descricao + filtro_categoria_nao_medicamento_descricao + filtro_categoria_nao_medicamento | COMP DE GAZE ALGODONADA CURAT. <br> COMP DE GAZE CONVIVA C/10 <br> COMP GAZE HERIKA 7,5X7,5 10UN(AME) |
| compressa de gaze | 6 | - | descricao + filtro_categoria_nao_medicamento_descricao + filtro_categoria_nao_medicamento | COMP DE GAZE ALGODONADA CURAT. <br> COMP DE GAZE CONVIVA C/10 <br> COMP GAZE HERIKA 7,5X7,5 10UN(AME) |
| esparadrapo 10cm | 1 | - | descricao | ATAD. DE CREPON EST.10CMX1,8M |
| micropore | 0 | - | nenhum método encontrou resultados | - |
| termometro digital | 4 | - | descricao + filtro_categoria_nao_medicamento_descricao + filtro_categoria_nao_medicamento | TERMOMETRO G-TECH DIG BR 1UN <br> TERMOMETRO G-TECH DIG LAR 1UN <br> TERMOMETRO G-TECH DIG ROS 1UN |
| mascara descartavel | 6 | - | descricao + filtro_categoria_nao_medicamento_descricao + filtro_categoria_nao_medicamento | MASCARA CIR DESC DESCAR 50 UNI <br> MASCARA DESC INFANTIL C/10 HEL <br> MASCARA DESC INFANTIL C/10 TUR |
| repelente spray | 2 | - | descricao + filtro_categoria_nao_medicamento_descricao + filtro_categoria_nao_medicamento | OAZ REPELENTE AEROSOL 200ML <br> CALADRYL REPELENTE 100ML |
| repelente infantil | 2 | - | descricao + filtro_categoria_nao_medicamento_descricao + filtro_categoria_nao_medicamento | OAZ REPELENTE INFANTIL 8H 100ML  <br> CALADRYL REPELENTE 100ML |
| preservativo skin | 1 | - | descricao + principio_ativo_resolvido_descricao + principio_ativo_por_ids_sem_filtros | DESONIDA 0,5MG/G POM DERM 30G(GER) |
| lubrificante intimo | 0 | - | nenhum método encontrou resultados | - |
| teste de gravidez | 7 | - | principio_ativo_sem_filtros + descricao | TESTE DE GRAVIDEZ CONSTATE TIRA <br> TESTE GRAV CLEARBLUE PL CAN 2U <br> TESTE GRAV CLEARBLUE PLUS CAN 1U |
| aparelho de pressao digital | 5 | - | descricao | AP PRESSAO G-TECH DIG BRAÇO AUTOM BSP UN <br> AP PRESSAO G-TECH DIG PUL 3D 1 <br> AP PRESSAO MULTIL PUL HC204 1U |
| inalador nebulizador | 0 | - | descricao + principio_ativo_por_ids_sem_filtros | - |
| seringa 5ml | 1 | - | descricao + principio_ativo_resolvido_descricao + principio_ativo_por_ids_sem_filtros | AMOXICILINA 400MG/5ML 100ML(GER) |
| luva descartavel | 0 | - | descricao | - |
| bolsa termica gel | 3 | - | descricao + filtro_atributos_forma:gel/gels/geleia | BOLSA TERMICA CREMER GEL 400G  <br> BOLSA TERMICA GEL HIDROLIGHT 200G <br> BOLSA TERMICA GEL HIDROLIGHT 400G BT101 |
| antiacido | 0 | - | nenhum método encontrou resultados | - |
| remedio pra azia | 20 | - | principio_ativo_sem_filtros + descricao + principio_ativo_por_ids_sem_filtros | ACICLOVIR 200MG 30CP(PRA) <br> ACICLOVIR 50MG/G CR DERM 10G(PRA) <br> ACICLOVIR 200MG 25CP(PHA) |
| laxante | 0 | - | nenhum método encontrou resultados | - |
| leite de magnesia | 5 | - | principio_ativo_sem_filtros + descricao + principio_ativo_por_ids_sem_filtros | LEITE DE MAG ENO TRAD 120ML <br> LEITE DE MAG MAGMAX HOR 100ML <br> LEITE DE MAG PHILL HOR 120ML |
| probiotico adulto | 1 | - | descricao | KIT NEBULIZACAO NS ADULTO |
| remedio pra colica | 20 | - | principio_ativo_sem_filtros + descricao + principio_ativo_por_ids_sem_filtros | ACICLOVIR 200MG 30CP(PRA) <br> ACICLOVIR 50MG/G CR DERM 10G(PRA) <br> ACICLOVIR 200MG 25CP(PHA) |
| remedio pra alergia | 20 | - | principio_ativo_sem_filtros + descricao + principio_ativo_por_ids_sem_filtros | ACICLOVIR 200MG 30CP(PRA) <br> ACICLOVIR 50MG/G CR DERM 10G(PRA) <br> ACICLOVIR 200MG 25CP(PHA) |
| remedio pra enjoo | 20 | - | principio_ativo_sem_filtros + descricao + principio_ativo_por_ids_sem_filtros | ACICLOVIR 200MG 30CP(PRA) <br> ACICLOVIR 50MG/G CR DERM 10G(PRA) <br> ACICLOVIR 200MG 25CP(PHA) |
