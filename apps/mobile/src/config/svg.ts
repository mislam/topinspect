/**
 * SVG Assets Registration for Mobile App
 * This file registers all app-specific SVG assets with the UI library
 */

import { registerSvgAssets } from "@the/ui/expo"

// Import SVG assets
import apple from "../../assets/svg/apple.svg"
import bagOutline from "../../assets/svg/bag-outline.svg"
import bag from "../../assets/svg/bag.svg"
import chatbubblesOutline from "../../assets/svg/chatbubbles-outline.svg"
import chatbubbles from "../../assets/svg/chatbubbles.svg"
import cubeOutline from "../../assets/svg/cube-outline.svg"
import cube from "../../assets/svg/cube.svg"
import female from "../../assets/svg/female.svg"
import gearOutline from "../../assets/svg/gear-outline.svg"
import gear from "../../assets/svg/gear.svg"
import google from "../../assets/svg/google.svg"
import homeOutline from "../../assets/svg/home-outline.svg"
import home from "../../assets/svg/home.svg"
import logo from "../../assets/svg/logo.svg"
import male from "../../assets/svg/male.svg"

// Register SVG assets with the UI library
registerSvgAssets({
	logo,
	male,
	female,
	home,
	homeOutline,
	cube,
	cubeOutline,
	bag,
	bagOutline,
	gear,
	gearOutline,
	chatbubbles,
	chatbubblesOutline,
	google,
	apple,
})
