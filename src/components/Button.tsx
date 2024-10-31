import { createMemo, JSX } from 'solid-js';
import { A } from '@solidjs/router';

export function Button(props: {
	on?: boolean;
	href?: string;
	onClick?: JSX.EventHandlerUnion<
		HTMLAnchorElement,
		MouseEvent,
		JSX.EventHandler<HTMLAnchorElement, MouseEvent>
	>;
	label: string;
	state?: any;
}) {
	const { on, href, onClick = () => {}, label, state } = props;
	const Tag = createMemo(() => (href ? A : 'button'));

	return (
		// @ts-ignore
		<Tag
			class={`block w-fit text-lg font-semibold rounded px-2 border-2 transition hover:text-fg1 ${
				on ? 'text-fg1 border-fg1' : 'text-fg2 border-fg2'
			}`}
			{...{ href, onClick, state }}
		>
			{label}
		</Tag>
	);
}
