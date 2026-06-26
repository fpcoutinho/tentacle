# Abstractio Backend

Backend em Node.js + Express + TypeScript para o projeto Abstractio.

O foco inicial é manter uma API enxuta node com express, typescript, PostgreSQL, validação com Zod e Firebase Auth.

## Estrutura do banco

O modelo abaixo resume as entidades principais do backend e como elas se relacionam.

```mermaid
flowchart LR
	FA[Firebase Auth<br/>futuro provedor de identidade]

	U[Users<br/>uid<br/>name<br/>gender<br/>shell_balance]

	A[User Avatar Settings<br/>avatar_idx<br/>active_border<br/>active_accessory<br/>active_color<br/>active_emblem]

	T[Trails<br/>slug<br/>title<br/>description<br/>order_index]

	M[Missions<br/>trail_id<br/>slug<br/>title<br/>content_md<br/>reward_shells]

	Q[Mission Questions<br/>mission_id<br/>prompt_md<br/>question_type]

	O[Question Options<br/>question_id<br/>label_md<br/>is_correct]

	S[User Submissions<br/>uid<br/>mission_id<br/>answers_json<br/>is_correct<br/>earned_shells<br/>idempotency_key]

	L[Shell Ledger<br/>uid<br/>delta<br/>reason<br/>balance_before<br/>balance_after]

	I[Shop Items<br/>item_type<br/>code<br/>name<br/>price_shells]

	UI[User Inventory<br/>uid<br/>item_id<br/>acquisition_reason]

	B[Bookmarks<br/>uid<br/>mission_id<br/>data]

	FA --> U
	U --> A
	U --> S
	U --> L
	U --> UI
	U --> B

	T --> M
	M --> Q
	Q --> O
	M --> S
	M --> B

	I --> UI
	S --> L
	I --> A
```

## Leitura rápida do modelo

- `users` guarda o perfil base e o saldo atual de conchas
- `user_avatar_settings` concentra o visual ativo do usuário
- `trails` e `missions` organizam o conteúdo pedagógico
- `mission_questions` e `question_options` armazenam a estrutura das questões
- `user_submissions` registra as respostas enviadas e a idempotência
- `shell_ledger` é o histórico financeiro e a fonte de verdade das movimentações
- `shop_items` e `user_inventory` representam a loja e os itens desbloqueados
- `bookmarks` salva o ponto de retomada do usuário em uma missão