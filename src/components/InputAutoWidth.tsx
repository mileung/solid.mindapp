import { useRef, InputHTMLAttributes, forwardRef, createEffect } from 'solid-js';

const maxWidth = 500;
const resize = (node: HTMLInputElement) => {
	node.style.width = '0px';
	node.style.width = Math.min(maxWidth, node.scrollWidth) + 'px';
};

const InputAutoWidth = forwardRef((props: InputHTMLAttributes<HTMLInputElement>, parentRef) => {
	const internalRef = useRef<null | HTMLInputElement>(null);

	createEffect(() => {
		setTimeout(() => internalRef && resize(internalRef), 0);
	}, [props.value, props.defaultValue]);

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
					parentRef && (parentRef = ref);
				}
			}}
			onChange={(e) => {
				props.onChange?.(e);
				internalRef && resize(internalRef);
			}}
		/>
	);
});

export default InputAutoWidth;
