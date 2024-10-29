import { useCallback, createEffect, useRef } from 'solid-js';
import InputAutoWidth from './InputAutoWidth';

export function InputSetter({
	title,
	defaultValue,
	onSubmit,
}: {
	title?: string;
	defaultValue: string;
	onSubmit: (value: string) => void;
}) {
	const draft = useRef(defaultValue);
	const autoWidthIpt = useRef<HTMLInputElement>(null);
	const keyDown = useRef(false);

	const updateSetting = useCallback(() => {
		const value = autoWidthIpt!.value.trim();
		onSubmit(value);
	}, [onSubmit]);

	createEffect(() => {
		autoWidthIpt!.value = defaultValue;
		draft = defaultValue;
	}, [defaultValue]);

	return (
		<div>
			{title && <p class="leading-4 text font-semibold">{title}</p>}
			<InputAutoWidth
				ref={autoWidthIpt}
				defaultValue={defaultValue}
				placeholder="Enter to submit"
				class="leading-3 min-w-52 border-b-2 text-2xl font-medium transition border-mg2 hover:border-fg2 focus:border-fg2"
				onKeyDown={(e) => {
					keyDown = true;
					if (e.key === 'Escape') {
						draft = defaultValue;
						autoWidthIpt?.blur();
					}
					if (e.key === 'Enter') {
						draft = autoWidthIpt!.value;
						updateSetting();
						autoWidthIpt?.blur();
					}
				}}
				onKeyUp={() => (keyDown = true)}
				onBlur={() => (autoWidthIpt!.value = draft)}
			/>
		</div>
	);
}
