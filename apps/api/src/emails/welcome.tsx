import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	pixelBasedPreset,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@the/email"

interface Props {
	appName: string
	username: string
	dashboardUrl: string
	supportUrl: string
}

export default function ({
	appName = "MyApp",
	username = "John Doe",
	dashboardUrl = "https://www.myapp.com/dashboard",
	supportUrl = "https://www.myapp.com/support",
}: Props) {
	return (
		<Html>
			<Head />
			<Tailwind config={{ presets: [pixelBasedPreset] }}>
				<Body className="bg-slate-50 font-sans">
					<Preview>Your account is ready. Let's get started!</Preview>
					<Container className="mx-auto bg-white pb-12">
						<Section className="px-8">
							<Heading className="text-2xl text-blue-700">{appName}</Heading>
							<Hr className="my-5 border-slate-200" />
							<Text className="text-left text-base leading-6 text-slate-900">Hi {username},</Text>
							<Text className="text-left text-base leading-6 text-slate-900">
								We're excited to have you on board. Your account is all set and ready to go.
							</Text>
							<Text className="text-left text-base leading-6 text-slate-900">
								Get started by exploring your dashboard, where you'll find everything you need to
								get the most out of {appName}.
							</Text>
							<Section className="my-8 text-center">
								<Button
									className="rounded bg-blue-700 px-5 py-3 text-center text-base font-semibold leading-none text-white no-underline"
									href={dashboardUrl}
								>
									Go to your Dashboard
								</Button>
							</Section>
							<Text className="text-left text-base leading-6 text-slate-900">
								Need help? We're here for you. Visit our{" "}
								<Link className="text-blue-700" href={supportUrl}>
									support center
								</Link>{" "}
								for quick answers and to reach our team anytime.
							</Text>
							<Text className="text-left text-base leading-6 text-slate-900">
								Let's get started,
							</Text>
							<Text className="text-left text-base leading-6 text-slate-900">
								&mdash; The {appName} team
							</Text>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	)
}
