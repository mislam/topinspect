import { useState } from "react"

import { Button, Text } from "@prism/ui/expo"

import { View } from "react-native"

import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition"

export const Speech = () => {
	const [recognizing, setRecognizing] = useState(false)
	const [transcript, setTranscript] = useState("")

	useSpeechRecognitionEvent("start", () => setRecognizing(true))
	useSpeechRecognitionEvent("end", () => setRecognizing(false))
	useSpeechRecognitionEvent("result", (event) => {
		setTranscript(event.results[0]?.transcript)
	})
	useSpeechRecognitionEvent("error", (event) => {
		console.log("error code:", event.error, "error message:", event.message)
	})

	const handleStart = async () => {
		const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
		if (!result.granted) {
			console.warn("Permissions not granted", result)
			return
		}
		// Start speech recognition
		ExpoSpeechRecognitionModule.start({
			lang: "en-US",
			interimResults: true,
			continuous: false,
		})
	}

	return (
		<View className="mb-6 mt-16 w-full justify-between gap-4">
			<Text className="bg-gray-200 text-2xl font-bold">{transcript}</Text>
			{!recognizing ? (
				<Button variant="default" onPress={handleStart}>
					Start
				</Button>
			) : (
				<Button variant="danger" onPress={() => ExpoSpeechRecognitionModule.stop()}>
					Stop
				</Button>
			)}
		</View>
	)
}
