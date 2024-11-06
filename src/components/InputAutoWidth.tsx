import { createEffect, JSX } from 'solid-js';

const maxWidth = 500;
const resize = (node: HTMLInputElement) => {
	node.style.width = '0px';
	node.style.width = Math.min(maxWidth, node.scrollWidth) + 'px';
};

const InputAutoWidth = (props: JSX.InputHTMLAttributes<HTMLInputElement>) => {
	let internalRef: undefined | HTMLInputElement;

	createEffect(() => {
		setTimeout(() => internalRef && resize(internalRef), 0);
	});

	return (
		<input
			// TODO: this doesn't work. Find another way to avoid flash of cut-off element
			// {...{ style: { width: '100%' } }} // so wide inputs aren't cut off on mount
			{...props}
			ref={(t) => {
				t && resize(t);
				internalRef = t;
				typeof props.ref === 'function' && props.ref(t);
			}}
			onInput={(e) => {
				// idk why I need this
				// @ts-ignore
				props.onInput?.(e);
				internalRef && resize(internalRef);
			}}
		/>
	);
};

export default InputAutoWidth;
