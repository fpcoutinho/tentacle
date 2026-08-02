# Tentacle

Backend em Node.js + Express + TypeScript para o projeto Abstractio.

O foco inicial é manter uma API enxuta node com express, typescript, PostgreSQL, validação com Zod e Firebase Auth.

## Estrutura do banco

O modelo abaixo resume as entidades principais do backend e como elas se relacionam.

```mermaid
flowchart LR
	FA[Firebase Auth<br/>futuro provedor de identidade]

	U[Users<br/>id<br/>name<br/>gender<br/>shell_balance]

	A[User Avatar Settings<br/>user_id<br/>avatar_idx<br/>active_frame<br/>active_accessory<br/>active_color]

	T[Trails<br/>id<br/>slug<br/>title<br/>short_title<br/>order_index]

	M[Missions<br/>id<br/>trail_id<br/>slug<br/>title<br/>emblem<br/>theory<br/>has_minigame<br/>order_index<br/>summary/bibliography/faqs jsonb]

	Q[Mission Questions<br/>id<br/>mission_id<br/>slug<br/>kind main/extra<br/>prompt<br/>explanation<br/>max_reward_shells<br/>order_index]

	O[Mission Question Options<br/>id<br/>question_id<br/>label<br/>is_correct<br/>order_index<br/>wrong_explanation]

	C[User Mission Completions<br/>user_id<br/>mission_id<br/>completed_at]

	S[User Submissions<br/>id<br/>user_id<br/>question_id<br/>answer_option_id<br/>attempt_number<br/>is_correct<br/>earned_shells<br/>idempotency_key]

	L[Shell Ledger<br/>id<br/>user_id<br/>delta<br/>reason<br/>balance_before<br/>balance_after]

	I[Shop Items<br/>id<br/>item_type<br/>code<br/>name<br/>price_shells]

	UI[User Inventory<br/>id<br/>user_id<br/>item_id<br/>acquisition_reason]

	B[Bookmarks<br/>user_id<br/>mission_id<br/>data]

	FA --> U
	U --> A
	U --> C
	U --> S
	U --> L
	U --> UI
	U --> B

	T --> M
	M --> Q
	M --> C
	Q --> O
	Q --> S
	M --> B

	I --> UI
	UI --> A
```

## Leitura rápida do modelo

- `users` guarda o perfil base e o saldo atual de conchas.
- `user_avatar_settings` concentra o visual ativo do usuário — `active_frame`/`active_accessory`/`active_color` referenciam `user_inventory` (FK composta por `user_id`), garantindo que só é possível equipar item já possuído
- `trails` e `missions` organizam o conteúdo pedagógico; `missions` carrega `summary`/`bibliography`/`faqs` como JSONB por serem conteúdo esparso (só ~3 das 29 missões usam cada um). Não guarda `icon` nem HTML de minigame — são decisão de apresentação, responsabilidade do front.
- `mission_questions` (principal ou extra, via `kind`) e `mission_question_options` armazenam a estrutura das questões — `order_index` é obrigatório porque o front valida a resposta certa pelo índice da opção, não pelo texto. `max_reward_shells` vive na pergunta (não na missão), porque a principal e os extras têm curvas de recompensa diferentes.
- `user_mission_completions` registra a conclusão de uma missão separadamente das submissões — necessário porque uma missão pode ser concluída sem pergunta principal (marcação manual).
- `user_submissions` é um log de cada tentativa (uma linha por tentativa, certa ou errada — não uma linha por missão); `attempt_number` decide a recompensa.
- `shell_ledger` é o histórico financeiro e a fonte de verdade das movimentações.
- `shop_items` e `user_inventory` representam a loja e os itens desbloqueados.
- `bookmarks` salva o ponto de retomada do usuário em uma missão.

> Modelo fechado na Fase 2.1.5, validado linha a linha contra o frontend (`Abstractio`).
