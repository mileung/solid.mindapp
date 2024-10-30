// @refresh reload
import { createPrefersDark } from '@solid-primitives/media';
import { createHandler, StartServer } from '@solidjs/start/server';

export default createHandler(() => (
	<StartServer
		document={({ assets, children, scripts }) => {
			return (
				<html lang="en">
					<head>
						<meta charset="utf-8" />
						<meta name="viewport" content="width=device-width, initial-scale=1" />
						<link rel="icon" href="/mindapp-logo.svg" />
						{assets}
						<script>
							{/* localStorage.theme  */}
							document.documentElement.classList.add('dark');
						</script>
					</head>
					<body>
						<div id="app" class="">
							{children}
						</div>
						{scripts}
					</body>
				</html>
			);
		}}
	/>
));
