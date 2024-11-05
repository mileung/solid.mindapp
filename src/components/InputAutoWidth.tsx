import { createEffect, JSX } from 'solid-js';

const maxWidth = 500;
const resize = (node: HTMLInputElement) => {
	node.style.width = '0px';
	node.style.width = Math.min(maxWidth, node.scrollWidth) + 'px';
};

const InputAutoWidth = (props: JSX.InputHTMLAttributes<HTMLInputElement> & { parentRef?: any }) => {
	let { parentRef } = props;
	let internalRef: undefined | HTMLInputElement;

	createEffect(() => {
		setTimeout(() => internalRef && resize(internalRef), 0);
	});

	return (
		<input
			// TODO: this doesn't work. Find another way to avoid flash of cut-off element
			// {...{ style: { width: '100%' } }} // so wide inputs aren't cut off on mount
			{...props}
			ref={(ref) => {
				ref && resize(ref);
				internalRef = ref;
				if (typeof parentRef === 'function') {
					parentRef(ref);
				} else {
					// parentRef && (parentRef = ref);
				}
			}}
			onInput={(e) => {
				// props.onChange?.(e);
				internalRef && resize(internalRef);
			}}
		/>
	);
};

export default InputAutoWidth;
